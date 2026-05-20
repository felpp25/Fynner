/**
 * Modal de detalhe do produto — mostra histórico de preço em diferentes
 * mercados/datas. Acionado ao tocar em um item do carrinho.
 *
 * Recebe via params: produtoId (string, convertido para number).
 *
 * No Stage 4 vamos adicionar um gráfico aqui. No Stage 3 é só tabela.
 */
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { palette } from "@/constants/Colors";
import { getProductPriceHistory } from "@/database/queries/products";
import { useTheme } from "@/hooks/useTheme";
import type { HistoricoPreco } from "@/types";
import { formatBRL } from "@/utils/currency";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ItemDetailModal() {
  const { theme } = useTheme();
  const { produtoId } = useLocalSearchParams<{ produtoId: string }>();
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(produtoId);
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const rows = await getProductPriceHistory(id);
        setHistorico(rows);
      } catch (err) {
        console.error("[item-detail] erro:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [produtoId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  if (historico.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="bar-chart-outline"
          title="Sem histórico"
          description="Este produto foi adicionado agora — ainda não há comparativo de preços."
        />
      </View>
    );
  }

  // Estatísticas rápidas: menor e maior preço.
  const valores = historico.map((h) => h.preco);
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.statsRow}>
        <StatCard label="Menor preço" value={formatBRL(menor)} accent="#22c55e" />
        <StatCard label="Maior preço" value={formatBRL(maior)} accent="#e63946" />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
        HISTÓRICO ({historico.length} compra{historico.length > 1 ? "s" : ""})
      </Text>

      <FlatList
        data={historico}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.market, { color: theme.text }]}>
                {item.mercado_nome}
              </Text>
              <Text style={[styles.date, { color: theme.textMuted }]}>
                {formatDate(item.data)}
              </Text>
            </View>
            <Text
              style={[
                styles.price,
                {
                  color:
                    item.preco === menor
                      ? "#22c55e"
                      : item.preco === maior
                        ? "#e63946"
                        : theme.text,
                },
              ]}
            >
              {formatBRL(item.preco)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "600",
    marginLeft: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  market: { fontSize: 14, fontWeight: "600" },
  date: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700" },
  listContent: { paddingBottom: 12 },
});
