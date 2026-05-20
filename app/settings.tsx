/**
 * Tela de Configurações (Stage 1).
 *
 * No Stage 1 contém apenas:
 * - Toggle de tema (sol/lua)
 * - Seção "Sobre" com versão do app
 *
 * No Stage 7 ganhamos export/import CSV.
 */
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Seção Aparência */}
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
        APARÊNCIA
      </Text>
      <Pressable
        onPress={toggleTheme}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.accentBg, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={20}
              color={palette.accentLight}
            />
          </View>
          <View>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Tema</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
              {isDark ? "Escuro" : "Claro"} — toque para alternar
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.textHint}
        />
      </Pressable>

      {/* Seção Sobre */}
      <Text
        style={[
          styles.sectionLabel,
          { color: theme.textMuted, marginTop: 24 },
        ]}
      >
        SOBRE
      </Text>
      <View
        style={[
          styles.row,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: theme.accentBg, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={palette.accentLight}
            />
          </View>
          <View>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Fynner</Text>
            <Text style={[styles.rowSubtitle, { color: theme.textMuted }]}>
              Versão {appVersion}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
});
