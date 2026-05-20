/**
 * Botão padronizado do Fynner. Dois estilos:
 * - primary: fundo accent roxo, texto branco. Para CTAs principais.
 * - ghost:   fundo card, texto accentLight. Para ações secundárias.
 * - danger:  fundo vermelho. Para ações destrutivas.
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
    danger: {
      bg: "#e63946",
      text: palette.white,
      border: "#e63946",
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
