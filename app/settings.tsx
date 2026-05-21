/**
 * Tela de Configurações.
 *
 * Construída sobre os componentes base do design system:
 * `SectionHeader` para rótulos de seção e `ListRow` para cada item.
 *
 * No Stage 7 ganhamos export/import CSV.
 */
import Constants from "expo-constants";
import { ScrollView, Switch } from "react-native";

import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useTheme } from "@/hooks/useTheme";

export default function SettingsScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 14 }}
    >
      <SectionHeader>Aparência</SectionHeader>

      <ListRow
        icon={isDark ? "moon" : "sunny"}
        title="Tema"
        subtitle={isDark ? "Escuro" : "Claro"}
        rightContent={
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.accentBorder, true: theme.accent }}
            thumbColor={theme.text}
          />
        }
      />

      <SectionHeader marginTop={20}>Sobre</SectionHeader>

      <ListRow
        icon="information-circle"
        title="Fynner"
        subtitle={`Versão ${appVersion}`}
      />
    </ScrollView>
  );
}
