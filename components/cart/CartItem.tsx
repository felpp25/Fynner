/**
 * Item do carrinho — uma linha da lista de produtos.
 *
 * Mostra:
 * - Ícone de categoria (genérico no Stage 3)
 * - Nome do produto + categoria
 * - Preço × quantidade + subtotal
 * - Botões +/− para ajustar quantidade
 *
 * Tocar no item abre o modal de detalhe (histórico de preço).
 * O swipe-delete é controlado pela SwipeListView que envolve este item;
 * aqui não há lógica de swipe.
 */
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import type { ItemComProduto } from "@/types";
import { formatBRL } from "@/utils/currency";

interface CartItemProps {
  item: ItemComProduto;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function CartItem({ item, onIncrease, onDecrease }: CartItemProps) {
  const { theme } = useTheme();

  return (
    <Link
      href={{
        pathname: "/modals/item-detail",
        params: { produtoId: String(item.produto_id) },
      }}
      asChild
    >
      <Pressable
        style={({ pressed }) => [
          styles.root,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.accentBg, borderColor: theme.border },
          ]}
        >
          <Ionicons name="pricetag-outline" size={18} color={palette.accentLight} />
        </View>

        <View style={styles.info}>
          <Text
            numberOfLines={1}
            style={[styles.name, { color: theme.text }]}
          >
            {item.produto_nome}
          </Text>
          <Text style={[styles.detail, { color: theme.textMuted }]}>
            {formatBRL(item.preco)} × {item.quantidade}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={[styles.subtotal, { color: palette.accentLight }]}>
            {formatBRL(item.subtotal)}
          </Text>
          <View style={styles.qtyControls}>
            <QtyButton icon="remove" onPress={onDecrease} />
            <Text style={[styles.qtyValue, { color: theme.text }]}>
              {item.quantidade}
            </Text>
            <QtyButton icon="add" onPress={onIncrease} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function QtyButton({
  icon,
  onPress,
}: {
  icon: "add" | "remove";
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.qtyBtn,
        {
          backgroundColor: theme.accentBg,
          borderColor: theme.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={14} color={palette.accentLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600" },
  detail: { fontSize: 12, marginTop: 2 },
  right: { alignItems: "flex-end", gap: 6 },
  subtotal: { fontSize: 15, fontWeight: "700" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: { fontSize: 13, fontWeight: "700", minWidth: 18, textAlign: "center" },
});
