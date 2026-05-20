/**
 * Conexão singleton com o SQLite.
 *
 * Uso:
 *   const db = await getDb();
 *   const rows = await db.getAllAsync(...);
 *
 * Por que singleton: o expo-sqlite mantém o handle aberto pelo ciclo de vida
 * do app. Abrir múltiplas vezes desperdiça recursos e pode causar bloqueios.
 *
 * A inicialização é "lazy" via Promise: a primeira chamada a getDb() abre o
 * banco e roda as migrations; as próximas reaproveitam a mesma instância.
 */
import * as SQLite from "expo-sqlite";

import { runMigrations } from "./migrations";

const DATABASE_NAME = "fynner.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Habilita foreign keys (desligado por padrão no SQLite). Sem isso, o
  // ON DELETE CASCADE de itens_compra → compras não funciona.
  await db.execAsync("PRAGMA foreign_keys = ON;");

  await runMigrations(db);

  if (__DEV__) {
    console.log(`[db] conectado e migrado: ${DATABASE_NAME}`);
  }
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate().catch((err) => {
      // Se falhar, descarta a promise para tentar de novo na próxima chamada.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/**
 * Apenas para uso em testes/dev: força fechar e zerar a singleton.
 * Em produção a conexão permanece aberta.
 */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.closeAsync();
  dbPromise = null;
}

export { DATABASE_NAME };
