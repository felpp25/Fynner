/**
 * Detalhe de uma compra do histórico.
 *
 * Card "hero" no topo (mercado + data + total grande) e lista de itens
 * abaixo. Read-only — não tem edição. Header nativo do Stack root cuida
 * do botão de voltar.
 */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { SessionItemRow } from "@/components/history/SessionItemRow";
import { getItemsBySession } from "@/database/queries/items";
import { getSessionById } from "@/database/queries/sessions";
import { useTheme } from "@/hooks/useTheme";
import type { CompraComMercado, ItemComProduto } from "@/types";

function formatPtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${d} de ${meses[m - 1]}.`;
}

export default function SessionDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [compra, setCompra] = useState<CompraComMercado | null>(null);
  const [itens, setItens] = useState<ItemComProduto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const compraId = parseInt(id, 10);
    if (!Number.isFinite(compraId)) {
      setLoading(false);
      return;
    }
    Promise.all([getSessionById(compraId), getItemsBySession(compraId)])
      .then(([c, i]) => {
        setCompra(c);
        setItens(i);
      })
      .catch((err) => console.error("[session-detail] erro:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !compra) {
    // Vazio enquanto carrega — o Stack header já está pintado pelo tema
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View
          style={{
            margin: 14,
            marginBottom: 8,
            backgroundColor: theme.card,
            borderWidth: 0.5,
            borderColor: "rgba(162, 3, 255, 0.42)",
            borderRadius: 14,
            padding: 14,
            paddingHorizontal: 13,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: compra.mercado_cor,
                flexShrink: 0,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                color: theme.text,
                fontWeight: "500",
                flex: 1,
                minWidth: 0,
              }}
              numberOfLines={1}
            >
              {compra.mercado_nome}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textMuted }}>
              {formatPtDate(compra.data)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              paddingTop: 10,
              borderTopWidth: 0.5,
              borderTopColor: "rgba(162, 3, 255, 0.2)",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 9,
                  color: theme.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                }}
              >
                Total da compra
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "600",
                  color: theme.text,
                  marginTop: 3,
                  lineHeight: 26,
                }}
              >
                R$ {compra.total.toFixed(2)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: theme.accentLight,
                fontWeight: "500",
              }}
            >
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </Text>
          </View>
        </View>

        {/* Label da lista */}
        <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4 }}>
          <Text
            style={{
              fontSize: 9,
              color: theme.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1.1,
            }}
          >
            Produtos comprados
          </Text>
        </View>

        {/* Lista de itens */}
        <View style={{ paddingHorizontal: 14, gap: 6 }}>
          {itens.map((it) => (
            <SessionItemRow key={it.id} item={it} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
