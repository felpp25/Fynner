/**
 * Seed de dados para desenvolvimento.
 *
 * Roda apenas:
 * - Em modo __DEV__
 * - Uma única vez por instalação (flag em AsyncStorage)
 *
 * Cria:
 * - 3 mercados (Extra, Carrefour, Atacadão)
 * - Catálogo de produtos típicos de supermercado
 * - 2 compras finalizadas + 1 ativa
 * - 5 itens na lista de compras
 *
 * Para forçar re-seed durante o desenvolvimento, basta remover a flag via
 * AsyncStorage.removeItem(SEED_KEY) ou desinstalar o app no celular.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDb } from "./db";
import { createMarket } from "./queries/markets";
import { findOrCreateProduct } from "./queries/products";
import { createSession, finalizeSession } from "./queries/sessions";
import { addItem, updateSessionTotal } from "./queries/items";
import { addToList } from "./queries/list";

const SEED_KEY = "@fynner/seed-applied-v1";

interface SeedItem {
  produto: string;
  preco: number;
  quantidade: number;
}

interface SeedPurchase {
  mercadoId: number;
  itens: SeedItem[];
  orcamento?: number;
  finalizada: boolean;
}

async function seedPurchase(
  purchase: SeedPurchase
): Promise<number> {
  const sessionId = await createSession(
    purchase.mercadoId,
    purchase.orcamento ?? 0
  );
  for (const item of purchase.itens) {
    const produtoId = await findOrCreateProduct(item.produto);
    await addItem(sessionId, produtoId, item.preco, item.quantidade);
  }
  await updateSessionTotal(sessionId);
  if (purchase.finalizada) {
    await finalizeSession(sessionId);
  }
  return sessionId;
}

async function isAlreadySeeded(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SEED_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

async function markSeeded(): Promise<void> {
  try {
    await AsyncStorage.setItem(SEED_KEY, "true");
  } catch {
    // Falha em marcar não é crítico — pior caso, refaz o seed na próxima.
    // Mas como os INSERTs duplicariam, a verificação extra abaixo evita isso.
  }
}

/**
 * Verificação extra: se já há mercados/compras, considera seeded.
 * Isso protege contra o caso em que o AsyncStorage foi limpo mas o
 * banco persistiu (raríssimo, mas evita duplicação de dados).
 */
async function hasExistingData(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM mercados"
  );
  return (row?.count ?? 0) > 0;
}

export async function runSeed(): Promise<void> {
  if (!__DEV__) return;

  if (await isAlreadySeeded()) return;
  if (await hasExistingData()) {
    await markSeeded();
    return;
  }

  console.log("[seed] populando banco com dados de desenvolvimento...");

  // 1. Mercados — cores diferentes para o comparativo ficar visual.
  const extraId = await createMarket("Extra", { cor: "#e63946" });
  const carrefourId = await createMarket("Carrefour", { cor: "#1d3557" });
  const atacadaoId = await createMarket("Atacadão", { cor: "#f4a261" });

  // 2. Compra finalizada no Atacadão (3 itens, R$ 50,70)
  await seedPurchase({
    mercadoId: atacadaoId,
    finalizada: true,
    orcamento: 100,
    itens: [
      { produto: "Arroz Camil 5kg", preco: 22.9, quantidade: 1 },
      { produto: "Feijão Carioca 1kg", preco: 8.9, quantidade: 2 },
      { produto: "Óleo de Soja 900ml", preco: 9.99, quantidade: 1 },
    ],
  });

  // 3. Compra finalizada no Carrefour (2 itens, R$ 19,80)
  await seedPurchase({
    mercadoId: carrefourId,
    finalizada: true,
    orcamento: 50,
    itens: [
      { produto: "Leite Integral 1L", preco: 5.49, quantidade: 2 },
      { produto: "Pão de Forma", preco: 8.9, quantidade: 1 },
    ],
  });

  // 4. Compra ATIVA no Extra (3 itens)
  await seedPurchase({
    mercadoId: extraId,
    finalizada: false,
    orcamento: 150,
    itens: [
      { produto: "Arroz Camil 5kg", preco: 24.5, quantidade: 1 },
      { produto: "Café Pilão 500g", preco: 18.9, quantidade: 1 },
      { produto: "Açúcar Refinado 1kg", preco: 4.5, quantidade: 2 },
    ],
  });

  // 5. Lista de compras pré-configurada (5 itens, todos pendentes)
  for (const produto of [
    "Detergente",
    "Sabão em Pó",
    "Papel Higiênico",
    "Banana Prata",
    "Tomate",
  ]) {
    const produtoId = await findOrCreateProduct(produto);
    await addToList(produtoId, 1);
  }

  await markSeeded();
  console.log("[seed] concluído ✓");
}
