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
  {
    /**
     * Listas nomeadas: cria tabela `listas` e vincula `lista_itens` a uma
     * delas via `lista_id`. Devices com itens órfãos do modelo antigo
     * (lista única) recebem uma lista padrão "Compras" e os itens migram
     * pra ela. Devices novos terão a lista "Compras" criada vazia — o
     * seed cuida de popular em DEV.
     */
    id: "003_named_lists",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS listas (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          nome        TEXT    NOT NULL,
          icone       TEXT    NOT NULL DEFAULT 'cart-outline',
          created_at  TEXT    DEFAULT (datetime('now')),
          updated_at  TEXT    DEFAULT (datetime('now'))
        );

        ALTER TABLE lista_itens ADD COLUMN lista_id INTEGER REFERENCES listas(id) ON DELETE CASCADE;

        CREATE INDEX IF NOT EXISTS idx_lista_itens_lista_id ON lista_itens(lista_id);

        INSERT INTO listas (nome, icone) VALUES ('Compras', 'cart-outline');

        UPDATE lista_itens
        SET lista_id = (SELECT id FROM listas WHERE nome = 'Compras' LIMIT 1)
        WHERE lista_id IS NULL;
      `);
    },
  },
  {
    /**
     * Mensagens da conversa com a Fynner IA (Sub-stage 8b). Só user/assistant
     * são persistidos — tool_calls e tool_results ficam efêmeros no service.
     * Índice em created_at acelera o ORDER BY usado tanto na UI quanto no
     * recorte das últimas N mensagens enviadas como contexto à OpenAI.
     */
    id: "004_ai_messages",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ai_messages (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          role        TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
          content     TEXT    NOT NULL,
          created_at  TEXT    DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);
      `);
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
