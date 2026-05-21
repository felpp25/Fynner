/**
 * Quadrado arredondado com fundo tintado e ícone centralizado.
 * Componente base do design system — usado em toda linha de lista do app.
 *
 * `flexShrink: 0` é mandatório para o quadrado nunca colapsar em rows.
 */
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Size = "sm" | "md" | "lg";

interface IconBoxProps {
  icon: IconName;
  size?: Size;
  bgColor?: string;
  iconColor?: string;
}

const sizes: Record<Size, { box: number; icon: number; radius: number }> = {
  sm: { box: 28, icon: 14, radius: 7 },
  md: { box: 36, icon: 17, radius: 9 },
  lg: { box: 44, icon: 22, radius: 11 },
};

export function IconBox({ icon, size = "md", bgColor, iconColor }: IconBoxProps) {
  const { theme } = useTheme();
  const s = sizes[size];

  return (
    <View
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        backgroundColor: bgColor ?? theme.accentMid,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <Ionicons
        name={icon}
        size={s.icon}
        color={iconColor ?? theme.accentLight}
      />
    </View>
  );
}
