/**
 * Queries da tabela `mercados`.
 *
 * Mercados são os supermercados que o usuário visita. Eles são reutilizados
 * entre compras: o usuário escolhe um existente OU cria um novo.
 */
import { getDb } from "../db";
import type { Mercado, MarketComparison } from "@/types";

/**
 * Lista mercados ATIVOS (não soft-deletados), mais recentes primeiro.
 * Inclui `ultima_visita` (data da última compra finalizada) via subquery —
 * vem como string vazia quando o mercado nunca teve compra; convertemos
 * para `undefined` para o consumidor lidar de forma idiomática em TS.
 *
 * Mercados com `ativo=0` ficam fora desta lista mas continuam aparecendo
 * em `getMarketComparison` (que serve o histórico).
 */
export async function getAllMarkets(): Promise<Mercado[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Mercado & { ultima_visita: string }>(`
    SELECT
      m.*,
      COALESCE(
        (SELECT MAX(c.data) FROM compras c
         WHERE c.mercado_id = m.id AND c.status = 'finalizada'),
        ''
      ) AS ultima_visita
    FROM mercados m
    WHERE m.ativo = 1
    ORDER BY m.created_at DESC
  `);
  return rows.map((r) => ({
    ...r,
    ultima_visita: r.ultima_visita || undefined,
  }));
}

/**
 * Soft delete — esconde o mercado da lista ativa mas preserva todos os
 * dados (compras, itens, comparativos de preço). Use quando o usuário não
 * frequenta mais o mercado mas quer manter consultas históricas.
 */
export async function softDeleteMarket(mercadoId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE mercados SET ativo = 0 WHERE id = ?",
    mercadoId
  );
}

/**
 * Hard delete — apaga o mercado, suas compras e itens. Ação irreversível.
 *
 * Ordem importa: `itens_compra → compras` tem ON DELETE CASCADE, então
 * ao deletar as compras, os itens vão junto. Como `compras → mercados`
 * NÃO tem cascade (intencional, pra evitar acidente), apagamos compras
 * explicitamente antes do mercado, dentro de uma transação.
 */
export async function hardDeleteMarket(mercadoId: number): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM compras WHERE mercado_id = ?", mercadoId);
    await db.runAsync("DELETE FROM mercados WHERE id = ?", mercadoId);
  });
}

/** Busca um mercado por id. Retorna null se não existir. */
export async function getMarketById(id: number): Promise<Mercado | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Mercado>(
    "SELECT * FROM mercados WHERE id = ?",
    id
  );
  return row ?? null;
}

/** Cria um mercado e retorna o id gerado. */
export async function createMarket(
  nome: string,
  options: { endereco?: string; cor?: string } = {}
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO mercados (nome, endereco, cor) VALUES (?, ?, ?)",
    nome,
    options.endereco ?? null,
    options.cor ?? "#a203ff"
  );
  return result.lastInsertRowId;
}

/**
 * Retorna um resumo comparativo de cada mercado: total de visitas, última
 * data, e o total da última compra. Usado na tela de Histórico.
 *
 * Note que LEFT JOIN garante mercados sem compras também aparecerem.
 */
export async function getMarketComparison(): Promise<MarketComparison[]> {
  const db = await getDb();
  return db.getAllAsync<MarketComparison>(`
    SELECT
      m.id                  AS mercado_id,
      m.nome                AS mercado_nome,
      m.cor                 AS mercado_cor,
      COALESCE(MAX(c.data), '')      AS ultima_visita,
      COALESCE(
        (SELECT total FROM compras
         WHERE mercado_id = m.id AND status = 'finalizada'
         ORDER BY data DESC, id DESC LIMIT 1),
        0
      ) AS ultimo_total,
      COUNT(c.id)           AS total_visitas
    FROM mercados m
    LEFT JOIN compras c ON c.mercado_id = m.id AND c.status = 'finalizada'
    GROUP BY m.id
    ORDER BY ultima_visita DESC
  `);
}
