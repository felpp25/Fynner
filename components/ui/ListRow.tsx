/**
 * Linha de lista padrão. Substitui qualquer card de lista do app
 * (mercados, configurações, futuras telas de histórico/lista).
 *
 * Layout: [ícone à esquerda] [título+subtítulo (flex:1, minWidth:0)] [direita (flexShrink:0)]
 *
 * Regras de ouro:
 * - centro precisa de `flex:1` + `minWidth:0` para truncar com `numberOfLines={1}`
 * - extremos precisam de `flexShrink:0` para nunca encolherem
 * - área de toque mínima de 62px (acessibilidade)
 */
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { IconBox } from "./IconBox";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface ListRowProps {
  // Esquerda
  icon?: IconName;
  iconBgColor?: string;
  iconColor?: string;
  iconSize?: "sm" | "md" | "lg";
  leftCustom?: ReactNode;

  // Centro
  title: string;
  subtitle?: string;
  titleColor?: string;

  // Direita
  rightContent?: ReactNode;
  showArrow?: boolean;

  // Comportamento
  onPress?: () => void;
  disabled?: boolean;
}

export function ListRow({
  icon,
  iconBgColor,
  iconColor,
  iconSize = "md",
  leftCustom,
  title,
  subtitle,
  titleColor,
  rightContent,
  showArrow = false,
  onPress,
  disabled = false,
}: ListRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        padding: 11,
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        minHeight: 62,
        opacity: disabled ? 0.5 : pressed && onPress ? 0.7 : 1,
      })}
    >
      {leftCustom ? (
        leftCustom
      ) : icon ? (
        <IconBox
          icon={icon}
          size={iconSize}
          bgColor={iconBgColor}
          iconColor={iconColor}
        />
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: titleColor ?? theme.text,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: theme.textMuted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightContent || showArrow ? (
        <View
          style={{
            flexShrink: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          {rightContent}
          {showArrow ? (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textMuted}
            />
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
