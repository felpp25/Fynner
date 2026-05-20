/**
 * Tela Fynner IA (Stage 1 — skeleton).
 * Stage 8: UI completa do chat + voz com respostas locais.
 * Stage 9: integração real com API de IA.
 */
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";

export default function AiScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Fynner IA" subtitle="Assistente do seu carrinho" />

      <View style={styles.placeholder}>
        <Text style={[styles.placeholderTitle, { color: theme.text }]}>
          Em construção
        </Text>
        <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
          O assistente com chat por voz e texto chega no Stage 8.
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
