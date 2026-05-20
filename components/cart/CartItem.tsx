/**
 * CartItem — card frontal de um item do carrinho (Stage 3, UI fix).
 *
 * Layout aprovado em review:
 *  ┌──────────────────────────────────────────────────────┐
 *  │ [ícone 34x34]  Nome do produto      R$ subtotal      │
 *  │                R$ X,XX × qtd        [−] qtd [+]      │
 *  └──────────────────────────────────────────────────────┘
 *
 * Importante:
 *  - O ícone à esquerda tem flexShrink:0 para nunca colapsar.
 *  - O bloco de info no meio usa flex:1 + minWidth:0 para garantir que
 *    o numberOfLines={1} respeite o espaço disponível e não estoure.
 *  - O bloco direito tem flexShrink:0 para preservar tamanho do total
 *    e dos botões +/−.
 *  - Os botões +/− são Pressables filhos do Pressable do card — o RN
 *    absorve o evento no filho, então tocar em +/− não dispara o tap
 *    do card (que abre o modal de detalhes).
 */
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ItemComProduto } from "@/types";
import { formatBRL } from "@/utils/currency";
import { getCategoryIcon } from "@/utils/categoryIcons";

interface CartItemProps {
  item: ItemComProduto;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function CartItem({ item, onIncrease, onDecrease }: CartItemProps) {
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
          styles.cardFront,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={styles.catIcon}>
          <Ionicons
            name={getCategoryIcon(item.produto_categoria)}
            size={17}
            color="#d6a5fa"
          />
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.produto_nome}
          </Text>
          <Text style={styles.itemSub}>
            {formatBRL(item.preco)} × {item.quantidade}
          </Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemTotal}>{formatBRL(item.subtotal)}</Text>
          <View style={styles.qtyCtrl}>
            <Pressable
              hitSlop={6}
              onPress={onDecrease}
              style={[styles.qBtn, styles.qBtnMuted]}
            >
              <Text style={styles.qBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyText}>{item.quantidade}</Text>
            <Pressable
              hitSlop={6}
              onPress={onIncrease}
              style={[styles.qBtn, styles.qBtnAccent]}
            >
              <Text style={styles.qBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardFront: {
    backgroundColor: "#1a0229",
    borderWidth: 0.5,
    borderColor: "rgba(162, 3, 255, 0.22)",
    borderRadius: 14,
    padding: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  catIcon: {
    width: 34,
    height: 34,
    backgroundColor: "rgba(162, 3, 255, 0.22)",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 10,
    color: "rgba(214, 165, 250, 0.55)",
  },
  itemRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  itemTotal: {
    fontSize: 12,
    color: "#d6a5fa",
    fontWeight: "600",
  },
  qtyCtrl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  qBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  qBtnAccent: {
    backgroundColor: "#a203ff",
  },
  qBtnMuted: {
    backgroundColor: "rgba(162, 3, 255, 0.22)",
  },
  qBtnText: {
    fontSize: 12,
    color: "#ffffff",
    lineHeight: 14,
  },
  qtyText: {
    fontSize: 11,
    color: "#ffffff",
    minWidth: 12,
    textAlign: "center",
  },
});
