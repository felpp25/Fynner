/**
 * Modal de seleção de mercado.
 *
 * - Lista os mercados cadastrados (toque seleciona e fecha o modal)
 * - Formulário inline para criar um novo mercado
 *
 * Selecionar um mercado faz duas coisas (via CartContext.selectMarket):
 *   1. Retoma sessão ativa naquele mercado se existir
 *   2. Caso contrário, cria nova sessão ativa
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { palette } from "@/constants/Colors";
import { createMarket, getAllMarkets } from "@/database/queries/markets";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import type { Mercado } from "@/types";

// Cores sugeridas para identificar mercados visualmente.
const MARKET_COLORS = [
  "#a203ff",
  "#e63946",
  "#1d3557",
  "#f4a261",
  "#06d6a0",
  "#ffba08",
  "#2a9d8f",
];

export default function MarketSelectModal() {
  const { theme } = useTheme();
  const { selectMarket } = useCart();
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [corSelecionada, setCorSelecionada] = useState(MARKET_COLORS[0]);

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllMarkets();
        setMercados(all);
      } catch (err) {
        console.error("[market-select] falha ao listar:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSelect(mercadoId: number) {
    await selectMarket(mercadoId);
    router.back();
  }

  async function handleCreate() {
    const nome = novoNome.trim();
    if (!nome) return;
    setCreating(true);
    try {
      const id = await createMarket(nome, { cor: corSelecionada });
      await selectMarket(id);
      router.back();
    } catch (err) {
      console.error("[market-select] falha ao criar:", err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <FlatList
        data={mercados}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item.id)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              style={[styles.colorDot, { backgroundColor: item.cor }]}
            />
            <Text style={[styles.name, { color: theme.text }]}>
              {item.nome}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textHint} />
          </Pressable>
        )}
        ListHeaderComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              Nenhum mercado cadastrado ainda. Crie o primeiro abaixo.
            </Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        {showForm ? (
          <View style={styles.form}>
            <TextInput
              value={novoNome}
              onChangeText={setNovoNome}
              placeholder="Nome do mercado"
              placeholderTextColor={theme.textHint}
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.colorRow}>
              {MARKET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCorSelecionada(c)}
                  style={[
                    styles.colorPick,
                    {
                      backgroundColor: c,
                      borderColor:
                        c === corSelecionada ? theme.text : "transparent",
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.formActions}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancelar"
                  variant="ghost"
                  onPress={() => {
                    setShowForm(false);
                    setNovoNome("");
                  }}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Criar"
                  onPress={handleCreate}
                  disabled={!novoNome.trim()}
                  loading={creating}
                  fullWidth
                />
              </View>
            </View>
          </View>
        ) : (
          <Button
            label="Novo mercado"
            icon="add-circle-outline"
            variant="ghost"
            onPress={() => setShowForm(true)}
            fullWidth
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { padding: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: "600" },
  loading: { padding: 16, alignItems: "center" },
  empty: { padding: 24, textAlign: "center", fontSize: 13 },
  footer: { padding: 12, borderTopWidth: 1 },
  form: { gap: 10 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorPick: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  formActions: { flexDirection: "row", gap: 10 },
});
