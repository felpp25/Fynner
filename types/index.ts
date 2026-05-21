/**
 * Tipos de domínio do Fynner.
 *
 * Estes tipos espelham o schema SQLite definido em database/schema.ts
 * (será implementado no Stage 2). Mantê-los aqui centralizados facilita
 * o consumo em queries, contexts e componentes.
 */

export interface Mercado {
  id: number;
  nome: string;
  endereco?: string;
  cor: string;
  /**
   * 1 = mercado aparece na lista. 0 = soft-deletado (sumiu da lista mas
   * histórico de compras foi preservado). Migration 002.
   */
  ativo: number;
  created_at: string;
  /**
   * Data ISO (YYYY-MM-DD) da última compra finalizada neste mercado.
   * Vem do LEFT JOIN em getAllMarkets — `undefined` se nunca houve compra.
   */
  ultima_visita?: string;
}

export interface Compra {
  id: number;
  mercado_id: number;
  data: string;
  total: number;
  orcamento: number;
  status: "ativa" | "finalizada";
  created_at: string;
}

export interface CompraComMercado extends Compra {
  mercado_nome: string;
  mercado_cor: string;
  total_itens: number;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  created_at: string;
}

export interface ItemCompra {
  id: number;
  compra_id: number;
  produto_id: number;
  preco: number;
  quantidade: number;
  subtotal: number;
  created_at: string;
}

export interface ItemComProduto extends ItemCompra {
  produto_nome: string;
  produto_categoria: string;
}

/**
 * Lista de compras nomeada (ex: "Compras semanais", "Churrasco do sábado").
 * Cada lista contém múltiplos `ListaItem` vinculados via `lista_id`.
 */
export interface Lista {
  id: number;
  nome: string;
  /** Nome de um ícone Ionicons (ex: 'cart-outline'). */
  icone: string;
  created_at: string;
  updated_at: string;
}

export interface ListaComProgresso extends Lista {
  total_itens: number;
  itens_coletados: number;
}

export interface ListaItem {
  id: number;
  lista_id: number;
  produto_id: number;
  quantidade_desejada: number;
  coletado: boolean;
  ordem: number;
}

export interface ListaItemComProduto extends ListaItem {
  produto_nome: string;
  produto_categoria: string;
}

export interface HistoricoPreco {
  data: string;
  mercado_nome: string;
  preco: number;
}

/** Períodos pré-definidos para filtros e comparativos. */
export type FilterPeriodo = "semana" | "mes" | "3meses" | "tudo";

export interface MarketComparison {
  mercado_id: number;
  mercado_nome: string;
  mercado_cor: string;
  ultima_visita: string;
  /** Gasto médio (AVG) das compras finalizadas dentro do período selecionado. */
  total_medio: number;
  total_visitas: number;
}
