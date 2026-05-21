/**
 * Card pequeno usado lado a lado (2 por linha) para mostrar uma métrica
 * numérica com tendência opcional (delta).
 *
 * `sentiment` determina a cor do delta:
 *   good  → verde (gastou menos ou pos. desejável)
 *   bad   → rosa-crimson (gastou mais)
 *   neutral → lavanda (mudança sem juízo de valor)
 */
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface InsightCardProps {
  label: string;
  value: string;
  delta?: {
    direction: "up" | "down" | "flat";
    text: string;
    sentiment: "good" | "bad" | "neutral";
  };
}

export function InsightCard({ label, value, delta }: InsightCardProps) {
  const { theme } = useTheme();

  const deltaColor =
    delta?.sentiment === "good"
      ? "rgba(80, 220, 100, 0.85)"
      : delta?.sentiment === "bad"
        ? "#ff6b9d"
        : theme.textMuted;

  const deltaBg =
    delta?.sentiment === "good"
      ? "rgba(80, 220, 100, 0.12)"
      : delta?.sentiment === "bad"
        ? "rgba(255, 107, 157, 0.10)"
        : "rgba(214, 165, 250, 0.08)";

  const arrowIcon: IconName =
    delta?.direction === "up"
      ? "arrow-up"
      : delta?.direction === "down"
        ? "arrow-down"
        : "remove";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <Text
        style={{
          fontSize: 8.5,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          color: theme.text,
          marginTop: 4,
          lineHeight: 22,
        }}
      >
        {value}
      </Text>
      {delta ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: deltaBg,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 5,
            alignSelf: "flex-start",
            marginTop: 6,
          }}
        >
          <Ionicons name={arrowIcon} size={10} color={deltaColor} />
          <Text style={{ fontSize: 9, fontWeight: "500", color: deltaColor }}>
            {delta.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
