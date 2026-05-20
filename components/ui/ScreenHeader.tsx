/**
 * Header padrão das telas — título grande + área de ações à direita.
 *
 * Não usamos o header nativo do Stack porque queremos um visual customizado
 * (tipografia grande, integrado ao fundo da tela, sem barra superior).
 */
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Ações renderizadas à direita (ex: botão de tema). */
  right?: ReactNode;
  /** Se true, mostra o ícone de engrenagem que abre /settings. */
  showSettings?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  showSettings,
}: ScreenHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {right}
        {showSettings ? (
          <Link href="/settings" asChild>
            <Pressable
              accessibilityLabel="Abrir configurações"
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={palette.accentLight}
              />
            </Pressable>
          </Link>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  titleBlock: { flexShrink: 1 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
