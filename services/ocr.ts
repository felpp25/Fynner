/**
 * Serviço de OCR — detecta nome e preço em etiquetas de supermercado.
 *
 * STATUS: ATIVO. `@react-native-ml-kit/text-recognition` instalado e
 * vinculado nativamente via prebuild (requer dev client; não roda em
 * Expo Go). A tela `scan.tsx` consome `OCR_AVAILABLE` pra esconder o
 * banner de modo manual.
 *
 * Heurística do parser de texto bruto:
 *   - Preço: `/\d+[.,]\d{2}/g` — se houver vários candidatos, escolhe o
 *     MAIOR (preço unitário, não centavos por unidade).
 *   - Nome: linha alfanumérica mais longa (geralmente o nome principal).
 */
import TextRecognition from "@react-native-ml-kit/text-recognition";

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
 * Heurística melhorada para extrair o nome do produto de um texto OCR.
 *
 * Estratégia em 3 passos:
 *  1. Filtra linhas que claramente não são nome de produto (nomes de arquivo,
 *     URLs, linhas só com números/símbolos, palavras técnicas isoladas)
 *  2. Pontua cada linha sobrevivente baseado em:
 *     - Quantidade de letras (mais letras = melhor)
 *     - Caixa alta (etiquetas brasileiras usam — bonus)
 *     - Tamanho razoável (3-50 chars)
 *     - Posição no texto (linhas que vêm antes do preço ganham bonus —
 *       em etiquetas brasileiras o nome geralmente fica acima do preço)
 *  3. Retorna a linha de maior pontuação
 *
 * Se nenhuma linha passar nos filtros, retorna null (usuário preenche
 * manualmente — a tela Scan já trata esse caso).
 */
export function extractName(text: string): string | null {
  if (!text) return null;

  const linhas = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  if (linhas.length === 0) return null;

  // Em que linha o preço aparece — usado pra bonus de posição.
  const priceLineIndex = linhas.findIndex((l) => /\d+[.,]\d{2}/.test(l));

  // Padrões que indicam "lixo" (não é nome de produto).
  const padroesLixo = [
    /\.(jpg|jpeg|png|webp|gif|pdf|csv|xlsx?)/i, // extensões de arquivo
    /\(\d+x\d+\)/, // dimensões tipo "(1600x900)"
    /https?:\/\//i, // URLs
    /^[\d\W]+$/, // só dígitos e símbolos
    /^(R\$|preço|preco|kg|un|cód|cod|valid|venc)$/i, // termos técnicos
  ];

  function isLixo(linha: string): boolean {
    return padroesLixo.some((regex) => regex.test(linha));
  }

  function contaLetras(linha: string): number {
    return (linha.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  }

  function ehCaixaAlta(linha: string): boolean {
    const letras = linha.match(/[a-zA-ZÀ-ÿ]/g);
    if (!letras || letras.length < 3) return false;
    return letras.every((c) => c === c.toUpperCase());
  }

  const candidatos = linhas
    .map((linha, index) => {
      if (isLixo(linha)) return null;

      const letras = contaLetras(linha);
      if (letras < 3) return null;

      let score = letras;
      if (ehCaixaAlta(linha)) score += 10;
      if (linha.length >= 5 && linha.length <= 50) score += 5;
      // Etiquetas brasileiras põem o nome acima do preço.
      if (priceLineIndex !== -1 && index < priceLineIndex) score += 15;
      // Linha que contém o preço quase certamente NÃO é o nome.
      if (/\d+[.,]\d{2}/.test(linha)) score -= 20;

      return { linha, score };
    })
    .filter((c): c is { linha: string; score: number } => c !== null);

  if (candidatos.length === 0) return null;

  candidatos.sort((a, b) => b.score - a.score);
  return candidatos[0].linha;
}

/**
 * Função principal — recebe URI de uma imagem capturada, dispara o ML Kit
 * e aplica a heurística pra extrair nome + preço.
 *
 * Se o motor falhar (foto corrompida, módulo nativo indisponível, etc.),
 * captura o erro e retorna resultado vazio — o usuário continua podendo
 * digitar manualmente os campos na tela Scan.
 */
export async function recognizeText(imageUri: string): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    const rawText = result.text || "";
    return {
      rawText,
      nome: extractName(rawText),
      preco: extractPrice(rawText),
    };
  } catch (err) {
    console.error("[ocr] falha ao reconhecer texto:", err);
    return { rawText: "", nome: null, preco: null };
  }
}

/** Indica à UI se o OCR está realmente disponível ou em modo manual. */
export const OCR_AVAILABLE = true;
