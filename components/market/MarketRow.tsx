/**
 * Card de mercado para a lista de seleção.
 *
 * Estruturalmente idêntico ao CartItem (carrinho) — mesmo padding, gap,
 * borderRadius e minHeight — pra que ambas as listas sintam a mesma coisa.
 *
 * NÃO tem botão de lixeira inline. O delete é exclusivamente por swipe-left
 * via SwipeListView (a tela cuida disso). Consistência com a lista de
 * produtos.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { Mercado } from "@/types";

interface MarketRowProps {
  mercado: Mercado;
  onPress: () => void;
}

/**
 * Helper local — não importar de utils/date (arquivo não existe).
 * Formato: "Última visita: 21 de mai." ou "Nenhuma compra ainda".
 *
 * Aceita string ISO (YYYY-MM-DD) que vem do SQLite. Faz parse manual
 * para evitar fuso horário do `new Date(iso)` que pode pular um dia
 * dependendo do tz local.
 */
function formatLastVisit(date: string | null | undefined): string {
  if (!date) return "Nenhuma compra ainda";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const meses = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `Última visita: ${d} de ${meses[m - 1]}.`;
}

export function MarketRow({ mercado, onPress }: MarketRowProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
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
      }}
    >
      {/* ESQUERDA: bolinha colorida — não encolhe */}
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: mercado.cor,
          flexShrink: 0,
        }}
      />

      {/* CENTRO: nome + subtítulo — flex:1 + minWidth:0 (sem isso quebra) */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: theme.text,
          }}
        >
          {mercado.nome}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            color: theme.textMuted,
            marginTop: 2,
          }}
        >
          {formatLastVisit(mercado.ultima_visita)}
        </Text>
      </View>

      {/* DIREITA: chevron — não encolhe */}
      <View style={{ flexShrink: 0 }}>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  );
}
