/**
 * Modal de seleção de mercado.
 *
 * - Lista os mercados cadastrados como `ListRow` (toque seleciona e fecha)
 * - Formulário inline no rodapé para criar um novo mercado
 * - `ActionBar` no fim — alterna entre "Novo mercado" (idle) e "Cancelar / Criar" (form aberto)
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

import { DeleteMarketSheet } from "@/components/market/DeleteMarketSheet";
import { ActionBar, type ActionBarButton } from "@/components/ui/ActionBar";
import { ListRow } from "@/components/ui/ListRow";
import { palette } from "@/constants/Colors";
import {
  createMarket,
  getAllMarkets,
  hardDeleteMarket,
  softDeleteMarket,
} from "@/database/queries/markets";
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

/** Formata "YYYY-MM-DD" para "DD MMM" em português, ex: "20 mai". */
function formatLastVisit(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function MarketSelectModal() {
  const { theme } = useTheme();
  const { selectMarket, reload: reloadCart } = useCart();
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [corSelecionada, setCorSelecionada] = useState(MARKET_COLORS[0]);

  const [marketToDelete, setMarketToDelete] = useState<Mercado | null>(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  async function loadMarkets() {
    try {
      const all = await getAllMarkets();
      setMercados(all);
    } catch (err) {
      console.error("[market-select] falha ao listar:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarkets();
  }, []);

  async function handleSelect(mercadoId: number) {
    await selectMarket(mercadoId);
    router.back();
  }

  function handleDeletePress(mercado: Mercado) {
    setMarketToDelete(mercado);
    setShowDeleteSheet(true);
  }

  function handleDeleteClose() {
    setShowDeleteSheet(false);
    setMarketToDelete(null);
  }

  async function handleKeepHistory(mercadoId: number) {
    await softDeleteMarket(mercadoId);
    await loadMarkets();
    // O carrinho pode estar referenciando este mercado; sincroniza pra que o
    // header do carrinho reflita a remoção (sessão ativa permanece, só sai
    // da lista de seleção).
    await reloadCart();
  }

  async function handleDeleteAll(mercadoId: number) {
    await hardDeleteMarket(mercadoId);
    await loadMarkets();
    // Hard delete apaga compras inclusive a sessão ativa — o carrinho
    // precisa recarregar para detectar que não há mais sessão.
    await reloadCart();
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

  const actionButtons: ActionBarButton[] = showForm
    ? [
        {
          label: "Cancelar",
          icon: "close",
          variant: "ghost",
          onPress: () => {
            setShowForm(false);
            setNovoNome("");
          },
        },
        {
          label: "Criar",
          icon: "checkmark",
          variant: "primary",
          onPress: handleCreate,
          disabled: !novoNome.trim() || creating,
        },
      ]
    : [
        {
          label: "Novo mercado",
          icon: "add-circle-outline",
          variant: "primary",
          onPress: () => setShowForm(true),
        },
      ];

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
            subtitle={
              item.ultima_visita
                ? `Última visita: ${formatLastVisit(item.ultima_visita)}`
                : "Nenhuma compra ainda"
            }
            showArrow
            onPress={() => handleSelect(item.id)}
            rightContent={
              <Pressable
                onPress={() => handleDeletePress(item)}
                // Faz o toque parar aqui — sem isso, o Pressable do ListRow
                // recebia o evento e selecionava o mercado por acidente.
                onStartShouldSetResponder={() => true}
                accessibilityLabel={`Apagar ${item.nome}`}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Ionicons name="trash-outline" size={13} color="#ff6b9d" />
              </Pressable>
            }
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

      {showForm ? (
        <View style={[styles.formArea, { backgroundColor: theme.surface }]}>
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
        </View>
      ) : null}

      <ActionBar buttons={actionButtons} />

      <DeleteMarketSheet
        mercado={marketToDelete}
        visible={showDeleteSheet}
        onClose={handleDeleteClose}
        onKeepHistory={handleKeepHistory}
        onDeleteAll={handleDeleteAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { padding: 14 },
  loading: { padding: 16, alignItems: "center" },
  empty: { padding: 24, textAlign: "center", fontSize: 13 },
  formArea: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorPick: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#1a0010",
    borderWidth: 0.5,
    borderColor: "rgba(255, 107, 157, 0.30)",
    justifyContent: "center",
    alignItems: "center",
  },
});
