/**
 * Queries da tabela `ai_messages` — conversa com a Fynner IA (Sub-stage 8b).
 *
 * Padrão do projeto: `getDb()` async (singleton lazy). Todas as funções
 * abrem a conexão de forma idempotente.
 *
 * Mensagens são apenas user/assistant. Os tool_calls e tool_results da
 * OpenAI ficam efêmeros dentro do `services/ai.ts` — não interessa
 * mostrá-los na UI nem reidratá-los entre sessões.
 */
import { getDb } from "../db";
import type { AIMessage } from "@/types";

/**
 * Retorna TODAS as mensagens em ordem cronológica.
 * Usado pra renderizar a UI da conversa na FlatList.
 */
export async function getAllMessages(): Promise<AIMessage[]> {
  const db = await getDb();
  return db.getAllAsync<AIMessage>(
    `SELECT * FROM ai_messages ORDER BY id ASC`
  );
}

/**
 * Retorna as últimas N mensagens (mais recentes), em ordem cronológica.
 * Usado pra enviar contexto à OpenAI sem estourar tokens — fica em torno
 * de 6 por default mas é configurável.
 */
export async function getRecentMessages(
  limit: number = 6
): Promise<AIMessage[]> {
  const db = await getDb();
  return db.getAllAsync<AIMessage>(
    `SELECT * FROM (
       SELECT * FROM ai_messages ORDER BY id DESC LIMIT ?
     ) ORDER BY id ASC`,
    limit
  );
}

/**
 * Insere uma mensagem e retorna o id gerado.
 * A coluna created_at usa o DEFAULT do SQLite (datetime('now')).
 */
export async function addMessage(
  role: "user" | "assistant",
  content: string
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO ai_messages (role, content) VALUES (?, ?)`,
    role,
    content
  );
  return result.lastInsertRowId;
}

/**
 * Apaga TODA a conversa. Chamado pelo botão "limpar conversa" no header
 * da tela de IA — ação destrutiva, mas sem confirmação dupla aqui porque
 * a tela de IA já tem o feedback visual (a lista zera na hora).
 */
export async function clearAllMessages(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM ai_messages`);
}
