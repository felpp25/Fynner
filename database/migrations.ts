/**
 * Sistema de migrations simples.
 *
 * Cada migration tem um `id` (string única) e uma função `up(db)` que aplica
 * mudanças no banco. A tabela `_migrations` registra quais já foram executadas.
 *
 * Para adicionar uma nova migration:
 * 1. Crie um novo objeto no array `migrations` com id único e crescente.
 * 2. Implemente o `up(db)` com as queries necessárias.
 * 3. NUNCA edite uma migration já aplicada — sempre crie uma nova.
 */
import type { SQLiteDatabase } from "expo-sqlite";

import { SCHEMA_SQL } from "./schema";

interface Migration {
  id: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: "001_initial_schema",
    up: async (db) => {
      await db.execAsync(SCHEMA_SQL);
    },
  },
  {
    // Soft-delete de mercados: mercados removidos da lista mas com histórico
    // preservado ficam com ativo=0. DEFAULT 1 garante que todos os mercados
    // pré-existentes continuem ativos sem migração de dados.
    id: "002_add_market_soft_delete",
    up: async (db) => {
      await db.execAsync(
        "ALTER TABLE mercados ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1;"
      );
    },
  },
];

/**
 * Cria a tabela _migrations se ainda não existe e roda todas as migrations
 * pendentes em ordem. Idempotente — pode ser chamado várias vezes.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          TEXT PRIMARY KEY,
      executed_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const applied = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM _migrations"
  );
  const appliedIds = new Set(applied.map((m) => m.id));

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) continue;

    // Transação garante atomicidade: se a migration falhar, nada fica meio aplicado.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync("INSERT INTO _migrations (id) VALUES (?)", migration.id);
    });

    if (__DEV__) {
      console.log(`[migrations] aplicada: ${migration.id}`);
    }
  }
}
