/**
 * Serviço de export/import CSV (Stage 7).
 *
 * - Export: serializa TODOS os itens de TODAS as compras em um único CSV,
 *   salva em cacheDirectory e abre o share sheet nativo.
 * - Import: lê CSV via DocumentPicker, parseia (RFC 4180-ish), e insere
 *   linhas sem duplicar (chave de deduplicação: data + mercado + produto + preço).
 *
 * Formato:
 *   data,mercado,produto,categoria,preco,quantidade,subtotal
 *   2026-05-20,Atacadão,Arroz Camil 5kg,Geral,22.90,1,22.90
 *
 * O CSV gerado funciona em qualquer planilha (Excel/Sheets/Numbers) e é o
 * mesmo formato aceito no import — backup-restore puro.
 *
 * Usa a API "legacy" do expo-file-system (pré-SDK-54) — interface estável
 * e suficiente pra este caso (string read/write em UTF-8).
 */
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { getDb } from "@/database/db";
import {
  getAllItemsForExport,
  type ExportRow,
} from "@/database/queries/items";
import { findOrCreateProduct } from "@/database/queries/products";

const CSV_HEADER = [
  "data",
  "mercado",
  "produto",
  "categoria",
  "preco",
  "quantidade",
  "subtotal",
] as const;

const FILENAME_PREFIX = "fynner_backup_";

// ============ EXPORT ============

/**
 * Gera o CSV completo e abre o share sheet do sistema.
 * Retorna `false` se a plataforma não suporta share (ex: web headless).
 */
export async function exportToCSV(): Promise<{
  uri: string;
  rowCount: number;
  shared: boolean;
}> {
  const rows = await getAllItemsForExport();
  const csv = serializeCSV(rows);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const uri = `${FileSystem.cacheDirectory}${FILENAME_PREFIX}${today}.csv`;

  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      dialogTitle: "Compartilhar backup do Fynner",
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
    });
  }

  return { uri, rowCount: rows.length, shared: canShare };
}

/** Converte um número para string CSV com 2 casas decimais (formato seguro). */
function toCsvNumber(n: number): string {
  return n.toFixed(2);
}

/** Escapa um valor de campo conforme RFC 4180: aspeia se contém , " \n ou \r. */
function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeCSV(rows: ExportRow[]): string {
  const lines: string[] = [];
  lines.push(CSV_HEADER.join(","));
  for (const r of rows) {
    lines.push(
      [
        escapeField(r.data),
        escapeField(r.mercado),
        escapeField(r.produto),
        escapeField(r.categoria || "Geral"),
        toCsvNumber(r.preco),
        String(r.quantidade),
        toCsvNumber(r.subtotal),
      ].join(",")
    );
  }
  // CRLF é o terminador padrão do RFC 4180.
  return lines.join("\r\n") + "\r\n";
}

// ============ IMPORT ============

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Abre o picker pra selecionar um arquivo .csv. Retorna null se o usuário
 * cancelou; senão, retorna `{ uri, name }`.
 */
export async function pickCsvFile(): Promise<{
  uri: string;
  name: string;
} | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/comma-separated-values", "*/*"],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name };
}

/**
 * Faz o preview do CSV: lê o arquivo e conta as linhas válidas.
 * Não toca no banco — usado antes de confirmar a importação.
 */
export async function previewCsvFile(
  uri: string
): Promise<{ totalRows: number; sample: string[][] }> {
  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = parseCSV(text);
  // primeira linha = cabeçalho
  const dataRows = parsed.slice(1);
  return {
    totalRows: dataRows.length,
    sample: dataRows.slice(0, 3),
  };
}

/**
 * Importa o arquivo CSV. Cria mercados/produtos novos por nome quando não
 * existem; reusa quando já existem. Cria compras agrupando linhas com a
 * mesma data+mercado. Pula linhas que dariam duplicata exata
 * (mesma data+mercado+produto+preço já no banco).
 */
export async function importFromCSV(uri: string): Promise<ImportResult> {
  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const parsed = parseCSV(text);
  if (parsed.length < 2) {
    return { imported: 0, skipped: 0, errors: ["Arquivo CSV vazio."] };
  }

  // Mapeia o cabeçalho para os índices esperados.
  const header = parsed[0].map((c) => c.trim().toLowerCase());
  const idx = {
    data: header.indexOf("data"),
    mercado: header.indexOf("mercado"),
    produto: header.indexOf("produto"),
    categoria: header.indexOf("categoria"),
    preco: header.indexOf("preco"),
    quantidade: header.indexOf("quantidade"),
  };
  const missing = (Object.keys(idx) as (keyof typeof idx)[]).filter(
    (k) => idx[k] === -1
  );
  if (missing.length > 0) {
    return {
      imported: 0,
      skipped: 0,
      errors: [`Colunas faltando no CSV: ${missing.join(", ")}`],
    };
  }

  const db = await getDb();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Cache em memória pra evitar lookups repetidos
  const mercadoCache = new Map<string, number>();
  const compraCache = new Map<string, number>(); // chave: `${mercadoId}|${data}`

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (row.length === 1 && row[0] === "") continue; // linha em branco

    try {
      const data = row[idx.data]?.trim();
      const mercadoNome = row[idx.mercado]?.trim();
      const produtoNome = row[idx.produto]?.trim();
      const categoria = row[idx.categoria]?.trim() || "Geral";
      const preco = Number(row[idx.preco]?.replace(",", "."));
      const quantidade = parseInt(row[idx.quantidade] ?? "1", 10);

      if (!data || !mercadoNome || !produtoNome) {
        errors.push(`Linha ${i + 1}: campos obrigatórios vazios.`);
        skipped++;
        continue;
      }
      if (!Number.isFinite(preco) || preco <= 0) {
        errors.push(`Linha ${i + 1}: preço inválido (${row[idx.preco]}).`);
        skipped++;
        continue;
      }
      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        errors.push(
          `Linha ${i + 1}: quantidade inválida (${row[idx.quantidade]}).`
        );
        skipped++;
        continue;
      }

      // 1. Mercado
      let mercadoId = mercadoCache.get(mercadoNome.toLowerCase());
      if (mercadoId === undefined) {
        const found = await db.getFirstAsync<{ id: number }>(
          "SELECT id FROM mercados WHERE nome = ? COLLATE NOCASE",
          mercadoNome
        );
        if (found) {
          mercadoId = found.id;
        } else {
          const result = await db.runAsync(
            "INSERT INTO mercados (nome) VALUES (?)",
            mercadoNome
          );
          mercadoId = result.lastInsertRowId;
        }
        mercadoCache.set(mercadoNome.toLowerCase(), mercadoId);
      }

      // 2. Produto (também atualiza categoria se vier preenchida)
      const produtoId = await findOrCreateProduct(produtoNome);
      if (categoria && categoria !== "Geral") {
        await db.runAsync(
          "UPDATE produtos SET categoria = ? WHERE id = ?",
          categoria,
          produtoId
        );
      }

      // 3. Compra (uma por mercado+data, status finalizada)
      const compraKey = `${mercadoId}|${data}`;
      let compraId = compraCache.get(compraKey);
      if (compraId === undefined) {
        const foundCompra = await db.getFirstAsync<{ id: number }>(
          `SELECT id FROM compras
           WHERE mercado_id = ? AND data = ? AND status = 'finalizada'
           ORDER BY id ASC LIMIT 1`,
          mercadoId,
          data
        );
        if (foundCompra) {
          compraId = foundCompra.id;
        } else {
          const r = await db.runAsync(
            `INSERT INTO compras (mercado_id, data, status)
             VALUES (?, ?, 'finalizada')`,
            mercadoId,
            data
          );
          compraId = r.lastInsertRowId;
        }
        compraCache.set(compraKey, compraId);
      }

      // 4. Dedup: já existe item com mesma chave?
      const dup = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM itens_compra
         WHERE compra_id = ? AND produto_id = ? AND preco = ?`,
        compraId,
        produtoId,
        preco
      );
      if (dup) {
        skipped++;
        continue;
      }

      // 5. Insere o item
      await db.runAsync(
        `INSERT INTO itens_compra (compra_id, produto_id, preco, quantidade)
         VALUES (?, ?, ?, ?)`,
        compraId,
        produtoId,
        preco,
        quantidade
      );
      imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Linha ${i + 1}: ${msg}`);
      skipped++;
    }
  }

  // 6. Recalcula total das compras afetadas (vamos só passar por todas que
  // criamos/tocamos via cache — soma os subtotais e atualiza compras.total).
  for (const compraId of compraCache.values()) {
    const row = await db.getFirstAsync<{ total: number | null }>(
      "SELECT SUM(subtotal) AS total FROM itens_compra WHERE compra_id = ?",
      compraId
    );
    await db.runAsync(
      "UPDATE compras SET total = ? WHERE id = ?",
      row?.total ?? 0,
      compraId
    );
  }

  return { imported, skipped, errors };
}

// ============ PARSER ============

/**
 * Parser CSV RFC 4180-ish. Suporta campos com aspas duplas, vírgulas
 * escapadas e quebras de linha dentro de quoted fields. Aceita CRLF e LF.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      row.push(field);
      field = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      field = "";
      if (ch === "\r" && text[i + 1] === "\n") i += 2;
      else i++;
    } else {
      field += ch;
      i++;
    }
  }

  // Última linha (caso o arquivo não termine com newline)
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  return rows;
}
