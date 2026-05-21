/**
 * Tela de detalhe de uma lista (Stage 5).
 *
 * Mostra subheader com ícone, nome e progresso. Lista os itens divididos
 * em "Pendentes" e "Coletados" (label inline antes do primeiro item de
 * cada grupo). Toque alterna coletado; swipe-left remove.
 *
 * Sobre section labels no SwipeListView: o renderItem retorna o label
 * inline (Fragment) — quando o usuário arrasta o primeiro item de uma
 * seção, o fundo rosa cobre também o label. Se ficar ruim visualmente,
 * trocar por ScrollView + .map (perde o swipe, ganha layout limpo).
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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

  // Ordem visual: pendentes primeiro, coletados depois
  const sortedItems = [...pendentes, ...coletados];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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

      {/* Conteúdo: empty state ou lista */}
      {itens.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
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
            Esta lista está vazia.{"\n"}Toque em &quot;Adicionar item&quot;
            para começar.
          </Text>
        </View>
      ) : (
        <SwipeListView
          data={sortedItems}
          keyExtractor={(it) => it.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingBottom: 90,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isFirstPending = !item.coletado && index === 0;
            const isFirstCollected =
              item.coletado &&
              (index === 0 || !sortedItems[index - 1].coletado);

            return (
              <View>
                {isFirstPending ? (
                  <SectionLabel>
                    Pendentes ({pendentes.length})
                  </SectionLabel>
                ) : null}
                {isFirstCollected ? (
                  <SectionLabel>
                    Coletados ({coletados.length})
                  </SectionLabel>
                ) : null}
                <ListItemRow
                  item={item}
                  onToggle={() => handleToggle(item.id)}
                />
              </View>
            );
          }}
          renderHiddenItem={({ item, index }) => {
            // Empurra o background pra baixo na altura do section label
            // pra ele não cobrir o texto "Pendentes"/"Coletados".
            const isFirstPending = !item.coletado && index === 0;
            const isFirstCollected =
              item.coletado &&
              (index === 0 || !sortedItems[index - 1].coletado);
            const hasLabel = isFirstPending || isFirstCollected;

            return (
              <View
                style={{
                  flex: 1,
                  paddingTop: hasLabel ? 28 : 0,
                }}
              >
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
                    onPress={() => handleDeleteItem(item.id)}
                    accessibilityLabel={`Remover ${item.produto_nome}`}
                    style={{
                      width: 80,
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#ff6b9d"
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "500",
                        color: "#ff6b9d",
                      }}
                    >
                      Remover
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          rightOpenValue={-80}
          disableRightSwipe
          closeOnRowOpen
          closeOnRowPress
          tension={40}
          friction={8}
        />
      )}

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Text
      style={{
        fontSize: 9,
        color: theme.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1.1,
        paddingHorizontal: 4,
        paddingTop: 10,
        paddingBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}
