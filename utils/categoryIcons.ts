/**
 * Mapeia uma categoria de produto para um ícone do Ionicons.
 *
 * Hoje todas as categorias são "Geral" (catálogo cresce orgânico no app).
 * Mantemos esta função pronta para quando o usuário começar a categorizar
 * produtos: bastará adicionar entradas no `mapping` abaixo, sem mexer nos
 * componentes que consomem.
 */
import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"];

const DEFAULT_ICON: IconName = "pricetag-outline";

const mapping: Array<{ test: RegExp; icon: IconName }> = [
  { test: /(gr[ãa]o|arroz|feij[ãa]o|cereal)/i, icon: "leaf-outline" },
  { test: /(bebida|leite|suco|refri|\bágua\b|cerveja|vinho|caf[ée])/i, icon: "wine-outline" },
  { test: /(limpeza|sab[ãa]o|detergente|desinfet)/i, icon: "sparkles-outline" },
  { test: /(higiene|papel|escova|pasta)/i, icon: "water-outline" },
  { test: /(hortifr[uú]ti|fruta|verdura|legume|banana|tomate|ma[çc][ãa])/i, icon: "nutrition-outline" },
  { test: /(carne|frango|peixe|bife|linguic)/i, icon: "restaurant-outline" },
  { test: /(padaria|p[ãa]o|bolo|biscoito)/i, icon: "pizza-outline" },
];

export function getCategoryIcon(categoria: string | undefined): IconName {
  if (!categoria) return DEFAULT_ICON;
  for (const { test, icon } of mapping) {
    if (test.test(categoria)) return icon;
  }
  return DEFAULT_ICON;
}
