/**
 * Bottom sheet de criação de novo mercado.
 *
 * Resolve o bug do form ficar atrás do teclado:
 *  - Modal envolve um KeyboardAvoidingView que empurra o sheet pra cima
 *  - iOS: behavior="padding"; Android: behavior="height"
 *  - autoFocus no TextInput abre o teclado automaticamente
 *
 * O `onConfirm` é responsável por criar o mercado e selecionar (a sheet
 * só coleta nome + cor; o resto fica com a tela.) Ela reseta o estado
 * interno ao fechar.
 */
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";

// Paleta de cores disponíveis pra identificar mercados visualmente.
const MARKET_COLORS = [
  "#a203ff", // roxo (padrão)
  "#e63946", // vermelho
  "#457b9d", // azul
  "#f4a261", // laranja
  "#2ec4b6", // teal
  "#f9c74f", // amarelo
  "#4ecdc4", // ciano
  "#e76f51", // terracota
];

interface NewMarketSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (nome: string, cor: string) => Promise<void>;
}

export function NewMarketSheet({
  visible,
  onClose,
  onConfirm,
}: NewMarketSheetProps) {
  const { theme } = useTheme();
  const [nome, setNome] = useState("");
  const [corSelecionada, setCorSelecionada] = useState(MARKET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!nome.trim()) return;
    setLoading(true);
    try {
      await onConfirm(nome.trim(), corSelecionada);
      setNome("");
      setCorSelecionada(MARKET_COLORS[0]);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setNome("");
    setCorSelecionada(MARKET_COLORS[0]);
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
          {/* Toque fora fecha */}
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleClose}
            activeOpacity={1}
          />

          {/* Sheet do formulário */}
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

            {/* Campo de nome */}
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              Nome do mercado
            </Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Assaí, Dia, Mercadão..."
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
                marginBottom: 12,
              }}
            />

            {/* Seletor de cor */}
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              Cor de identificação
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
            >
              <View style={{ flexDirection: "row", gap: 10 }}>
                {MARKET_COLORS.map((cor) => (
                  <TouchableOpacity
                    key={cor}
                    onPress={() => setCorSelecionada(cor)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: cor,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: corSelecionada === cor ? 2.5 : 0,
                      borderColor: "#fff",
                    }}
                  >
                    {corSelecionada === cor ? (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#fff",
                        }}
                      />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Botões — Cancelar + Criar (padrão visual do ActionBar) */}
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
                  backgroundColor: "#a203ff",
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
