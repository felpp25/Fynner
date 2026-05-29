/**
 * Serviço de IA do Fynner (Sub-stage 8b).
 *
 * Conversa com OpenAI GPT-4o-mini via fetch direto (sem SDK). Usa estratégia
 * híbrida de tool calling: 3 tools compostas que combinam queries do banco
 * internamente, mais `searchProducts` para desambiguar nomes.
 *
 * Por que não SDK:
 *   - Dependência extra (e SDK da OpenAI puxa polyfills pesados no RN).
 *   - A API REST é estável e simples — POST único + loop de tool calling.
 *
 * Tokens:
 *   - Histórico enviado é limitado a últimas N mensagens (default 6) — quem
 *     decide é o caller via `askAI(text, recentHistory)`.
 *   - System prompt curto, focado em finanças/compras do usuário.
 *   - Tools retornam JSON compacto, não texto humano.
 *
 * Segurança da key:
 *   - Lida de `EXPO_PUBLIC_OPENAI_API_KEY` (embutida no bundle em build time).
 *   - Aceitável em dev, NÃO em produção — antes de release, mover pra backend.
 */
import {
  getMonthlyStats,
  getSessionHistory,
} from "@/database/queries/sessions";
import {
  getAllMarkets,
  getMarketComparison,
} from "@/database/queries/markets";
import { searchProducts } from "@/database/queries/products";
import type { AIMessage, FilterPeriodo } from "@/types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || "gpt-4o-mini";

/**
 * Indica se a IA está pronta pra uso. Se a key não estiver configurada,
 * a UI mostra um banner explicando como configurar (vez de tentar e dar 401).
 */
export const AI_AVAILABLE = !!API_KEY;

const SYSTEM_PROMPT = `Você é Fynner IA, assistente de finanças pessoais focado em supermercado e compras.

Você ajuda o usuário a entender seus gastos, comparar preços entre mercados e identificar padrões nas compras dele. Todos os dados ficam no celular do usuário (SQLite local).

Diretrizes:
- Responda em português do Brasil, de forma direta e amigável
- Use os valores em reais com R$ (ex: R$ 22,90)
- Quando relevante, mencione mercados pelo nome
- Não invente dados — sempre use as ferramentas disponíveis pra consultar o banco
- Se não tiver dados pra responder (ex: usuário pergunta sobre carne mas nunca comprou), diga claramente
- Respostas curtas e diretas. Evite parágrafos longos
- Use negrito (markdown **assim**) pra destacar valores e nomes de produtos importantes`;

// ============ TIPOS DA API OPENAI ============

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

interface OpenAIChoice {
  index: number;
  message: OpenAIChatMessage;
  finish_reason: string;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
}

// ============ TOOL DEFINITIONS ============

const TOOLS = [
  {
    type: "function",
    function: {
      name: "getFinancialOverview",
      description:
        "Retorna visão geral financeira do usuário: gasto total do mês atual, comparação com mês anterior, número de compras, e comparativo de mercados (qual foi o mais barato no período). Use para perguntas sobre gastos gerais, comparações temporais, ou panorama geral.",
      parameters: {
        type: "object",
        properties: {
          periodo: {
            type: "string",
            enum: ["semana", "mes", "3meses", "tudo"],
            description:
              "Período para o comparativo de mercados (mes é o default)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getShoppingHistory",
      description:
        "Retorna histórico detalhado de compras com filtros opcionais. Use para perguntas sobre compras específicas, padrões de visita, ou quando o usuário pede uma lista de compras.",
      parameters: {
        type: "object",
        properties: {
          mercadoId: {
            type: "number",
            description:
              "ID do mercado para filtrar (opcional). Use a tool getAllMarketsList para descobrir IDs",
          },
          periodo: {
            type: "string",
            enum: ["semana", "mes", "3meses", "tudo"],
            description: "Período (default: mes)",
          },
          limit: {
            type: "number",
            description:
              "Máximo de compras a retornar (default: 10, máximo: 30)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAllMarketsList",
      description:
        "Lista todos os mercados ativos do usuário com seus IDs. Use antes de chamar outras tools que precisam de mercadoId, ou quando o usuário pergunta quais mercados frequenta.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Busca produtos no catálogo do usuário por nome aproximado. Use para desambiguar quando o usuário menciona um produto sem ID específico, ou pra confirmar se um produto existe no histórico.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: 'Termo de busca (ex: "café", "arroz")',
          },
        },
        required: ["query"],
      },
    },
  },
];

// ============ TOOL HANDLERS ============

type ToolArgs = Record<string, unknown>;

/**
 * Helpers de narrowing — as args vêm do JSON.parse das tool_calls da OpenAI,
 * tipadas como `unknown`. Centralizar evita repetir `typeof === 'string'` em
 * cada switch case.
 */
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asPeriodo(v: unknown): FilterPeriodo {
  const s = asString(v);
  if (s === "semana" || s === "mes" || s === "3meses" || s === "tudo") {
    return s;
  }
  return "mes";
}

/**
 * Executa uma tool call localmente, consultando o banco SQLite.
 * Retorna JSON compacto pra mandar de volta pro GPT. Erros viram
 * `{error: ...}` no JSON — o GPT entende e adapta a resposta.
 */
async function executeToolCall(
  name: string,
  args: ToolArgs
): Promise<string> {
  try {
    switch (name) {
      case "getFinancialOverview": {
        const periodo = asPeriodo(args.periodo);
        const [stats, comparison] = await Promise.all([
          getMonthlyStats(),
          getMarketComparison(periodo),
        ]);
        return JSON.stringify({
          mes_atual: {
            total: stats.totalAtual,
            compras: stats.comprasAtuais,
          },
          mes_anterior: {
            total: stats.totalAnterior,
            compras: stats.comprasAnteriores,
          },
          comparativo_mercados: comparison.map((m) => ({
            mercado: m.mercado_nome,
            gasto_medio: m.total_medio,
            visitas: m.total_visitas,
          })),
        });
      }

      case "getShoppingHistory": {
        const limitRaw = asNumber(args.limit);
        const limit = limitRaw !== undefined ? Math.min(limitRaw, 30) : 10;
        const mercadoId = asNumber(args.mercadoId);
        const compras = await getSessionHistory(limit, {
          mercadoId,
          periodo: asPeriodo(args.periodo),
        });
        return JSON.stringify(
          compras.map((c) => ({
            id: c.id,
            data: c.data,
            mercado: c.mercado_nome,
            total: c.total,
            itens: c.total_itens,
            status: c.status,
          }))
        );
      }

      case "getAllMarketsList": {
        const mercados = await getAllMarkets();
        return JSON.stringify(
          mercados.map((m) => ({
            id: m.id,
            nome: m.nome,
            ultima_visita: m.ultima_visita ?? null,
          }))
        );
      }

      case "searchProducts": {
        const query = asString(args.query) ?? "";
        const produtos = await searchProducts(query);
        return JSON.stringify(
          produtos.slice(0, 10).map((p) => ({
            id: p.id,
            nome: p.nome,
            categoria: p.categoria,
          }))
        );
      }

      default:
        return JSON.stringify({ error: `Tool desconhecida: ${name}` });
    }
  } catch (err) {
    console.error(`[ai] erro na tool ${name}:`, err);
    return JSON.stringify({ error: "Falha ao executar a consulta" });
  }
}

// ============ CHAT MAIN LOOP ============

const MAX_TOOL_ITERATIONS = 5;

/**
 * Envia uma pergunta à IA, processa eventuais tool calls, e retorna a
 * resposta final em texto.
 *
 * `recentHistory` deve ser ordem cronológica (mais antigas primeiro) e NÃO
 * incluir a `userMessage` atual — esta é adicionada internamente.
 *
 * Loop de tool calling vai até 5 iterações pra evitar loop infinito caso o
 * modelo entre em um padrão patológico. Na prática termina em 1-2 iterações.
 */
export async function askAI(
  userMessage: string,
  recentHistory: AIMessage[]
): Promise<string> {
  if (!AI_AVAILABLE) {
    return "A IA não está configurada. Verifique se EXPO_PUBLIC_OPENAI_API_KEY está no .env e reinicie o app.";
  }

  const messages: OpenAIChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentHistory.map<OpenAIChatMessage>((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const message = data.choices[0]?.message;
    if (!message) {
      throw new Error("Resposta da OpenAI sem choices.");
    }

    // Sem tool_calls = resposta final pro usuário.
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || "Não consegui gerar uma resposta.";
    }

    // Empilha a mensagem do assistente (com tool_calls) e processa cada call.
    messages.push(message);

    for (const toolCall of message.tool_calls) {
      let args: ToolArgs;
      try {
        args = JSON.parse(toolCall.function.arguments) as ToolArgs;
      } catch {
        args = {};
      }
      const result = await executeToolCall(toolCall.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    // Próxima iteração: o modelo vai consumir os tool results e responder.
  }

  return "Não consegui processar sua pergunta — tente reformular.";
}
