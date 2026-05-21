/**
 * Tela Listas (Stage 5).
 *
 * Mostra as listas nomeadas como SwipeListView de cards (swipe-left
 * apaga a lista inteira). Botão "Nova lista" no ActionBar abre o sheet
 * de criação; ao criar, navega direto pro detalhe da lista nova.
 *
 * useFocusEffect garante que ao voltar do detalhe a lista se atualize
 * (progresso e timestamp).
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SwipeListView } from "react-native-swipe-list-view";

import { ListCard } from "@/components/lists/ListCard";
import { NewListSheet } from "@/components/lists/NewListSheet";
import { ActionBar } from "@/components/ui/ActionBar";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  createList,
  deleteList,
  getAllLists,
} from "@/database/queries/lists";
import { useTheme } from "@/hooks/useTheme";
import type { ListaComProgresso } from "@/types";

export default function ListsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listas, setListas] = useState<ListaComProgresso[]>([]);
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const all = await getAllLists();
          if (!cancelled) setListas(all);
        } catch (err) {
          console.error("[lists] falha ao listar:", err);
        } finally {
          if (!cancelled) setLoaded(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function reload() {
    const all = await getAllLists();
    setListas(all);
  }

  async function handleCreate(nome: string, icone: string) {
    const id = await createList(nome, icone);
    await reload();
    router.push({
      pathname: "/modals/list-detail",
      params: { id: id.toString() },
    });
  }

  async function handleDelete(listaId: number) {
    await deleteList(listaId);
    await reload();
  }

  function handleOpen(listaId: number) {
    router.push({
      pathname: "/modals/list-detail",
      params: { id: listaId.toString() },
    });
  }

  const isEmpty = loaded && listas.length === 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: theme.text,
            letterSpacing: -0.3,
          }}
        >
          Listas
        </Text>
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            icon="list-outline"
            title="Nenhuma lista ainda"
            description="Crie listas reutilizáveis para suas compras frequentes, eventos ou ocasiões especiais."
          />
        </View>
      ) : (
        <SwipeListView
          data={listas}
          keyExtractor={(l) => l.id.toString()}
          contentContainerStyle={{
            padding: 14,
            paddingBottom: 90,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ListCard lista={item} onPress={() => handleOpen(item.id)} />
          )}
          renderHiddenItem={({ item }) => (
            <View
              style={{
                flex: 1,
                backgroundColor: "#1a0010",
                borderRadius: 14,
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                accessibilityLabel={`Apagar ${item.nome}`}
                style={{
                  width: 80,
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ff6b9d" />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: "#ff6b9d",
                  }}
                >
                  Apagar
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
            label: isEmpty ? "Criar primeira lista" : "Nova lista",
            icon: "add-circle-outline",
            variant: "primary",
            onPress: () => setShowNewSheet(true),
          },
        ]}
      />

      <NewListSheet
        visible={showNewSheet}
        onClose={() => setShowNewSheet(false)}
        onConfirm={handleCreate}
      />
    </View>
  );
}
