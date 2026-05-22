/**
 * Serviço de OCR — detecta nome e preço em etiquetas de supermercado.
 *
 * STATUS: stub. A captura de imagem (expo-camera) já funciona em Expo Go,
 * mas o reconhecimento de texto requer `@react-native-ml-kit/text-recognition`,
 * que é nativo e precisa de prebuild + dev client. Mantemos a interface
 * pronta para que a UI da tela `scan.tsx` continue funcionando hoje (modo
 * manual) e o usuário possa preencher nome/preço; quando o ML Kit for
 * integrado, basta substituir a implementação de `recognizeText`.
 *
 * Heurística projetada (a aplicar quando o texto bruto existir):
 *   - Regex de preço: `/R\$?\s*(\d+[.,]\d{2})/i` e `/\b\d+[.,]\d{2}\b/`
 *     — se houver vários candidatos, escolher o MAIOR valor (geralmente o
 *     preço unitário, não centavos por unidade).
 *   - Nome: linha mais comprida em CAIXA ALTA acima do preço, ou primeira
 *     linha não-numérica.
 */

export interface OcrResult {
  /** Texto bruto reconhecido. Vazio se o motor não estiver disponível. */
  rawText: string;
  /** Nome do produto detectado (null se não foi possível inferir). */
  nome: string | null;
  /** Preço em reais (número). null se não detectado. */
  preco: number | null;
}

/**
 * Extrai o maior preço encontrado em um texto livre.
 * Aceita "R$ 22,90", "22,90", "22.90", "R$ 22.90" etc.
 * Exposto pra que a heurística seja testável mesmo sem ML Kit.
 */
export function extractPrice(text: string): number | null {
  if (!text) return null;
  // Captura padrão: dígitos + separador (.,) + 2 dígitos decimais
  const matches = text.match(/\d+[.,]\d{2}/g);
  if (!matches || matches.length === 0) return null;
  const numeros = matches
    .map((m) => Number(m.replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (numeros.length === 0) return null;
  return Math.max(...numeros);
}

/**
 * Tenta extrair o nome do produto: primeira linha "longa" (>=3 chars)
 * que NÃO seja só dígitos/símbolos. Heurística simples — melhorar quando
 * tivermos amostras reais de etiquetas.
 */
export function extractName(text: string): string | null {
  if (!text) return null;
  const linhas = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && /[a-zA-ZÀ-ÿ]/.test(l));
  if (linhas.length === 0) return null;
  // Ordena por comprimento desc e pega a primeira (geralmente o nome principal)
  linhas.sort((a, b) => b.length - a.length);
  return linhas[0];
}

/**
 * Função principal — recebe URI de uma imagem capturada e retorna o
 * resultado. Por enquanto, retorna placeholder vazio (modo manual).
 *
 * Quando ML Kit for instalado:
 *   import TextRecognition from '@react-native-ml-kit/text-recognition';
 *   const result = await TextRecognition.recognize(uri);
 *   const rawText = result.text;
 *   return { rawText, nome: extractName(rawText), preco: extractPrice(rawText) };
 */
export async function recognizeText(_imageUri: string): Promise<OcrResult> {
  // Stub: até o ML Kit ser integrado, devolve resultado vazio.
  // A tela Scan trata isso mostrando os campos vazios para preenchimento manual.
  return {
    rawText: "",
    nome: null,
    preco: null,
  };
}

/** Indica à UI se o OCR está realmente disponível ou em modo manual. */
export const OCR_AVAILABLE = false;
