/**
 * Tela Lista de Compras (Stage 1 — skeleton).
 * Stage 5: lista pré-configurada reutilizável com checkboxes e progresso.
 */
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";

export default function ListScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Lista" subtitle="O que você quer comprar" />

      <View style={styles.placeholder}>
        <Text style={[styles.placeholderTitle, { color: theme.text }]}>
          Em construção
        </Text>
        <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
          A lista de compras com checkboxes e progresso chega no Stage 5.
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
