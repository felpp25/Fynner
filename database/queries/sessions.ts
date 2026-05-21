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
import type { Compra, CompraComMercado, FilterPeriodo } from "@/types";

interface HistoryFilters {
  mercadoId?: number;
  periodo?: FilterPeriodo;
}

function periodoToDays(periodo?: FilterPeriodo): number {
  if (periodo === "semana") return 7;
  if (periodo === "3meses") return 90;
  if (periodo === "tudo") return 99999;
  return 30;
}

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
/**
 * Histórico de sessões com filtros opcionais.
 *
 * - `mercadoId` filtra por um mercado específico (omite → todos)
 * - `periodo` filtra por janela de tempo ('semana' | 'mes' | '3meses' | 'tudo')
 *
 * Construímos a cláusula WHERE dinamicamente em ordem fixa, com placeholders
 * `?` para evitar SQL injection. Mercados soft-deletados continuam aparecendo
 * (compras passadas neles ainda fazem parte do histórico do usuário).
 */
export async function getSessionHistory(
  limit = 50,
  filters: HistoryFilters = {}
): Promise<CompraComMercado[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.mercadoId !== undefined) {
    conditions.push("c.mercado_id = ?");
    params.push(filters.mercadoId);
  }
  if (filters.periodo && filters.periodo !== "tudo") {
    conditions.push("c.data >= date('now', ?)");
    params.push(`-${periodoToDays(filters.periodo)} days`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return db.getAllAsync<CompraComMercado>(
    `SELECT
       c.*,
       m.nome AS mercado_nome,
       m.cor  AS mercado_cor,
       (SELECT COUNT(*) FROM itens_compra WHERE compra_id = c.id) AS total_itens
     FROM compras c
     JOIN mercados m ON m.id = c.mercado_id
     ${where}
     ORDER BY c.data DESC, c.id DESC
     LIMIT ?`,
    ...params,
    limit
  );
}

/**
 * Busca uma sessão por id, incluindo nome/cor do mercado e total_itens.
 * Retorna null se não existir.
 */
export async function getSessionById(
  id: number
): Promise<CompraComMercado | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CompraComMercado>(
    `SELECT
       c.*,
       m.nome AS mercado_nome,
       m.cor  AS mercado_cor,
       (SELECT COUNT(*) FROM itens_compra WHERE compra_id = c.id) AS total_itens
     FROM compras c
     JOIN mercados m ON m.id = c.mercado_id
     WHERE c.id = ?`,
    id
  );
  return row ?? null;
}

/**
 * Estatísticas do mês atual vs mês anterior, usadas pelos InsightCards.
 *
 * `date('now', 'start of month')` retorna o primeiro dia do mês corrente.
 * `date('now', 'start of month', '-1 month')` o primeiro dia do mês anterior.
 * Somente compras finalizadas entram na conta (ativa pode ainda mudar).
 */
export interface MonthlyStats {
  totalAtual: number;
  totalAnterior: number;
  comprasAtuais: number;
  comprasAnteriores: number;
}

export async function getMonthlyStats(): Promise<MonthlyStats> {
  const db = await getDb();

  const atual = await db.getFirstAsync<{ total: number; qtd: number }>(
    `SELECT
       COALESCE(SUM(total), 0) AS total,
       COUNT(*)                AS qtd
     FROM compras
     WHERE data >= date('now', 'start of month')
       AND status = 'finalizada'`
  );

  const anterior = await db.getFirstAsync<{ total: number; qtd: number }>(
    `SELECT
       COALESCE(SUM(total), 0) AS total,
       COUNT(*)                AS qtd
     FROM compras
     WHERE data >= date('now', 'start of month', '-1 month')
       AND data <  date('now', 'start of month')
       AND status = 'finalizada'`
  );

  return {
    totalAtual: atual?.total ?? 0,
    totalAnterior: anterior?.total ?? 0,
    comprasAtuais: atual?.qtd ?? 0,
    comprasAnteriores: anterior?.qtd ?? 0,
  };
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
