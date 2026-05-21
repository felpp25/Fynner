/**
 * Tela de detalhe de uma lista (Stage 5).
 *
 * Layout:
 *  - Subheader (ícone + nome + progresso) dentro de ScrollView pai
 *  - Section "Pendentes (X)" + SwipeListView com scrollEnabled=false
 *  - Section "Coletados (X)" + SwipeListView com scrollEnabled=false
 *
 * Por que duas SwipeListView e ScrollView pai: a tentativa anterior
 * colocava section labels DENTRO do renderItem, mas o SwipeListView trata
 * a row inteira como swipeable — labels deslizavam junto com o item e o
 * renderHiddenItem rebatia em qualquer linha do array (mostrando lixeira
 * em headers). Separando, cada SwipeListView só conhece seus itens e o
 * scroll fica unificado no ScrollView pai.
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SwipeListView } from "react-native-swipe-list-view";

import { ListItemRow } from "@/components/lists/ListItemRow";
import { AddItemSheet } from "@/components/lists/AddItemSheet";
import { ActionBar } from "@/components/ui/ActionBar";
import {
  addItemToList,
  deleteListItem,
  getListById,
  getListItems,
  toggleItemCollected,
} from "@/database/queries/lists";
import { useTheme } from "@/hooks/useTheme";
import type { Lista, ListaItemComProduto } from "@/types";

type IconName = ComponentProps<typeof Ionicons>["name"];

export default function ListDetailScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lista, setLista] = useState<Lista | null>(null);
  const [itens, setItens] = useState<ListaItemComProduto[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  const listaId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (listaId === null) return;
      let cancelled = false;
      (async () => {
        try {
          const [l, items] = await Promise.all([
            getListById(listaId),
            getListItems(listaId),
          ]);
          if (cancelled) return;
          setLista(l);
          setItens(items);
        } catch (err) {
          console.error("[list-detail] falha ao carregar:", err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [listaId])
  );

  async function reload() {
    if (listaId === null) return;
    const [l, items] = await Promise.all([
      getListById(listaId),
      getListItems(listaId),
    ]);
    setLista(l);
    setItens(items);
  }

  const pendentes = useMemo(
    () => itens.filter((i) => !i.coletado),
    [itens]
  );
  const coletados = useMemo(
    () => itens.filter((i) => i.coletado),
    [itens]
  );
  const progresso =
    itens.length > 0 ? coletados.length / itens.length : 0;
  const progressoPct = `${progresso * 100}%` as `${number}%`;

  async function handleToggle(itemId: number) {
    await toggleItemCollected(itemId);
    await reload();
  }

  async function handleAdd(nome: string, quantidade: number) {
    if (listaId === null) return;
    await addItemToList(listaId, nome, quantidade);
    await reload();
  }

  async function handleDeleteItem(itemId: number) {
    await deleteListItem(itemId);
    await reload();
  }

  if (loading || !lista) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subheader: ícone + nome + progresso */}
        <View
          style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: theme.accentMid,
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons
                name={lista.icone as IconName}
                size={17}
                color={theme.accentLight}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 16, fontWeight: "600", color: theme.text }}
              >
                {lista.nome}
              </Text>
              <Text
                style={{ fontSize: 10, color: theme.textMuted, marginTop: 1 }}
              >
                {itens.length === 0
                  ? "Sem itens"
                  : `${coletados.length} de ${itens.length} ${itens.length === 1 ? "item" : "itens"} coletados`}
              </Text>
            </View>
          </View>

          {itens.length > 0 ? (
            <View
              style={{
                height: 6,
                backgroundColor: "rgba(162, 3, 255, 0.12)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: progressoPct,
                  height: "100%",
                  backgroundColor:
                    progresso === 1
                      ? "rgba(80, 220, 100, 0.85)"
                      : theme.accent,
                  borderRadius: 3,
                }}
              />
            </View>
          ) : null}
        </View>

        {/* Empty state */}
        {itens.length === 0 ? (
          <View
            style={{
              paddingTop: 60,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: theme.textMuted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Esta lista está vazia.{"\n"}Toque em &quot;Adicionar
              item&quot; para começar.
            </Text>
          </View>
        ) : null}

        {/* Seção PENDENTES — só aparece se houver pendentes */}
        {pendentes.length > 0 ? (
          <>
            <Text style={sectionLabelStyle(theme)}>
              Pendentes ({pendentes.length})
            </Text>
            <SwipeListView
              data={pendentes}
              keyExtractor={(it) => `pending-${it.id}`}
              contentContainerStyle={{ paddingHorizontal: 14 }}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ListItemRow
                  item={item}
                  onToggle={() => handleToggle(item.id)}
                />
              )}
              renderHiddenItem={({ item }) => (
                <SwipeDeleteBg
                  produtoNome={item.produto_nome}
                  onPress={() => handleDeleteItem(item.id)}
                />
              )}
              rightOpenValue={-80}
              disableRightSwipe
              closeOnRowOpen
              closeOnRowPress
              tension={40}
              friction={8}
            />
          </>
        ) : null}

        {/* Seção COLETADOS — só aparece se houver coletados */}
        {coletados.length > 0 ? (
          <>
            <Text style={sectionLabelStyle(theme, /*topGap*/ true)}>
              Coletados ({coletados.length})
            </Text>
            <SwipeListView
              data={coletados}
              keyExtractor={(it) => `done-${it.id}`}
              contentContainerStyle={{ paddingHorizontal: 14 }}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ListItemRow
                  item={item}
                  onToggle={() => handleToggle(item.id)}
                />
              )}
              renderHiddenItem={({ item }) => (
                <SwipeDeleteBg
                  produtoNome={item.produto_nome}
                  onPress={() => handleDeleteItem(item.id)}
                />
              )}
              rightOpenValue={-80}
              disableRightSwipe
              closeOnRowOpen
              closeOnRowPress
              tension={40}
              friction={8}
            />
          </>
        ) : null}
      </ScrollView>

      <ActionBar
        buttons={[
          {
            label: "Adicionar item",
            icon: "add-circle-outline",
            variant: "primary",
            onPress: () => setShowAddSheet(true),
          },
        ]}
      />

      <AddItemSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onConfirm={handleAdd}
      />
    </View>
  );
}

/** Estilo do label de seção. `topGap` adiciona espaço extra antes da seção "Coletados". */
function sectionLabelStyle(
  theme: ReturnType<typeof useTheme>["theme"],
  topGap = false
) {
  return {
    fontSize: 9,
    color: theme.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 1.1,
    paddingHorizontal: 18,
    paddingTop: topGap ? 14 : 10,
    paddingBottom: 6,
  };
}

/** Background rosa-crimson com botão Remover — usado no renderHiddenItem das duas listas. */
function SwipeDeleteBg({
  produtoNome,
  onPress,
}: {
  produtoNome: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1a0010",
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={`Remover ${produtoNome}`}
        style={{
          width: 80,
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Ionicons name="trash-outline" size={18} color="#ff6b9d" />
        <Text style={{ fontSize: 10, fontWeight: "500", color: "#ff6b9d" }}>
          Remover
        </Text>
      </TouchableOpacity>
    </View>
  );
}
