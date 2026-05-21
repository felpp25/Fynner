/**
 * Tela do Carrinho — feature central do Fynner (Stage 3).
 *
 * Composição vertical:
 *   [ScreenHeader]          → título + tema + settings
 *   [MarketHeader]          → mercado ativo + data + trocar
 *   [TotalBanner]           → total + orçamento (toca para editar)
 *   [SwipeListView itens]   → cada item com +/− e swipe-esquerda pra deletar
 *   [Footer fixo]           → Escanear · Adicionar · Finalizar (variant=danger)
 *
 * Comportamento:
 * - Se não há sessão ativa, mostra EmptyState com CTA "Selecionar mercado".
 * - Se há sessão mas zero itens, mostra EmptyState com CTA "Adicionar item".
 * - O total e a barra de orçamento atualizam em tempo real após cada ação
 *   (o CartContext recarrega tudo do banco após mutações).
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";

import { BudgetModal } from "@/components/cart/BudgetModal";
import { CartItem } from "@/components/cart/CartItem";
import { MarketHeader } from "@/components/cart/MarketHeader";
import { TotalBanner } from "@/components/cart/TotalBanner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import type { ItemComProduto } from "@/types";
import { formatBRL } from "@/utils/currency";

const SWIPE_BTN_WIDTH = 80;

export default function CarrinhoScreen() {
  const { theme } = useTheme();
  const {
    loading,
    sessaoAtiva,
    mercadoAtivo,
    itens,
    totalAtual,
    updateQuantity,
    removeItem,
    finalizeSession,
    setBudget,
  } = useCart();
  const [budgetOpen, setBudgetOpen] = useState(false);

  function adjustQty(itemId: number, currentQty: number, delta: number) {
    const next = currentQty + delta;
    // Decrementar de 1 para 0 = remover (com confirmação leve via Alert).
    if (next <= 0) {
      Alert.alert(
        "Remover item?",
        "A quantidade chegará a zero. O item será removido do carrinho.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: () => removeItem(itemId),
          },
        ]
      );
      return;
    }
    updateQuantity(itemId, next);
  }

  function handleIncrement(item: ItemComProduto) {
    adjustQty(item.id, item.quantidade, +1);
  }

  function handleDecrement(item: ItemComProduto) {
    adjustQty(item.id, item.quantidade, -1);
  }

  function handleFinalize() {
    if (!sessaoAtiva || itens.length === 0) return;
    Alert.alert(
      "Finalizar compra?",
      `Total: ${formatBRL(totalAtual)}\nEsta compra irá para o histórico.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Finalizar",
          style: "default",
          onPress: async () => {
            await finalizeSession();
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Carrinho" right={<ThemeToggle />} showSettings />
      </Screen>
    );
  }

  // Sem mercado selecionado / sem sessão ativa.
  if (!sessaoAtiva || !mercadoAtivo) {
    return (
      <Screen>
        <ScreenHeader title="Carrinho" right={<ThemeToggle />} showSettings />
        <EmptyState
          icon="storefront-outline"
          title="Selecione um mercado"
          description="Para começar a registrar o que você está comprando, escolha em qual supermercado você está."
          actionLabel="Escolher mercado"
          onAction={() => router.push("/modals/market-select")}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.headerArea}>
        <ScreenHeader title="Carrinho" right={<ThemeToggle />} showSettings />
        <View style={styles.stack}>
          <MarketHeader mercado={mercadoAtivo} dataCompra={sessaoAtiva.data} />
          <TotalBanner
            total={totalAtual}
            quantidadeItens={itens.length}
            orcamento={sessaoAtiva.orcamento}
            onPressBudget={() => setBudgetOpen(true)}
          />
        </View>
      </View>

      {itens.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Carrinho vazio"
          description="Escaneie uma etiqueta de preço ou adicione um produto manualmente."
          actionLabel="Adicionar item"
          onAction={() => router.push("/modals/add-item")}
        />
      ) : (
        <SwipeListView
          data={itens}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <CartItem
                item={item}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            </View>
          )}
          renderHiddenItem={({ item }) => (
            <View style={styles.hiddenWrap}>
              <View style={styles.hiddenRow}>
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => removeItem(item.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Remover ${item.produto_nome}`}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff6b9d" />
                  <Text style={styles.deleteText}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          rightOpenValue={-SWIPE_BTN_WIDTH}
          disableRightSwipe
          closeOnRowOpen
          closeOnRowPress
          tension={40}
          friction={8}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View
        style={[
          styles.footer,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <View style={styles.footerRow}>
          <View style={{ flex: 1 }}>
            <Button
              label="Escanear"
              icon="scan-outline"
              onPress={() => router.push("/scan")}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Adicionar"
              icon="add-circle-outline"
              variant="ghost"
              onPress={() => router.push("/modals/add-item")}
              fullWidth
            />
          </View>
        </View>
        {itens.length > 0 ? (
          <Button
            label="Finalizar compra"
            icon="checkmark-circle-outline"
            variant="danger"
            onPress={handleFinalize}
            fullWidth
          />
        ) : null}
      </View>

      <BudgetModal
        visible={budgetOpen}
        currentValue={sessaoAtiva.orcamento}
        onClose={() => setBudgetOpen(false)}
        onSave={setBudget}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerArea: { paddingHorizontal: 16, paddingTop: 8 },
  stack: { gap: 12, marginTop: 8 },

  // Front e Hidden compartilham o mesmo paddingHorizontal e marginBottom
  // para que o fundo rosa fique perfeitamente alinhado com o card roxo.
  itemWrap: { paddingHorizontal: 16, marginBottom: 8 },
  hiddenWrap: { paddingHorizontal: 16, marginBottom: 8, flex: 1 },
  hiddenRow: {
    flex: 1,
    backgroundColor: "#1a0010", // rosa-crimson bg
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  deleteAction: {
    width: SWIPE_BTN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
  },
  deleteText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#ff6b9d",
  },

  listContent: { paddingTop: 12, paddingBottom: 12 },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  footerRow: { flexDirection: "row", gap: 10 },
});
