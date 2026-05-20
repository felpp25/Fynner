/**
 * Sanity check — só em __DEV__.
 *
 * Executa uma série de queries representativas e loga os resultados.
 * Serve para o Stage 2 validar visualmente que o banco e as queries
 * estão funcionando corretamente. Não é teste automatizado.
 *
 * Após o Stage 3 (carrinho funcional) este arquivo pode ser removido —
 * a UI passa a ser o teste vivo.
 */
import { getAllMarkets, getMarketComparison } from "./queries/markets";
import { getAllProducts, getProductPriceHistory } from "./queries/products";
import {
  getAnyActiveSession,
  getSessionHistory,
  getTotalByMonth,
} from "./queries/sessions";
import { getItemsBySession } from "./queries/items";
import { getListItems } from "./queries/list";

export async function runSanityCheck(): Promise<void> {
  if (!__DEV__) return;

  console.log("\n========== SANITY CHECK ==========");

  const mercados = await getAllMarkets();
  console.log(`[sanity] mercados: ${mercados.length}`);
  mercados.forEach((m) =>
    console.log(`  - #${m.id} ${m.nome} (cor ${m.cor})`)
  );

  const produtos = await getAllProducts();
  console.log(`[sanity] produtos: ${produtos.length}`);

  const comparison = await getMarketComparison();
  console.log("[sanity] comparativo de mercados:");
  comparison.forEach((c) =>
    console.log(
      `  - ${c.mercado_nome}: ${c.total_visitas} visita(s), última R$ ${c.ultimo_total.toFixed(2)} em ${c.ultima_visita || "—"}`
    )
  );

  const sessions = await getSessionHistory(5);
  console.log(`[sanity] últimas ${sessions.length} sessões:`);
  for (const s of sessions) {
    console.log(
      `  - #${s.id} ${s.mercado_nome} (${s.status}): R$ ${s.total.toFixed(2)} com ${s.total_itens} itens em ${s.data}`
    );
  }

  const ativa = await getAnyActiveSession();
  if (ativa) {
    console.log(
      `[sanity] sessão ativa: #${ativa.id} em ${ativa.mercado_nome}, R$ ${ativa.total.toFixed(2)}`
    );
    const itens = await getItemsBySession(ativa.id);
    itens.forEach((i) =>
      console.log(
        `    · ${i.produto_nome} — R$ ${i.preco.toFixed(2)} × ${i.quantidade} = R$ ${i.subtotal.toFixed(2)}`
      )
    );
  } else {
    console.log("[sanity] nenhuma sessão ativa");
  }

  // Histórico de preço do Arroz (deve aparecer em 2 mercados se o seed rodou)
  const arroz = produtos.find((p) => p.nome.toLowerCase().includes("arroz"));
  if (arroz) {
    const historico = await getProductPriceHistory(arroz.id);
    console.log(`[sanity] histórico do "${arroz.nome}":`);
    historico.forEach((h) =>
      console.log(`  - ${h.data} em ${h.mercado_nome}: R$ ${h.preco.toFixed(2)}`)
    );
  }

  const lista = await getListItems();
  console.log(`[sanity] lista de compras: ${lista.length} item(ns)`);
  lista.forEach((l) =>
    console.log(
      `  - ${l.coletado ? "[x]" : "[ ]"} ${l.produto_nome} × ${l.quantidade_desejada}`
    )
  );

  const yearMonth = new Date().toISOString().slice(0, 7);
  const totalMes = await getTotalByMonth(yearMonth);
  console.log(`[sanity] total finalizado em ${yearMonth}: R$ ${totalMes.toFixed(2)}`);

  console.log("===================================\n");
}
