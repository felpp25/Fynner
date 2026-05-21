/**
 * Card de uma lista na tela principal.
 *
 * Estrutura vertical:
 *   [ícone][nome + meta][seta]
 *   [barra de progresso][label "X de Y" ou "Completa"]
 *
 * A barra fica verde quando 100% completa, roxa caso contrário. Listas
 * sem itens não mostram a barra (só o card e a meta "Sem itens").
 */
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { ListaComProgresso } from "@/types";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface ListCardProps {
  lista: ListaComProgresso;
  onPress: () => void;
}

/**
 * Tempo relativo amigável. Parse manual de "YYYY-MM-DD HH:MM:SS" (formato
 * do datetime() do SQLite, que é UTC). Acrescentamos "Z" para o Date
 * interpretar como UTC e calcular diff corretamente vs new Date() local.
 */
function formatRelativeTime(updatedAt: string): string {
  const updated = new Date(updatedAt.replace(" ", "T") + "Z");
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "agora há pouco";
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHours < 24) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  return `${Math.floor(diffDays / 30)} meses atrás`;
}

export function ListCard({ lista, onPress }: ListCardProps) {
  const { theme } = useTheme();
  const isComplete =
    lista.total_itens > 0 && lista.itens_coletados === lista.total_itens;
  const progress =
    lista.total_itens > 0 ? lista.itens_coletados / lista.total_itens : 0;
  const progressPct = `${progress * 100}%` as `${number}%`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        padding: 13,
        gap: 9,
      }}
    >
      {/* Linha 1: ícone + nome/meta + seta */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: theme.accentMid,
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Ionicons
            name={lista.icone as IconName}
            size={17}
            color={theme.accentLight}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: "500", color: theme.text }}
          >
            {lista.nome}
          </Text>
          <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}>
            {lista.total_itens === 0
              ? "Sem itens"
              : `${lista.total_itens} ${lista.total_itens === 1 ? "item" : "itens"} · ${formatRelativeTime(lista.updated_at)}`}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.textMuted}
          style={{ flexShrink: 0 }}
        />
      </View>

      {/* Linha 2: barra de progresso (omitida se lista vazia) */}
      {lista.total_itens > 0 ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 5,
              backgroundColor: "rgba(162, 3, 255, 0.12)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: progressPct,
                height: "100%",
                backgroundColor: isComplete
                  ? "rgba(80, 220, 100, 0.85)"
                  : theme.accent,
                borderRadius: 3,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: isComplete
                ? "rgba(80, 220, 100, 0.85)"
                : theme.accentLight,
              minWidth: 56,
              textAlign: "right",
            }}
          >
            {isComplete
              ? "Completa"
              : `${lista.itens_coletados} de ${lista.total_itens}`}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
