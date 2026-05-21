/**
 * Bottom sheet de confirmação para apagar um mercado.
 *
 * Apresenta duas opções (além de Cancelar):
 *  - Manter no histórico (soft delete) — preserva compras e comparativos
 *  - Apagar tudo (hard delete) — remove mercado e compras associadas
 *
 * Padrão aprovado de bottom sheet (ver CLAUDE.md §10): handle pill no topo,
 * borderTopRadius 22, fundo overlay 75%. Cor rosa-crimson (#ff6b9d) exclusiva
 * de ações destrutivas.
 */
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { Mercado } from "@/types";

interface DeleteMarketSheetProps {
  mercado: Mercado | null;
  visible: boolean;
  onClose: () => void;
  onKeepHistory: (mercadoId: number) => Promise<void> | void;
  onDeleteAll: (mercadoId: number) => Promise<void> | void;
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

  async function handleKeep() {
    await onKeepHistory(mercado!.id);
    onClose();
  }

  async function handleDelete() {
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
      {/* Overlay: toque fecha a sheet */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Wrapper interno absorve o toque pra não fechar ao tocar na sheet */}
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.accentBorder },
          ]}
          onPress={() => {
            /* swallow */
          }}
        >
          <View style={styles.handle} />

          <View style={styles.iconCircle}>
            <Ionicons name="trash-outline" size={20} color="#ff6b9d" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Apagar {mercado.nome}?
          </Text>
          <Text style={[styles.desc, { color: theme.textMuted }]}>
            Este mercado pode ter histórico de compras.{"\n"}O que deseja fazer
            com os dados?
          </Text>

          {/* Opção 1: Manter histórico (soft delete) */}
          <Pressable
            onPress={handleKeep}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: theme.card,
                borderColor: theme.accentBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: "rgba(162, 3, 255, 0.15)" },
              ]}
            >
              <Ionicons name="time-outline" size={16} color={theme.accentLight} />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>
                Manter no histórico
              </Text>
              <Text style={[styles.optionDesc, { color: theme.textMuted }]}>
                Remove da lista mas preserva comparativos e dados
              </Text>
            </View>
          </Pressable>

          {/* Opção 2: Apagar tudo (hard delete) */}
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: theme.card,
                borderColor: "rgba(255, 107, 157, 0.25)",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: "rgba(255, 107, 157, 0.12)" },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color="#ff6b9d" />
            </View>
            <View style={styles.optionTextBlock}>
              <Text style={[styles.optionTitle, { color: "#ff6b9d" }]}>
                Apagar tudo
              </Text>
              <Text style={[styles.optionDesc, { color: theme.textMuted }]}>
                Remove o mercado e todo o histórico associado
              </Text>
            </View>
          </Pressable>

          {/* Cancelar */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              {
                borderColor: theme.accentBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>
              Cancelar
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 0.5,
    padding: 16,
    paddingBottom: 28,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(214, 165, 250, 0.25)",
    alignSelf: "center",
    marginBottom: 14,
  },
  iconCircle: {
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
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  desc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  optionTextBlock: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 13, fontWeight: "500" },
  optionDesc: { fontSize: 10, marginTop: 2 },
  cancel: {
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 2,
  },
  cancelText: { fontSize: 13 },
});
