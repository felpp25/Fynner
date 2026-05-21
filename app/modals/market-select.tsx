/**
 * Modal de seleção de mercado.
 *
 * - Mercados renderizados como `MarketRow` em `SwipeListView` (swipe-left
 *   revela "Apagar" — padrão idêntico ao CartItem dos produtos).
 * - "Novo mercado" abre o `NewMarketSheet` (bottom sheet acima do teclado).
 * - Tocar "Apagar" abre o `DeleteMarketSheet` (soft / hard / cancel).
 *
 * Header desta tela vem do Stack root (`title: "Mercado"`, `presentation:
 * "modal"`) — por isso aqui não usamos `ScreenHeader` (duplicaria).
 *
 * Recarrega o `useCart` após qualquer delete: caso a sessão ativa fosse
 * deste mercado e o hard delete tenha apagado as compras, o carrinho
 * precisa se atualizar.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";

import { DeleteMarketSheet } from "@/components/market/DeleteMarketSheet";
import { MarketRow } from "@/components/market/MarketRow";
import { NewMarketSheet } from "@/components/market/NewMarketSheet";
import { ActionBar } from "@/components/ui/ActionBar";
import {
  createMarket,
  getAllMarkets,
  hardDeleteMarket,
  softDeleteMarket,
} from "@/database/queries/markets";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import type { Mercado } from "@/types";

export default function MarketSelectScreen() {
  const { theme } = useTheme();
  const { selectMarket, reload: reloadCart } = useCart();

  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [marketToDelete, setMarketToDelete] = useState<Mercado | null>(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showNewSheet, setShowNewSheet] = useState(false);

  useEffect(() => {
    loadMarkets();
  }, []);

  async function loadMarkets() {
    try {
      const all = await getAllMarkets();
      setMercados(all);
    } catch (err) {
      console.error("[market-select] falha ao listar:", err);
    }
  }

  async function handleSelectMarket(mercado: Mercado) {
    await selectMarket(mercado.id);
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
    // Sessão ativa continua existindo após soft delete; reloadCart
    // garante que o header do carrinho exiba o mercado correto caso
    // tenha mudado.
    await reloadCart();
  }

  async function handleDeleteAll(mercadoId: number) {
    await hardDeleteMarket(mercadoId);
    await loadMarkets();
    // Hard delete pode ter apagado a sessão ativa — sem reloadCart
    // o carrinho referenciaria uma sessão que não existe mais.
    await reloadCart();
  }

  async function handleCreateMarket(nome: string, cor: string) {
    // createMarket aceita (nome, options) — não inverter pra (nome, cor).
    const id = await createMarket(nome, { cor });
    await loadMarkets();
    // Selecionar o mercado recém-criado e fechar este modal de seleção.
    await selectMarket(id);
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SwipeListView
        data={mercados}
        keyExtractor={(m) => m.id.toString()}
        contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text
            style={{
              padding: 24,
              textAlign: "center",
              fontSize: 13,
              color: theme.textMuted,
            }}
          >
            Nenhum mercado cadastrado ainda. Crie o primeiro abaixo.
          </Text>
        }
        renderItem={({ item }) => (
          <MarketRow mercado={item} onPress={() => handleSelectMarket(item)} />
        )}
        renderHiddenItem={({ item }) => (
          <View
            style={{
              flex: 1,
              backgroundColor: "#1a0010",
              borderRadius: 14,
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => handleDeletePress(item)}
              accessibilityLabel={`Apagar ${item.nome}`}
              style={{
                width: 80,
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ff6b9d" />
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#ff6b9d" }}>
                Apagar
              </Text>
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-80}
        disableRightSwipe
        closeOnRowOpen
        closeOnRowPress
        tension={40}
        friction={8}
      />

      <ActionBar
        buttons={[
          {
            label: "Novo mercado",
            icon: "add-circle-outline",
            variant: "primary",
            onPress: () => setShowNewSheet(true),
          },
        ]}
      />

      <DeleteMarketSheet
        mercado={marketToDelete}
        visible={showDeleteSheet}
        onClose={handleDeleteClose}
        onKeepHistory={handleKeepHistory}
        onDeleteAll={handleDeleteAll}
      />

      <NewMarketSheet
        visible={showNewSheet}
        onClose={() => setShowNewSheet(false)}
        onConfirm={handleCreateMarket}
      />
    </View>
  );
}
