/**
 * Modal de seleção de mercado.
 *
 * - Lista os mercados cadastrados como `ListRow` (toque seleciona e fecha)
 * - Formulário inline no rodapé para criar um novo mercado
 *
 * Selecionar um mercado faz duas coisas (via CartContext.selectMarket):
 *   1. Retoma sessão ativa naquele mercado se existir
 *   2. Caso contrário, cria nova sessão ativa
 */
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
import { ListRow } from "@/components/ui/ListRow";
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
          <ListRow
            leftCustom={
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: item.cor,
                  flexShrink: 0,
                }}
              />
            }
            title={item.nome}
            subtitle={item.endereco}
            showArrow
            onPress={() => handleSelect(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
  listContent: { padding: 14 },
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
