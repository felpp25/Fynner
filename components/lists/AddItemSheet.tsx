/**
 * Bottom sheet de adição de item a uma lista.
 *
 * Estrutura idêntica ao NewListSheet: Modal + KeyboardAvoidingView empurra
 * o sheet acima do teclado. Tem 2 campos: nome do produto (autoFocus) e
 * quantidade com controles +/−.
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

import { useTheme } from "@/hooks/useTheme";

interface AddItemSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (nome: string, quantidade: number) => Promise<void>;
}

export function AddItemSheet({
  visible,
  onClose,
  onConfirm,
}: AddItemSheetProps) {
  const { theme } = useTheme();
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      await onConfirm(nome.trim(), quantidade);
      setNome("");
      setQuantidade(1);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNome("");
    setQuantidade(1);
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
              Adicionar item
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
              Nome do produto
            </Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Arroz Camil 5kg"
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

            {/* Quantidade — controle +/− centralizado */}
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              Quantidade
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                marginBottom: 14,
              }}
            >
              <TouchableOpacity
                onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.accentMid,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="remove" size={18} color="#fff" />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                  color: theme.text,
                  minWidth: 40,
                  textAlign: "center",
                }}
              >
                {quantidade}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantidade(quantidade + 1)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.accent,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
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
                  {loading ? "Adicionando..." : "Adicionar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
