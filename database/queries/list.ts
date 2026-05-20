/**
 * Queries da tabela `lista_itens` (lista de compras pré-configurada).
 *
 * A lista é única por usuário (não há "listas" — só A lista). Cada item
 * referencia um produto e tem flag `coletado` (boolean armazenado como
 * INTEGER 0/1 pelo SQLite).
 */
import { getDb } from "../db";
import type { ListaItem } from "@/types";

interface ListaItemRaw extends Omit<ListaItem, "coletado"> {
  coletado: number;
}

function mapRaw(row: ListaItemRaw): ListaItem {
  return { ...row, coletado: row.coletado === 1 };
}

/** Lista todos os itens da lista, ordenados (pendentes primeiro, depois coletados). */
export async function getListItems(): Promise<ListaItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ListaItemRaw>(
    `SELECT
       l.*,
       p.nome AS produto_nome
     FROM lista_itens l
     JOIN produtos p ON p.id = l.produto_id
     ORDER BY l.coletado ASC, l.ordem ASC, l.id ASC`
  );
  return rows.map(mapRaw);
}

/** Adiciona um produto à lista. Retorna o id do item criado. */
export async function addToList(
  produtoId: number,
  quantidadeDesejada = 1
): Promise<number> {
  const db = await getDb();
  // Próxima ordem = max(ordem) + 1, ou 0 se a lista estiver vazia.
  const nextOrder = await db.getFirstAsync<{ max: number | null }>(
    "SELECT MAX(ordem) AS max FROM lista_itens"
  );
  const ordem = (nextOrder?.max ?? -1) + 1;

  const result = await db.runAsync(
    `INSERT INTO lista_itens (produto_id, quantidade_desejada, ordem)
     VALUES (?, ?, ?)`,
    produtoId,
    quantidadeDesejada,
    ordem
  );
  return result.lastInsertRowId;
}

/** Marca/desmarca como coletado. */
export async function setListItemCollected(
  itemId: number,
  coletado: boolean
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE lista_itens SET coletado = ? WHERE id = ?",
    coletado ? 1 : 0,
    itemId
  );
}

/** Atualiza a quantidade desejada de um item da lista. */
export async function setListItemQuantity(
  itemId: number,
  quantidadeDesejada: number
): Promise<void> {
  if (quantidadeDesejada <= 0) {
    await removeFromList(itemId);
    return;
  }
  const db = await getDb();
  await db.runAsync(
    "UPDATE lista_itens SET quantidade_desejada = ? WHERE id = ?",
    quantidadeDesejada,
    itemId
  );
}

/** Remove um item da lista. */
export async function removeFromList(itemId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM lista_itens WHERE id = ?", itemId);
}

/** Remove todos os itens marcados como coletados. */
export async function clearCollected(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM lista_itens WHERE coletado = 1");
}

/** Desmarca todos os itens (mantém na lista, mas como pendentes). */
export async function resetCollected(): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE lista_itens SET coletado = 0");
}
