/**
 * Tela Histórico (Stage 1 — skeleton).
 * Stage 4: lista de compras passadas e comparativo de mercados.
 */
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";

export default function HistoryScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Histórico" subtitle="Suas compras anteriores" />

      <View style={styles.placeholder}>
        <Text style={[styles.placeholderTitle, { color: theme.text }]}>
          Em construção
        </Text>
        <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
          O histórico e o comparativo de mercados chegam no Stage 4.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  placeholderTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  placeholderText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
