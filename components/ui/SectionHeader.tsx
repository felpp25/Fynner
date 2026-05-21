/**
 * Rótulo de seção em caixa alta com letter-spacing.
 * Usado para separar grupos de conteúdo em telas de configurações,
 * histórico, lista de compras etc.
 */
import { Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface SectionHeaderProps {
  children: string;
  marginTop?: number;
  marginBottom?: number;
}

export function SectionHeader({
  children,
  marginTop = 0,
  marginBottom = 8,
}: SectionHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={{ marginTop, marginBottom, paddingHorizontal: 2 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
