/**
 * Queries da tabela `compras` (sessões de compra).
 *
 * Uma sessão tem dois estados:
 * - 'ativa'       → carrinho em uso, ainda no mercado
 * - 'finalizada'  → compra encerrada, vai pro histórico
 *
 * Regra do app: existe no máximo UMA sessão ativa por vez. Se o usuário
 * troca de mercado sem finalizar, a sessão antiga continua aberta (poderá
 * ser retomada depois). Por isso `getActiveSession` recebe `mercadoId`.
 */
import { getDb } from "../db";
import type { Compra, CompraComMercado } from "@/types";

/** Retorna a sessão ativa daquele mercado, se houver. */
export async function getActiveSession(
  mercadoId: number
): Promise<Compra | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Compra>(
    `SELECT * FROM compras
     WHERE mercado_id = ? AND status = 'ativa'
     ORDER BY created_at DESC
     LIMIT 1`,
    mercadoId
  );
  return row ?? null;
}

/** Retorna QUALQUER sessão ativa (de qualquer mercado), se houver. */
export async function getAnyActiveSession(): Promise<CompraComMercado | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CompraComMercado>(
    `SELECT
       c.*,
       m.nome AS mercado_nome,
       m.cor  AS mercado_cor,
       (SELECT COUNT(*) FROM itens_compra WHERE compra_id = c.id) AS total_itens
     FROM compras c
     JOIN mercados m ON m.id = c.mercado_id
     WHERE c.status = 'ativa'
     ORDER BY c.created_at DESC
     LIMIT 1`
  );
  return row ?? null;
}

/**
 * Cria uma nova sessão de compra ativa para o mercado.
 * Retorna o id da sessão criada.
 */
export async function createSession(
  mercadoId: number,
  orcamento = 0
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO compras (mercado_id, orcamento) VALUES (?, ?)",
    mercadoId,
    orcamento
  );
  return result.lastInsertRowId;
}

/** Marca a sessão como finalizada. Idempotente. */
export async function finalizeSession(sessionId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE compras SET status = 'finalizada' WHERE id = ?",
    sessionId
  );
}

/** Atualiza o orçamento de uma sessão. */
export async function setSessionBudget(
  sessionId: number,
  orcamento: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE compras SET orcamento = ? WHERE id = ?",
    orcamento,
    sessionId
  );
}

/**
 * Histórico de sessões (finalizadas e ativas) ordenadas por data desc.
 * Já inclui nome/cor do mercado e contagem de itens — evita N+1 queries
 * na tela de histórico.
 */
export async function getSessionHistory(
  limit = 50
): Promise<CompraComMercado[]> {
  const db = await getDb();
  return db.getAllAsync<CompraComMercado>(
    `SELECT
       c.*,
       m.nome AS mercado_nome,
       m.cor  AS mercado_cor,
       (SELECT COUNT(*) FROM itens_compra WHERE compra_id = c.id) AS total_itens
     FROM compras c
     JOIN mercados m ON m.id = c.mercado_id
     ORDER BY c.data DESC, c.id DESC
     LIMIT ?`,
    limit
  );
}

/**
 * Total gasto em um mês (formato 'YYYY-MM'). Soma somente compras
 * finalizadas — sessão ativa ainda pode mudar.
 */
export async function getTotalByMonth(yearMonth: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(total) AS total
     FROM compras
     WHERE status = 'finalizada' AND strftime('%Y-%m', data) = ?`,
    yearMonth
  );
  return row?.total ?? 0;
}
