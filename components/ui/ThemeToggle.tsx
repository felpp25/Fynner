/**
 * Botão sol/lua que alterna entre tema dark e light.
 * Usado no header da tela Carrinho (e também em Configurações).
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { mode, toggleTheme, theme } = useTheme();
  const isDark = mode === "dark";

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityLabel={
        isDark ? "Mudar para tema claro" : "Mudar para tema escuro"
      }
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={20}
        color={palette.accentLight}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
