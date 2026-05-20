/**
 * Estado vazio com ícone, título, descrição e CTA opcional.
 * Usado em telas/lists sem dados ainda.
 */
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "./Button";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "cart-outline",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.root}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.accentBg, borderColor: theme.border },
        ]}
      >
        <Ionicons name={icon} size={40} color={palette.accentLight} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.textMuted }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionSlot}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  description: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  actionSlot: { marginTop: 20 },
});
