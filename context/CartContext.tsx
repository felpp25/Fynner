/**
 * CartContext — estado central do carrinho ativo.
 *
 * Responsabilidades:
 * - Ao montar, busca se existe uma sessão ativa no banco e a carrega.
 * - Expõe a sessão ativa, mercado, itens, total atual.
 * - Centraliza as actions (addItem, updateQuantity, removeItem, selectMarket,
 *   finalizeSession, setBudget) que tocam no banco e refrescam o estado.
 *
 * Padrão: depois de qualquer mutação, recarregamos do banco. Não tentamos
 * manter o estado em sync manualmente para evitar drift entre UI e DB. O
 * custo é baixo (SQLite local é rápido).
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { getMarketById } from "@/database/queries/markets";
import {
  addItem as addItemDb,
  getItemsBySession,
  removeItem as removeItemDb,
  updateQuantity as updateQuantityDb,
  updatePrice as updatePriceDb,
  updateSessionTotal,
} from "@/database/queries/items";
import { findOrCreateProduct } from "@/database/queries/products";
import {
  createSession,
  finalizeSession as finalizeSessionDb,
  getActiveSession,
  getAnyActiveSession,
  setSessionBudget,
} from "@/database/queries/sessions";
import type { Compra, ItemComProduto, Mercado } from "@/types";

export interface CartContextValue {
  loading: boolean;
  sessaoAtiva: Compra | null;
  mercadoAtivo: Mercado | null;
  itens: ItemComProduto[];
  totalAtual: number;

  selectMarket: (mercadoId: number) => Promise<void>;
  setBudget: (orcamento: number) => Promise<void>;
  addItem: (
    nome: string,
    preco: number,
    quantidade: number
  ) => Promise<void>;
  updateQuantity: (itemId: number, quantidade: number) => Promise<void>;
  updatePrice: (itemId: number, preco: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  finalizeSession: () => Promise<void>;
  reload: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [sessaoAtiva, setSessaoAtiva] = useState<Compra | null>(null);
  const [mercadoAtivo, setMercadoAtivo] = useState<Mercado | null>(null);
  const [itens, setItens] = useState<ItemComProduto[]>([]);
  const [totalAtual, setTotalAtual] = useState(0);

  /**
   * Carrega tudo a partir do banco. Tenta achar uma sessão ativa de qualquer
   * mercado. Se houver, popula tudo. Se não, deixa zerado.
   */
  const reload = useCallback(async () => {
    try {
      const ativa = await getAnyActiveSession();
      if (!ativa) {
        setSessaoAtiva(null);
        setMercadoAtivo(null);
        setItens([]);
        setTotalAtual(0);
        return;
      }

      const mercado = await getMarketById(ativa.mercado_id);
      const itensSessao = await getItemsBySession(ativa.id);

      setSessaoAtiva({
        id: ativa.id,
        mercado_id: ativa.mercado_id,
        data: ativa.data,
        total: ativa.total,
        orcamento: ativa.orcamento,
        status: ativa.status,
        created_at: ativa.created_at,
      });
      setMercadoAtivo(mercado);
      setItens(itensSessao);
      setTotalAtual(ativa.total);
    } catch (err) {
      console.error("[CartContext] erro ao carregar:", err);
    }
  }, []);

  // Carrega no mount.
  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  /**
   * Seleciona um mercado: se já existe sessão ativa naquele mercado, retoma;
   * senão, cria nova. Não fecha automaticamente sessões ativas em outros
   * mercados — o usuário pode ter esquecido a compra anterior em aberto e
   * vamos preservar até ele decidir finalizar.
   */
  const selectMarket = useCallback(
    async (mercadoId: number) => {
      let ativa = await getActiveSession(mercadoId);
      if (!ativa) {
        const newId = await createSession(mercadoId);
        ativa = await getActiveSession(mercadoId);
        if (!ativa) throw new Error(`Falha ao criar sessão #${newId}`);
      }
      await reload();
    },
    [reload]
  );

  const setBudget = useCallback(
    async (orcamento: number) => {
      if (!sessaoAtiva) return;
      await setSessionBudget(sessaoAtiva.id, orcamento);
      await reload();
    },
    [sessaoAtiva, reload]
  );

  const addItem = useCallback(
    async (nome: string, preco: number, quantidade: number) => {
      if (!sessaoAtiva) {
        throw new Error("Selecione um mercado antes de adicionar itens.");
      }
      const produtoId = await findOrCreateProduct(nome);
      await addItemDb(sessaoAtiva.id, produtoId, preco, quantidade);
      await updateSessionTotal(sessaoAtiva.id);
      await reload();
    },
    [sessaoAtiva, reload]
  );

  const updateQuantity = useCallback(
    async (itemId: number, quantidade: number) => {
      if (!sessaoAtiva) return;
      await updateQuantityDb(itemId, quantidade);
      await updateSessionTotal(sessaoAtiva.id);
      await reload();
    },
    [sessaoAtiva, reload]
  );

  const updatePrice = useCallback(
    async (itemId: number, preco: number) => {
      if (!sessaoAtiva) return;
      await updatePriceDb(itemId, preco);
      await updateSessionTotal(sessaoAtiva.id);
      await reload();
    },
    [sessaoAtiva, reload]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!sessaoAtiva) return;
      await removeItemDb(itemId);
      await updateSessionTotal(sessaoAtiva.id);
      await reload();
    },
    [sessaoAtiva, reload]
  );

  const finalizeSession = useCallback(async () => {
    if (!sessaoAtiva) return;
    await finalizeSessionDb(sessaoAtiva.id);
    await reload();
  }, [sessaoAtiva, reload]);

  const value: CartContextValue = {
    loading,
    sessaoAtiva,
    mercadoAtivo,
    itens,
    totalAtual,
    selectMarket,
    setBudget,
    addItem,
    updateQuantity,
    updatePrice,
    removeItem,
    finalizeSession,
    reload,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}
