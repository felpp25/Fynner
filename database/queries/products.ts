/**
 * Queries da tabela `produtos`.
 *
 * Produtos crescem com o uso: cada nome único vira um produto. O fluxo
 * típico no carrinho é "find or create" — busca pelo nome, e se não existir,
 * cria automaticamente.
 *
 * A comparação de nome é case-insensitive (COLLATE NOCASE) para evitar
 * duplicatas tipo "Arroz" vs "arroz".
 */
import { getDb } from "../db";
import type { HistoricoPreco, Produto } from "@/types";

/**
 * Busca um produto pelo nome (case-insensitive). Se não existir, cria.
 * Retorna o id do produto.
 *
 * Esta é a função chave usada pelo carrinho ao adicionar um item — o usuário
 * digita o nome e nós resolvemos para um id sem precisar gerenciar IDs manualmente.
 */
export async function findOrCreateProduct(nome: string): Promise<number> {
  const trimmed = nome.trim();
  if (!trimmed) {
    throw new Error("Nome de produto não pode ser vazio.");
  }

  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM produtos WHERE nome = ? COLLATE NOCASE",
    trimmed
  );
  if (existing) return existing.id;

  const result = await db.runAsync(
    "INSERT INTO produtos (nome) VALUES (?)",
    trimmed
  );
  return result.lastInsertRowId;
}

/**
 * Busca produtos cujo nome contém o termo. Usado para autocomplete.
 * Limita a 10 resultados para a UI não ficar pesada.
 */
export async function searchProducts(query: string): Promise<Produto[]> {
  const term = query.trim();
  if (!term) return [];

  const db = await getDb();
  return db.getAllAsync<Produto>(
    `SELECT * FROM produtos
     WHERE nome LIKE ? COLLATE NOCASE
     ORDER BY nome ASC
     LIMIT 10`,
    `%${term}%`
  );
}

/** Lista todos os produtos cadastrados, ordem alfabética. */
export async function getAllProducts(): Promise<Produto[]> {
  const db = await getDb();
  return db.getAllAsync<Produto>(
    "SELECT * FROM produtos ORDER BY nome COLLATE NOCASE ASC"
  );
}

/**
 * Histórico de preço de um produto: cada vez que foi comprado, em qual
 * mercado, por quanto, em qual data. Mais recentes primeiro.
 *
 * Usado no modal de detalhe (item-detail) e na futura tela de IA para
 * responder perguntas tipo "quanto foi o último arroz que comprei?".
 */
export async function getProductPriceHistory(
  produtoId: number
): Promise<HistoricoPreco[]> {
  const db = await getDb();
  return db.getAllAsync<HistoricoPreco>(
    `SELECT
       c.data        AS data,
       m.nome        AS mercado_nome,
       i.preco       AS preco
     FROM itens_compra i
     JOIN compras c  ON c.id = i.compra_id
     JOIN mercados m ON m.id = c.mercado_id
     WHERE i.produto_id = ?
     ORDER BY c.data DESC, c.id DESC`,
    produtoId
  );
}
