/**
 * Schema SQLite do Fynner.
 *
 * As tabelas refletem o domínio do app:
 * - mercados        → supermercados que o usuário visita
 * - compras         → uma sessão de compra (visita), ativa ou finalizada
 * - produtos        → catálogo pessoal de produtos (cresce com o uso)
 * - itens_compra    → o que foi comprado em cada sessão (= histórico de preço)
 * - lista_itens     → lista de compras pré-configurada
 *
 * Observações:
 * - `subtotal` em itens_compra é uma coluna GERADA (calculada pelo SQLite a
 *   partir de preco * quantidade). Não precisa ser preenchida manualmente.
 * - Cascata em itens_compra: ao deletar uma compra, seus itens vão junto.
 * - Datas armazenadas como TEXT no formato ISO (compatível com sqlite date()).
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS mercados (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  endereco    TEXT,
  cor         TEXT    DEFAULT '#a203ff',
  created_at  TEXT    DEFAULT (datetime('now'))
  -- NOTA: a coluna ativo INTEGER NOT NULL DEFAULT 1 é adicionada pela
  -- migration 002_add_market_soft_delete. Mantida fora deste CREATE TABLE
  -- pra evitar conflito com o ALTER em devices que migram da v1.
);

CREATE TABLE IF NOT EXISTS compras (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  mercado_id  INTEGER NOT NULL REFERENCES mercados(id),
  data        TEXT    NOT NULL DEFAULT (date('now')),
  total       REAL    DEFAULT 0,
  orcamento   REAL    DEFAULT 0,
  status      TEXT    DEFAULT 'ativa' CHECK(status IN ('ativa', 'finalizada')),
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  categoria   TEXT    DEFAULT 'Geral',
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itens_compra (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id   INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  produto_id  INTEGER NOT NULL REFERENCES produtos(id),
  preco       REAL    NOT NULL,
  quantidade  INTEGER NOT NULL DEFAULT 1,
  subtotal    REAL    GENERATED ALWAYS AS (preco * quantidade) STORED,
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lista_itens (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id          INTEGER NOT NULL REFERENCES produtos(id),
  quantidade_desejada INTEGER DEFAULT 1,
  coletado            INTEGER DEFAULT 0,
  ordem               INTEGER DEFAULT 0,
  created_at          TEXT    DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_itens_compra_compra_id  ON itens_compra(compra_id);
CREATE INDEX IF NOT EXISTS idx_itens_compra_produto_id ON itens_compra(produto_id);
CREATE INDEX IF NOT EXISTS idx_compras_mercado_id      ON compras(mercado_id);
CREATE INDEX IF NOT EXISTS idx_compras_data            ON compras(data);
`;
