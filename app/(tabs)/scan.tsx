/**
 * Tela Scan (Stage 1 — skeleton).
 * No Stage 6 vamos integrar expo-camera + ML Kit para OCR de etiquetas.
 */
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useTheme } from "@/hooks/useTheme";

export default function ScanScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <ScreenHeader title="Scan" subtitle="Leitor de etiquetas" />

      <View style={styles.placeholder}>
        <Text style={[styles.placeholderTitle, { color: theme.text }]}>
          Em construção
        </Text>
        <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
          Scanner OCR (câmera + ML Kit) virá no Stage 6.
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
