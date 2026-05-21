/**
 * CartItem — card frontal de um item do carrinho (Stage 3, refatorado).
 *
 * Layout:
 *   [IconBox] [nome + preço×qtd (flex:1, minWidth:0)] [subtotal + controles (flexShrink:0)]
 *
 * Construído sobre `IconBox` do design system. Sem ação de navegação no card —
 * o tap no card é gerenciado pelo wrapper externo (SwipeListView).
 */
import { Text, TouchableOpacity, View } from "react-native";

import { IconBox } from "@/components/ui/IconBox";
import { useTheme } from "@/hooks/useTheme";
import type { ItemComProduto } from "@/types";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { formatBRL } from "@/utils/currency";

interface CartItemProps {
  item: ItemComProduto;
  onIncrement: (item: ItemComProduto) => void;
  onDecrement: (item: ItemComProduto) => void;
}

export function CartItem({ item, onIncrement, onDecrement }: CartItemProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        padding: 11,
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        minHeight: 62,
      }}
    >
      <IconBox icon={getCategoryIcon(item.produto_categoria)} size="md" />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: theme.text,
            marginBottom: 2,
          }}
        >
          {item.produto_nome}
        </Text>
        <Text style={{ fontSize: 11, color: theme.textMuted }}>
          {formatBRL(item.preco)} × {item.quantidade}
        </Text>
      </View>

      <View
        style={{
          flexShrink: 0,
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 5,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: theme.accentLight,
          }}
        >
          {formatBRL(item.subtotal)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity
            onPress={() => onDecrement(item)}
            hitSlop={6}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: theme.accentMid,
              justifyContent: "center",
              alignItems: "center",
            }}
            accessibilityLabel="Diminuir quantidade"
          >
            <Text style={{ color: theme.text, fontSize: 13, lineHeight: 15 }}>
              −
            </Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 12,
              color: theme.text,
              minWidth: 14,
              textAlign: "center",
            }}
          >
            {item.quantidade}
          </Text>
          <TouchableOpacity
            onPress={() => onIncrement(item)}
            hitSlop={6}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: theme.accent,
              justifyContent: "center",
              alignItems: "center",
            }}
            accessibilityLabel="Aumentar quantidade"
          >
            <Text style={{ color: "#fff", fontSize: 13, lineHeight: 15 }}>
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
