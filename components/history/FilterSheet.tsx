/**
 * Bottom sheet de filtros do histórico.
 *
 * Estado local até o usuário tocar "Aplicar" — só aí chamamos `onApply`.
 * Isso evita re-fetch a cada toque num chip.
 *
 * `FilterPeriodo` vem de `@/types` pra ser compartilhado com as queries.
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/hooks/useTheme";
import type { FilterPeriodo, Mercado } from "@/types";

export interface HistoryFilters {
  periodo: FilterPeriodo;
  mercadoId: number | null; // null = todos
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  mercados: Mercado[];
  initialFilters: HistoryFilters;
  onApply: (filters: HistoryFilters) => void;
}

const PERIODOS: { id: FilterPeriodo; label: string }[] = [
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mês" },
  { id: "3meses", label: "Últimos 3 meses" },
  { id: "tudo", label: "Tudo" },
];

export function FilterSheet({
  visible,
  onClose,
  mercados,
  initialFilters,
  onApply,
}: FilterSheetProps) {
  const { theme } = useTheme();
  const [periodo, setPeriodo] = useState<FilterPeriodo>(initialFilters.periodo);
  const [mercadoId, setMercadoId] = useState<number | null>(
    initialFilters.mercadoId
  );

  // Reset ao abrir — sincroniza com filtros atuais da tela
  useEffect(() => {
    if (visible) {
      setPeriodo(initialFilters.periodo);
      setMercadoId(initialFilters.mercadoId);
    }
  }, [visible, initialFilters]);

  function handleClear() {
    setPeriodo("mes");
    setMercadoId(null);
  }

  function handleApply() {
    onApply({ periodo, mercadoId });
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 0.5,
            borderColor: theme.accentBorder,
            padding: 16,
            paddingBottom: 28,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(214, 165, 250, 0.25)",
              alignSelf: "center",
              marginBottom: 14,
            }}
          />

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: theme.text,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            Filtros
          </Text>

          {/* Período */}
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.1,
                marginBottom: 8,
              }}
            >
              Período
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {PERIODOS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  selected={periodo === p.id}
                  onPress={() => setPeriodo(p.id)}
                />
              ))}
            </View>
          </View>

          {/* Mercado */}
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.1,
                marginBottom: 8,
              }}
            >
              Mercado
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: "row", gap: 6 }}
            >
              <Chip
                label="Todos"
                selected={mercadoId === null}
                onPress={() => setMercadoId(null)}
              />
              {mercados.map((m) => (
                <Chip
                  key={m.id}
                  label={m.nome}
                  dotColor={m.cor}
                  selected={mercadoId === m.id}
                  onPress={() => setMercadoId(m.id)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Ações — Limpar / Aplicar */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
            <TouchableOpacity
              onPress={handleClear}
              style={{
                flex: 1,
                backgroundColor: "rgba(162, 3, 255, 0.10)",
                borderWidth: 0.5,
                borderColor: "rgba(162, 3, 255, 0.35)",
                borderRadius: 12,
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="close" size={13} color={theme.accentLight} />
              <Text
                style={{
                  color: theme.accentLight,
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                Limpar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              style={{
                flex: 1,
                backgroundColor: theme.accent,
                borderRadius: 12,
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="checkmark" size={13} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Aplicar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  dotColor?: string;
  onPress: () => void;
}

function Chip({ label, selected, dotColor, onPress }: ChipProps) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 0.5,
        borderColor: selected ? theme.accent : theme.accentBorder,
        backgroundColor: selected ? theme.accent : theme.card,
      }}
    >
      {dotColor ? (
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: selected ? "#fff" : theme.accentLight,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
