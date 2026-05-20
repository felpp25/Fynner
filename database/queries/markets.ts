/**
 * Queries da tabela `mercados`.
 *
 * Mercados são os supermercados que o usuário visita. Eles são reutilizados
 * entre compras: o usuário escolhe um existente OU cria um novo.
 */
import { getDb } from "../db";
import type { Mercado, MarketComparison } from "@/types";

/** Lista todos os mercados cadastrados, mais recentes primeiro. */
export async function getAllMarkets(): Promise<Mercado[]> {
  const db = await getDb();
  return db.getAllAsync<Mercado>(
    "SELECT * FROM mercados ORDER BY created_at DESC"
  );
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
