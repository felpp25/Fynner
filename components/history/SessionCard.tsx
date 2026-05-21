/**
 * Card de uma compra na lista do histórico.
 *
 * Mostra: ponto colorido do mercado, nome, badge "EM ANDAMENTO" (se ativa),
 * tempo relativo, total e contagem de itens. Toque abre o detalhe.
 *
 * `formatRelativeTime` é local — não importa de utils/date (não existe).
 */
import { Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { CompraComMercado } from "@/types";

interface SessionCardProps {
  compra: CompraComMercado;
  onPress: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const dataFmt = `${date.getDate()} de ${meses[date.getMonth()]}.`;

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return `Ontem · ${dataFmt}`;
  if (diffDays < 7) return `${diffDays} dias atrás · ${dataFmt}`;
  if (diffDays < 14) return `1 semana atrás · ${dataFmt}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás · ${dataFmt}`;
  return dataFmt;
}

export function SessionCard({ compra, onPress }: SessionCardProps) {
  const { theme } = useTheme();
  const isActive = compra.status === "ativa";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: isActive
          ? "rgba(162, 3, 255, 0.55)"
          : theme.accentBorder,
        borderRadius: 14,
        padding: 11,
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        minHeight: 62,
      }}
    >
      {/* Ponto colorido — flexShrink:0 */}
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: compra.mercado_cor,
          flexShrink: 0,
        }}
      />

      {/* Centro: nome + badge + tempo relativo */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, fontWeight: "500", color: theme.text }}
          >
            {compra.mercado_nome}
          </Text>
          {isActive ? (
            <View
              style={{
                backgroundColor: "rgba(162, 3, 255, 0.10)",
                borderWidth: 0.5,
                borderColor: "rgba(162, 3, 255, 0.35)",
                borderRadius: 5,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 8.5,
                  fontWeight: "500",
                  color: theme.accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Em andamento
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
          {formatRelativeTime(compra.data)}
        </Text>
      </View>

      {/* Direita: total + qtd */}
      <View style={{ flexShrink: 0, alignItems: "flex-end", gap: 3 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: theme.accentLight,
          }}
        >
          R$ {compra.total.toFixed(2)}
        </Text>
        <Text style={{ fontSize: 10, color: theme.textMuted }}>
          {compra.total_itens} {compra.total_itens === 1 ? "item" : "itens"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
