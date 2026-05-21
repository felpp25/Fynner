/**
 * ActionBar — Componente único de barra de ação inferior.
 *
 * REGRA: Toda tela/modal do Fynner que tenha botões de rodapé usa este componente.
 * Não criar variações inline com TouchableOpacity solto.
 *
 * Variantes:
 *  - primary: ação principal positiva (uma por barra)
 *  - ghost:   ação secundária, cancelar
 *  - danger:  ação destrutiva, finalização
 *
 * Limite: 1 a 3 botões por barra. Mais que isso é sinal de que a tela está
 * fazendo coisa demais — repensar o fluxo.
 */
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export type ActionBarVariant = "primary" | "ghost" | "danger";

export interface ActionBarButton {
  label: string;
  icon: IconName;
  variant: ActionBarVariant;
  onPress: () => void;
  disabled?: boolean;
}

interface ActionBarProps {
  buttons: ActionBarButton[];
}

export function ActionBar({ buttons }: ActionBarProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.accentBorder,
        },
      ]}
    >
      <View style={styles.row}>
        {buttons.map((btn) => (
          <ActionButton key={btn.label} {...btn} />
        ))}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  onPress,
  disabled,
}: ActionBarButton) {
  const v = getVariantStyles(variant);

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        v.container,
        disabled ? styles.disabled : null,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Ionicons name={icon} size={14} color={v.color} />
      <Text style={[styles.btnText, { color: v.color, fontWeight: v.weight }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: ActionBarVariant): {
  container: ViewStyle;
  color: string;
  weight: TextStyle["fontWeight"];
} {
  switch (variant) {
    case "primary":
      return {
        container: { backgroundColor: "#a203ff" },
        color: "#ffffff",
        weight: "600",
      };
    case "ghost":
      return {
        container: {
          backgroundColor: "rgba(162, 3, 255, 0.10)",
          borderWidth: 0.5,
          borderColor: "rgba(162, 3, 255, 0.35)",
        },
        color: "#d6a5fa",
        weight: "500",
      };
    case "danger":
      return {
        container: {
          backgroundColor: "rgba(255, 107, 157, 0.10)",
          borderWidth: 0.5,
          borderColor: "rgba(255, 107, 157, 0.32)",
        },
        color: "#ff6b9d",
        weight: "500",
      };
  }
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnText: {
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
