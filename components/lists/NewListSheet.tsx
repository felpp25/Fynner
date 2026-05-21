/**
 * Bottom sheet de criação de nova lista (nome + ícone).
 *
 * Estrutura idêntica ao NewMarketSheet: Modal + KeyboardAvoidingView
 * empurra o sheet acima do teclado. autoFocus no TextInput abre teclado.
 *
 * O grid de 8 ícones vem de constants/listIcons.ts.
 */
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LIST_ICONS } from "@/constants/listIcons";
import { useTheme } from "@/hooks/useTheme";

interface NewListSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (nome: string, icone: string) => Promise<void>;
}

export function NewListSheet({
  visible,
  onClose,
  onConfirm,
}: NewListSheetProps) {
  const { theme } = useTheme();
  const [nome, setNome] = useState("");
  const [iconeSelecionado, setIconeSelecionado] = useState(LIST_ICONS[0].name);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      await onConfirm(nome.trim(), iconeSelecionado);
      setNome("");
      setIconeSelecionado(LIST_ICONS[0].name);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNome("");
    setIconeSelecionado(LIST_ICONS[0].name);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleClose}
            activeOpacity={1}
          />

          <View
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 0.5,
              borderColor: theme.accentBorder,
              padding: 16,
              paddingBottom: Platform.OS === "ios" ? 28 : 16,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(214, 165, 250, 0.25)",
                alignSelf: "center",
                marginBottom: 14,
              }}
            />

            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: theme.text,
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              Nova lista
            </Text>

            {/* Nome */}
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              Nome da lista
            </Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Churrasco do sábado"
              placeholderTextColor={theme.textHint}
              autoFocus
              style={{
                backgroundColor: theme.card,
                borderWidth: 0.5,
                borderColor:
                  nome.length > 0
                    ? "rgba(162, 3, 255, 0.6)"
                    : theme.accentBorder,
                borderRadius: 11,
                padding: 11,
                paddingHorizontal: 13,
                fontSize: 14,
                color: theme.text,
                marginBottom: 14,
              }}
            />

            {/* Grid de ícones */}
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              Ícone
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {LIST_ICONS.map((opt) => {
                const isSelected = iconeSelecionado === opt.name;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setIconeSelecionado(opt.name)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: isSelected
                        ? theme.accentMid
                        : theme.card,
                      borderWidth: 0.5,
                      borderColor: isSelected
                        ? theme.accent
                        : theme.accentBorder,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={opt.name}
                      size={17}
                      color={isSelected ? "#fff" : theme.accentLight}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botões */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(162, 3, 255, 0.10)",
                  borderWidth: 0.5,
                  borderColor: "rgba(162, 3, 255, 0.35)",
                  borderRadius: 12,
                  paddingVertical: 11,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="close" size={14} color={theme.accentLight} />
                <Text
                  style={{
                    color: theme.accentLight,
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!nome.trim() || loading}
                style={{
                  flex: 1,
                  backgroundColor: theme.accent,
                  borderRadius: 12,
                  paddingVertical: 11,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: !nome.trim() || loading ? 0.5 : 1,
                }}
              >
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                  {loading ? "Criando..." : "Criar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
