/**
 * Tela Carrinho (Stage 1 — skeleton).
 *
 * Esta é a tela principal do app. No Stage 3 vamos implementar:
 * - Header com nome do mercado e data
 * - TotalBanner com total e barra de orçamento
 * - Lista de itens (CartItem) com botões +/− e swipe-delete
 * - Footer fixo com botões "Escanear" e "Inserir manualmente"
 *
 * No Stage 1 é só skeleton com:
 * - Header com título "Carrinho"
 * - Botão de tema (sol/lua) — único interativo neste stage
 * - Botão de engrenagem que abre /settings
 * - Texto de placeholder
 */
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

export default function CarrinhoScreen() {
  const { theme } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        title="Carrinho"
        subtitle="Selecione um mercado para começar"
        right={<ThemeToggle />}
        showSettings
      />

      <View style={styles.placeholder}>
        <Text style={[styles.placeholderTitle, { color: theme.text }]}>
          Em construção
        </Text>
        <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
          O carrinho com itens, total e orçamento será implementado no Stage 3.
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
