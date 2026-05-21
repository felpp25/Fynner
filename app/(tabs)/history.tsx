/**
 * Tela Histórico (Stage 4).
 *
 * Lista de compras passadas + InsightCards do mês + comparativo de mercados.
 * Filtros (período + mercado) via bottom sheet. Toque numa compra abre
 * o detalhe via Stack root.
 *
 * useFocusEffect garante que ao voltar do detalhe a lista se atualize
 * (caso o usuário tenha mudado algo lá — embora hoje seja só leitura).
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterSheet, type HistoryFilters } from "@/components/history/FilterSheet";
import { InsightCard } from "@/components/history/InsightCard";
import { MarketComparison } from "@/components/history/MarketComparison";
import { SessionCard } from "@/components/history/SessionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getAllMarkets, getMarketComparison } from "@/database/queries/markets";
import {
  getMonthlyStats,
  getSessionHistory,
  type MonthlyStats,
} from "@/database/queries/sessions";
import { useTheme } from "@/hooks/useTheme";
import type {
  CompraComMercado,
  MarketComparison as MarketComparisonData,
  Mercado,
} from "@/types";

const DEFAULT_FILTERS: HistoryFilters = { periodo: "mes", mercadoId: null };

export default function HistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [compras, setCompras] = useState<CompraComMercado[]>([]);
  const [mercados, setMercados] = useState<Mercado[]>([]);
  const [comparison, setComparison] = useState<MarketComparisonData[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Mercados são fixos durante a sessão — carrega uma vez só.
  useEffect(() => {
    getAllMarkets()
      .then(setMercados)
      .catch((err) => console.error("[history] mercados:", err));
  }, []);

  // Recarrega ao focar a tela ou quando filtros mudam.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const [hist, comp, st] = await Promise.all([
            getSessionHistory(50, {
              mercadoId: filters.mercadoId ?? undefined,
              periodo: filters.periodo,
            }),
            getMarketComparison(filters.periodo),
            getMonthlyStats(),
          ]);
          if (cancelled) return;
          setCompras(hist);
          setComparison(comp);
          setStats(st);
        } catch (err) {
          console.error("[history] falha ao carregar:", err);
        } finally {
          if (!cancelled) setLoaded(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [filters])
  );

  function handleOpenDetail(compraId: number) {
    router.push({
      pathname: "/modals/session-detail",
      params: { id: compraId.toString() },
    });
  }

  // Badge no botão de filtros mostra quantos filtros não-default estão ativos
  const activeFiltersCount =
    (filters.periodo !== "mes" ? 1 : 0) +
    (filters.mercadoId !== null ? 1 : 0);

  // Cálculo dos deltas dos InsightCards
  const totalPercent =
    stats && stats.totalAnterior > 0
      ? Math.round(
          ((stats.totalAtual - stats.totalAnterior) / stats.totalAnterior) * 100
        )
      : null;
  const comprasDelta = stats ? stats.comprasAtuais - stats.comprasAnteriores : 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingTop: 6,
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: theme.text,
            letterSpacing: -0.3,
          }}
        >
          Histórico
        </Text>

        <TouchableOpacity
          onPress={() => setShowFilterSheet(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: theme.card,
            borderWidth: 0.5,
            borderColor: theme.accentBorder,
            borderRadius: 20,
            paddingVertical: 6,
            paddingHorizontal: 11,
          }}
        >
          <Ionicons name="filter-outline" size={13} color={theme.accentLight} />
          <Text style={{ color: theme.accentLight, fontSize: 11 }}>
            Filtros
          </Text>
          {activeFiltersCount > 0 ? (
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: theme.accent,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "600", color: "#fff" }}>
                {activeFiltersCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingBottom: 30,
          gap: 8,
        }}
        showsVerticalScrollIndicator={false}
      >
        {loaded && compras.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <EmptyState
              icon="time-outline"
              title="Nenhuma compra ainda"
              description="Suas compras vão aparecer aqui assim que você finalizar a primeira."
            />
          </View>
        ) : (
          <>
            {compras.map((c) => (
              <SessionCard
                key={c.id}
                compra={c}
                onPress={() => handleOpenDetail(c.id)}
              />
            ))}

            {/* Insights do mês */}
            {stats ? (
              <>
                <SectionLabel marginTop={14}>Insights deste mês</SectionLabel>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <InsightCard
                    label="Gasto total"
                    value={`R$ ${Math.round(stats.totalAtual)}`}
                    delta={
                      totalPercent !== null
                        ? {
                            direction:
                              totalPercent > 0
                                ? "up"
                                : totalPercent < 0
                                  ? "down"
                                  : "flat",
                            text: `${Math.abs(totalPercent)}% vs mês anterior`,
                            sentiment: totalPercent > 0 ? "bad" : "good",
                          }
                        : undefined
                    }
                  />
                  <InsightCard
                    label="Compras"
                    value={stats.comprasAtuais.toString()}
                    delta={{
                      direction:
                        comprasDelta > 0
                          ? "up"
                          : comprasDelta < 0
                            ? "down"
                            : "flat",
                      text:
                        comprasDelta === 0
                          ? "igual ao mês anterior"
                          : `${Math.abs(comprasDelta)} ${comprasDelta > 0 ? "a mais" : "a menos"}`,
                      sentiment: "neutral",
                    }}
                  />
                </View>
              </>
            ) : null}

            {/* Comparativo de mercados */}
            {comparison.length > 0 ? (
              <>
                <SectionLabel marginTop={14}>
                  Comparativo de mercados
                </SectionLabel>
                <MarketComparison data={comparison} />
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        mercados={mercados}
        initialFilters={filters}
        onApply={setFilters}
      />
    </View>
  );
}

/** Label de seção compacto, usado entre os blocos da scroll. */
function SectionLabel({
  children,
  marginTop = 0,
}: {
  children: string;
  marginTop?: number;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ paddingHorizontal: 4, marginTop, marginBottom: 2 }}>
      <Text
        style={{
          fontSize: 9,
          color: theme.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1.1,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
