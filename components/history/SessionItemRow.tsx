/**
 * Linha compacta de um item dentro do detalhe de uma compra.
 *
 * Estrutura: [IconBox sm] [nome + preço×qtd] [subtotal]
 * Diferente do CartItem porque é READ-ONLY (não tem +/− nem swipe).
 */
import { Text, View } from "react-native";

import { IconBox } from "@/components/ui/IconBox";
import { useTheme } from "@/hooks/useTheme";
import type { ItemComProduto } from "@/types";
import { getCategoryIcon } from "@/utils/categoryIcons";

interface SessionItemRowProps {
  item: ItemComProduto;
}

export function SessionItemRow({ item }: SessionItemRowProps) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 12,
        padding: 10,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <IconBox icon={getCategoryIcon(item.produto_categoria)} size="sm" />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 12, fontWeight: "500", color: theme.text }}
        >
          {item.produto_nome}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: theme.textMuted,
            marginTop: 1,
          }}
        >
          R$ {item.preco.toFixed(2)} × {item.quantidade}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: theme.accentLight,
          flexShrink: 0,
        }}
      >
        R$ {item.subtotal.toFixed(2)}
      </Text>
    </View>
  );
}
