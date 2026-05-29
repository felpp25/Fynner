/**
 * Chip horizontal de sugestão de pergunta para a Fynner IA.
 *
 * Renderizado em ScrollView horizontal abaixo do header. Ao tocar, dispara
 * a pergunta correspondente diretamente para o pipeline `askAI`.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface QuickPromptChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export function QuickPromptChip({ icon, label, onPress }: QuickPromptChipProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 18,
        paddingVertical: 6,
        paddingHorizontal: 11,
      }}
    >
      <Ionicons name={icon} size={12} color={theme.accentLight} />
      <Text style={{ fontSize: 10.5, fontWeight: "500", color: theme.accentLight }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
