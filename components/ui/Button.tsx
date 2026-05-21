/**
 * Botão padronizado do Fynner. Três estilos:
 * - primary: fundo accent roxo, texto branco. Para CTAs principais.
 * - ghost:   fundo card, texto accentLight. Para ações secundárias.
 * - danger:  outline rosa-crimson (#ff6b9d sobre fundo translúcido).
 *            Mesma cor do swipe-delete do CartItem — usado em ações
 *            destrutivas e em "Finalizar compra" para fechar a sessão.
 */
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  fullWidth,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const styleByVariant = {
    primary: {
      bg: palette.accent,
      text: palette.white,
      border: palette.accent,
    },
    ghost: {
      bg: theme.card,
      text: palette.accentLight,
      border: theme.border,
    },
    // Rosa-crimson outline: ação destrutiva/encerramento, sem quebrar o clima roxo.
    // Mesma cor usada no swipe-delete do CartItem.
    danger: {
      bg: "rgba(255, 107, 157, 0.08)",
      text: "#ff6b9d",
      border: "rgba(255, 107, 157, 0.30)",
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: styleByVariant.bg,
          borderColor: styleByVariant.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={styleByVariant.text} size="small" />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={18} color={styleByVariant.text} />
          ) : null}
          <Text style={[styles.label, { color: styleByVariant.text }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  fullWidth: { alignSelf: "stretch" },
  label: { fontSize: 15, fontWeight: "600" },
});
