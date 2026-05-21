/**
 * Bottom sheet de confirmação para apagar um mercado.
 *
 * Apresenta duas opções (além de Cancelar):
 *  - Manter no histórico (soft delete) — preserva compras e comparativos
 *  - Apagar tudo (hard delete) — remove mercado e compras associadas
 *
 * Cada opção é uma TouchableOpacity HORIZONTAL com ícone à esquerda
 * (flexShrink:0) e bloco de textos no centro (flex:1, minWidth:0). Sem
 * esse layout exato os textos somem (descobrimos na Etapa 2 antes do fix).
 *
 * Padrões do design system: ver docs/uiux/components.md e patterns.md.
 */
import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { Mercado } from "@/types";

interface DeleteMarketSheetProps {
  mercado: Mercado | null;
  visible: boolean;
  onClose: () => void;
  onKeepHistory: (mercadoId: number) => Promise<void>;
  onDeleteAll: (mercadoId: number) => Promise<void>;
}

export function DeleteMarketSheet({
  mercado,
  visible,
  onClose,
  onKeepHistory,
  onDeleteAll,
}: DeleteMarketSheetProps) {
  const { theme } = useTheme();
  if (!mercado) return null;

  async function handleKeepHistory() {
    await onKeepHistory(mercado!.id);
    onClose();
  }

  async function handleDeleteAll() {
    await onDeleteAll(mercado!.id);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop tocável — toque fecha o sheet */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          justifyContent: "flex-end",
        }}
      >
        {/* Sheet — onPress vazio absorve o toque (não fecha) */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 0.5,
            borderColor: theme.accentBorder,
            padding: 16,
            paddingBottom: 28,
          }}
        >
          {/* Handle decorativo */}
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

          {/* Ícone central */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(255, 107, 157, 0.12)",
              borderWidth: 0.5,
              borderColor: "rgba(255, 107, 157, 0.30)",
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ff6b9d" />
          </View>

          {/* Título */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.text,
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Apagar {mercado.nome}?
          </Text>

          {/* Descrição */}
          <Text
            style={{
              fontSize: 12,
              color: theme.textMuted,
              textAlign: "center",
              lineHeight: 18,
              marginBottom: 16,
            }}
          >
            Este mercado pode ter histórico de compras.{"\n"}O que deseja fazer
            com os dados?
          </Text>

          {/* OPÇÃO 1: Manter no histórico (soft delete) — HORIZONTAL */}
          <TouchableOpacity
            onPress={handleKeepHistory}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: theme.card,
              borderWidth: 0.5,
              borderColor: theme.accentBorder,
              borderRadius: 12,
              padding: 12,
              paddingHorizontal: 14,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor: "rgba(162, 3, 255, 0.15)",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={theme.accentLight}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: theme.text }}
              >
                Manter no histórico
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                Remove da lista mas preserva comparativos e dados
              </Text>
            </View>
          </TouchableOpacity>

          {/* OPÇÃO 2: Apagar tudo (hard delete) — HORIZONTAL */}
          <TouchableOpacity
            onPress={handleDeleteAll}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: theme.card,
              borderWidth: 0.5,
              borderColor: "rgba(255, 107, 157, 0.25)",
              borderRadius: 12,
              padding: 12,
              paddingHorizontal: 14,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor: "rgba(255, 107, 157, 0.12)",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ff6b9d" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: "#ff6b9d" }}>
                Apagar tudo
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  marginTop: 2,
                }}
              >
                Remove o mercado e todo o histórico associado
              </Text>
            </View>
          </TouchableOpacity>

          {/* Cancelar — outline */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              borderWidth: 0.5,
              borderColor: theme.accentBorder,
              borderRadius: 12,
              padding: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 13, color: theme.textMuted }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
