/**
 * Header com nome do mercado, data, e botão "Trocar mercado".
 * Quando nenhum mercado está selecionado, mostra CTA pra escolher.
 */
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import type { Mercado } from "@/types";

interface MarketHeaderProps {
  mercado: Mercado | null;
  dataCompra?: string;
}

function formatDate(isoDate?: string): string {
  if (!isoDate) {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  }
  // isoDate é YYYY-MM-DD (do SQLite date()).
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function MarketHeader({ mercado, dataCompra }: MarketHeaderProps) {
  const { theme } = useTheme();

  if (!mercado) {
    return (
      <Link href="/modals/market-select" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.root,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.colorDot,
              { backgroundColor: palette.accentMid },
            ]}
          />
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.text }]}>
              Selecionar mercado
            </Text>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              Comece criando ou escolhendo um supermercado
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.accentLight} />
        </Pressable>
      </Link>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: mercado.cor }]} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]}>{mercado.nome}</Text>
        <Text style={[styles.date, { color: theme.textMuted }]}>
          {formatDate(dataCompra)}
        </Text>
      </View>
      <Link href="/modals/market-select" asChild>
        <Pressable
          style={({ pressed }) => [
            styles.changeBtn,
            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.changeLabel, { color: palette.accentLight }]}>
            Trocar
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  date: { fontSize: 12, marginTop: 2 },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  changeLabel: { fontSize: 12, fontWeight: "600" },
});
