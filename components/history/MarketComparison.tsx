/**
 * Cartão de comparativo de mercados.
 *
 * Recebe array de MarketComparison (já consolidado pela query) e renderiza
 * uma lista compacta com badge no mercado de menor `total_medio`.
 *
 * Cuidado: o nome do componente colide com o nome do tipo. Aqui o tipo
 * é importado renomeado como `MarketComparisonData` pra evitar ambiguidade.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { MarketComparison as MarketComparisonData } from "@/types";

interface MarketComparisonProps {
  data: MarketComparisonData[];
}

export function MarketComparison({ data }: MarketComparisonProps) {
  const { theme } = useTheme();
  if (data.length === 0) return null;

  // O `total_medio` é menor → mais barato; já vem ordenado ASC da query,
  // mas calculamos aqui pra não depender da ordem.
  const cheapest = [...data].sort((a, b) => a.total_medio - b.total_medio)[0];

  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        padding: 12,
        paddingHorizontal: 13,
      }}
    >
      {data.map((m, idx) => (
        <View
          key={m.mercado_id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            paddingVertical: 6,
            borderTopWidth: idx === 0 ? 0 : 0.5,
            borderTopColor: "rgba(162, 3, 255, 0.12)",
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: m.mercado_cor,
              flexShrink: 0,
            }}
          />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: theme.text,
              flex: 1,
              minWidth: 0,
            }}
          >
            {m.mercado_nome}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: theme.accentLight,
            }}
          >
            R$ {m.total_medio.toFixed(2)}
          </Text>
        </View>
      ))}

      {data.length > 1 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: "rgba(80, 220, 100, 0.12)",
            borderWidth: 0.5,
            borderColor: "rgba(80, 220, 100, 0.3)",
            borderRadius: 7,
            paddingHorizontal: 9,
            paddingVertical: 5,
            marginTop: 8,
            alignSelf: "flex-start",
          }}
        >
          <Ionicons
            name="trophy-outline"
            size={11}
            color="rgba(80, 220, 100, 0.85)"
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: "rgba(80, 220, 100, 0.85)",
            }}
          >
            {cheapest.mercado_nome} foi o mais barato neste período
          </Text>
        </View>
      ) : null}
    </View>
  );
}
