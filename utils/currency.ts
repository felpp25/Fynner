/**
 * Helpers para lidar com valores monetários em R$ (BRL).
 *
 * Convenção: armazenamos preço como `number` (em reais com decimais, ex: 22.9).
 * A UI mostra como "R$ 22,90". O input do usuário aceita o formato brasileiro
 * (vírgula como separador decimal).
 */

/** Formata número como R$ X,XX (ex: 22.9 → "R$ 22,90"). */
export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

/**
 * Converte texto digitado pelo usuário em número.
 * Aceita vírgula ou ponto. Remove "R$" e espaços. Retorna NaN se inválido.
 *
 * Exemplos:
 *   "22,90"    → 22.9
 *   "R$ 5,00"  → 5
 *   "5"        → 5
 *   "abc"      → NaN
 */
export function parseBRL(input: string): number {
  const cleaned = input
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!cleaned) return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Máscara progressiva para input de moeda enquanto o usuário digita.
 * Mantém o cursor no fim e formata só dígitos: "1234" → "12,34".
 *
 * O input deve usar keyboardType="decimal-pad" ou "numeric" para que
 * apenas dígitos cheguem aqui — mas a função é defensiva.
 */
export function maskBRLInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Pad esquerda para garantir ao menos 3 dígitos (centavos)
  const padded = digits.padStart(3, "0");
  const intPart = padded.slice(0, -2).replace(/^0+/, "") || "0";
  const decPart = padded.slice(-2);
  return `${intPart},${decPart}`;
}
