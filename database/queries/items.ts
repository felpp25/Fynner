/**
 * Queries da tabela `itens_compra` (itens dentro de uma sessão de compra).
 *
 * Importante: o `subtotal` é coluna GERADA pelo SQLite (preco * quantidade).
 * Nunca passe valor manualmente para ela — é só leitura.
 *
 * Sempre que alterar itens (add/update/remove), chame `updateSessionTotal`
 * para manter `compras.total` em sincronia. Fizemos isso via função (não
 * via TRIGGER) para que o cálculo seja explícito e fácil de debugar.
 */
import { getDb } from "../db";
import type { ItemComProduto } from "@/types";

/**
 * Adiciona um item ao carrinho. Retorna o id do item criado.
 * Não atualiza o total automaticamente — quem chama deve chamar
 * `updateSessionTotal(compraId)` depois.
 */
export async function addItem(
  compraId: number,
  produtoId: number,
  preco: number,
  quantidade: number
): Promise<number> {
  if (preco <= 0) throw new Error("Preço deve ser maior que zero.");
  if (quantidade <= 0) throw new Error("Quantidade deve ser maior que zero.");

  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO itens_compra (compra_id, produto_id, preco, quantidade)
     VALUES (?, ?, ?, ?)`,
    compraId,
    produtoId,
    preco,
    quantidade
  );
  return result.lastInsertRowId;
}

/** Atualiza a quantidade de um item. Se ficar <= 0, remove. */
export async function updateQuantity(
  itemId: number,
  quantidade: number
): Promise<void> {
  if (quantidade <= 0) {
    await removeItem(itemId);
    return;
  }
  const db = await getDb();
  await db.runAsync(
    "UPDATE itens_compra SET quantidade = ? WHERE id = ?",
    quantidade,
    itemId
  );
}

/** Atualiza o preço de um item (caso o usuário tenha digitado errado). */
export async function updatePrice(
  itemId: number,
  preco: number
): Promise<void> {
  if (preco <= 0) throw new Error("Preço deve ser maior que zero.");
  const db = await getDb();
  await db.runAsync(
    "UPDATE itens_compra SET preco = ? WHERE id = ?",
    preco,
    itemId
  );
}

/** Remove um item do carrinho. */
export async function removeItem(itemId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM itens_compra WHERE id = ?", itemId);
}

/**
 * Retorna todos os itens de uma sessão, já com nome e categoria do produto.
 * Mais recentes primeiro (ordem inversa de adição).
 */
export async function getItemsBySession(
  compraId: number
): Promise<ItemComProduto[]> {
  const db = await getDb();
  return db.getAllAsync<ItemComProduto>(
    `SELECT
       i.*,
       p.nome      AS produto_nome,
       p.categoria AS produto_categoria
     FROM itens_compra i
     JOIN produtos p ON p.id = i.produto_id
     WHERE i.compra_id = ?
     ORDER BY i.id DESC`,
    compraId
  );
}

/**
 * Recalcula o total da sessão somando os subtotais dos itens e grava em
 * `compras.total`. Deve ser chamado após qualquer mudança nos itens.
 */
export async function updateSessionTotal(compraId: number): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(subtotal) AS total FROM itens_compra WHERE compra_id = ?",
    compraId
  );
  const total = row?.total ?? 0;
  await db.runAsync("UPDATE compras SET total = ? WHERE id = ?", total, compraId);
  return total;
}
