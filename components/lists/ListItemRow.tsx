/**
 * Linha de item da lista com checkbox circular.
 *
 * Toque alterna coletado/pendente. Quando coletado: checkbox roxo cheio +
 * texto riscado + opacidade 50% no card inteiro.
 *
 * Não tem botões internos — o swipe-to-delete fica a cargo do SwipeListView
 * que envolve o componente.
 */
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { ListaItemComProduto } from "@/types";

interface ListItemRowProps {
  item: ListaItemComProduto;
  onToggle: () => void;
}

export function ListItemRow({ item, onToggle }: ListItemRowProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 12,
        padding: 10,
        paddingHorizontal: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 52,
        opacity: item.coletado ? 0.5 : 1,
      }}
    >
      {/* Checkbox circular */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1.5,
          borderColor: item.coletado
            ? theme.accent
            : "rgba(162, 3, 255, 0.5)",
          backgroundColor: item.coletado ? theme.accent : "transparent",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {item.coletado ? (
          <Ionicons name="checkmark" size={13} color="#fff" />
        ) : null}
      </View>

      {/* Nome do produto — riscado quando coletado */}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          color: theme.text,
          textDecorationLine: item.coletado ? "line-through" : "none",
        }}
      >
        {item.produto_nome}
      </Text>

      {/* Quantidade desejada */}
      <Text
        style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0 }}
      >
        × {item.quantidade_desejada}
      </Text>
    </TouchableOpacity>
  );
}
