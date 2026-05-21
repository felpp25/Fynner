/**
 * Container padrão para blocos de conteúdo. Substitui o uso de `<View>`
 * com `backgroundColor` direto em telas. Variante `highlighted` aumenta
 * a opacidade da borda para destacar o card ativo.
 */
import { View, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface CardProps extends ViewProps {
  variant?: "default" | "highlighted";
  padding?: number;
}

export function Card({
  children,
  variant = "default",
  padding = 13,
  style,
  ...rest
}: CardProps) {
  const { theme } = useTheme();
  const borderColor =
    variant === "highlighted" ? "rgba(162, 3, 255, 0.45)" : theme.accentBorder;

  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderWidth: 0.5,
          borderColor,
          borderRadius: 14,
          padding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
