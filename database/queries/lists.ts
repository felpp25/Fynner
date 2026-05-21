/**
 * Queries de listas nomeadas (Stage 5).
 *
 * - Tabela `listas`: lista nomeada com ícone (ex: "Churrasco do sábado")
 * - Tabela `lista_itens`: itens vinculados via `lista_id` (cascade no delete)
 *
 * Convenções:
 * - `coletado` no banco é INTEGER 0/1; mapeamos pra boolean ao ler.
 * - Após qualquer mutação em itens, chamamos `touchList()` pra atualizar
 *   `updated_at` da lista (usado pra ordenar "mais recentes primeiro").
 */
import { getDb } from "../db";
import { findOrCreateProduct } from "./products";
import type {
  Lista,
  ListaComProgresso,
  ListaItemComProduto,
} from "@/types";

// ============ LISTAS ============

/**
 * Lista todas as listas com agregados de progresso (total de itens e
 * quantos foram coletados). Ordem: mais recentemente atualizadas primeiro.
 */
export async function getAllLists(): Promise<ListaComProgresso[]> {
  const db = await getDb();
  return db.getAllAsync<ListaComProgresso>(
    `SELECT
       l.*,
       COUNT(li.id)                AS total_itens,
       COALESCE(SUM(li.coletado), 0) AS itens_coletados
     FROM listas l
     LEFT JOIN lista_itens li ON li.lista_id = l.id
     GROUP BY l.id
     ORDER BY l.updated_at DESC`
  );
}

export async function getListById(listaId: number): Promise<Lista | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Lista>(
    "SELECT * FROM listas WHERE id = ?",
    listaId
  );
  return row ?? null;
}

export async function createList(
  nome: string,
  icone: string
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO listas (nome, icone) VALUES (?, ?)",
    nome,
    icone
  );
  return result.lastInsertRowId;
}

export async function renameList(
  listaId: number,
  novoNome: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE listas SET nome = ?, updated_at = datetime('now') WHERE id = ?",
    novoNome,
    listaId
  );
}

/** Apaga a lista e (via ON DELETE CASCADE) todos os seus itens. */
export async function deleteList(listaId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM listas WHERE id = ?", listaId);
}

// ============ ITENS ============

interface ListaItemComProdutoRaw
  extends Omit<ListaItemComProduto, "coletado"> {
  coletado: number;
}

/**
 * Itens de uma lista com nome/categoria do produto, ordenados:
 * pendentes (coletado=0) primeiro, depois coletados.
 */
export async function getListItems(
  listaId: number
): Promise<ListaItemComProduto[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ListaItemComProdutoRaw>(
    `SELECT
       li.*,
       p.nome      AS produto_nome,
       p.categoria AS produto_categoria
     FROM lista_itens li
     JOIN produtos p ON p.id = li.produto_id
     WHERE li.lista_id = ?
     ORDER BY li.coletado ASC, li.ordem ASC, li.id ASC`,
    listaId
  );
  return rows.map((r) => ({ ...r, coletado: r.coletado === 1 }));
}

/**
 * Adiciona um item à lista. O produto é reusado do catálogo via
 * findOrCreateProduct (case-insensitive). Atualiza updated_at da lista.
 */
export async function addItemToList(
  listaId: number,
  produtoNome: string,
  quantidade = 1
): Promise<number> {
  if (quantidade <= 0) {
    throw new Error("Quantidade deve ser maior que zero.");
  }
  const db = await getDb();
  const produtoId = await findOrCreateProduct(produtoNome);
  const result = await db.runAsync(
    `INSERT INTO lista_itens (lista_id, produto_id, quantidade_desejada, coletado, ordem)
     VALUES (?, ?, ?, 0, 0)`,
    listaId,
    produtoId,
    quantidade
  );
  await touchList(listaId);
  return result.lastInsertRowId;
}

/**
 * Alterna o flag coletado do item. SQLite suporta `NOT coletado` em
 * UPDATE com INTEGER 0/1.
 */
export async function toggleItemCollected(itemId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE lista_itens SET coletado = NOT coletado WHERE id = ?",
    itemId
  );
  const row = await db.getFirstAsync<{ lista_id: number }>(
    "SELECT lista_id FROM lista_itens WHERE id = ?",
    itemId
  );
  if (row?.lista_id) await touchList(row.lista_id);
}

export async function updateItemQuantity(
  itemId: number,
  quantidade: number
): Promise<void> {
  if (quantidade <= 0) {
    await deleteListItem(itemId);
    return;
  }
  const db = await getDb();
  await db.runAsync(
    "UPDATE lista_itens SET quantidade_desejada = ? WHERE id = ?",
    quantidade,
    itemId
  );
}

export async function deleteListItem(itemId: number): Promise<void> {
  const db = await getDb();
  // Busca a lista ANTES de deletar para conseguir touchList depois.
  const row = await db.getFirstAsync<{ lista_id: number }>(
    "SELECT lista_id FROM lista_itens WHERE id = ?",
    itemId
  );
  await db.runAsync("DELETE FROM lista_itens WHERE id = ?", itemId);
  if (row?.lista_id) await touchList(row.lista_id);
}

async function touchList(listaId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE listas SET updated_at = datetime('now') WHERE id = ?",
    listaId
  );
}
