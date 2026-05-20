/**
 * Banner do total atual com barra de progresso do orçamento.
 *
 * Regra das cores (definida no prompt do Stage 3):
 * - 0–80% do orçamento  → verde
 * - 80–100%             → amarelo (atenção)
 * - acima de 100%       → vermelho (estourou)
 *
 * Se o orçamento for 0 (não definido), a barra não aparece — só o total.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import { formatBRL } from "@/utils/currency";

interface TotalBannerProps {
  total: number;
  quantidadeItens: number;
  orcamento: number;
  /** Acionado ao tocar no banner. Útil para abrir editor de orçamento. */
  onPressBudget?: () => void;
}

function getBudgetColor(ratio: number): string {
  if (ratio < 0.8) return "#22c55e"; // verde
  if (ratio <= 1) return "#eab308"; // amarelo
  return "#ef4444"; // vermelho
}

export function TotalBanner({
  total,
  quantidadeItens,
  orcamento,
  onPressBudget,
}: TotalBannerProps) {
  const { theme } = useTheme();
  const hasBudget = orcamento > 0;
  const ratio = hasBudget ? total / orcamento : 0;
  const clamped = Math.min(ratio, 1.2); // pra barra não estourar visualmente
  const barWidth = `${Math.min(clamped, 1) * 100}%` as `${number}%`;
  const barColor = getBudgetColor(ratio);

  const content = (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.cardDeep, borderColor: theme.border },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.totalBlock}>
          <Text style={[styles.label, { color: theme.textMuted }]}>
            Total atual
          </Text>
          <Text style={[styles.total, { color: theme.text }]}>
            {formatBRL(total)}
          </Text>
        </View>
        <View style={styles.itemsBlock}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Itens</Text>
          <Text style={[styles.items, { color: palette.accentLight }]}>
            {quantidadeItens}
          </Text>
        </View>
      </View>

      {hasBudget ? (
        <View style={styles.budgetSection}>
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetLabel, { color: theme.textMuted }]}>
              Orçamento: {formatBRL(orcamento)}
            </Text>
            <Text style={[styles.budgetPercent, { color: barColor }]}>
              {Math.round(ratio * 100)}%
            </Text>
          </View>
          <View
            style={[styles.barTrack, { backgroundColor: theme.border }]}
          >
            <View
              style={[
                styles.barFill,
                { width: barWidth, backgroundColor: barColor },
              ]}
            />
          </View>
          {ratio > 1 ? (
            <Text style={[styles.overBudget, { color: barColor }]}>
              {formatBRL(total - orcamento)} acima do orçamento
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.noBudget, { color: theme.textHint }]}>
          Toque para definir um orçamento
        </Text>
      )}
    </View>
  );

  if (onPressBudget) {
    return (
      <Pressable
        onPress={onPressBudget}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  totalBlock: { flex: 1 },
  itemsBlock: { alignItems: "flex-end" },
  label: { fontSize: 11, letterSpacing: 1, fontWeight: "600", marginBottom: 4 },
  total: { fontSize: 32, fontWeight: "800" },
  items: { fontSize: 22, fontWeight: "700" },
  budgetSection: { marginTop: 14 },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetLabel: { fontSize: 12 },
  budgetPercent: { fontSize: 12, fontWeight: "700" },
  barTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 999 },
  overBudget: { fontSize: 12, marginTop: 6, fontWeight: "600" },
  noBudget: { fontSize: 12, marginTop: 12, fontStyle: "italic" },
});
