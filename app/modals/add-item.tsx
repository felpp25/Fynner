/**
 * Modal de adição manual de item.
 *
 * Fluxo:
 *  - Usuário digita nome → autocomplete sugere produtos do histórico
 *  - Usuário digita preço (input numérico com máscara "0,00")
 *  - Usuário ajusta quantidade com +/−
 *  - Preview do subtotal aparece em tempo real
 *  - Confirmar → cria/encontra produto + adiciona item ao carrinho
 *
 * Aceita params opcionais via router:
 *  - nome:  nome pré-preenchido (vem do scanner OCR no Stage 6)
 *  - preco: preço pré-preenchido em centavos como string
 */
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ActionBar } from "@/components/ui/ActionBar";
import { palette } from "@/constants/Colors";
import { searchProducts } from "@/database/queries/products";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import type { Produto } from "@/types";
import { formatBRL, maskBRLInput, parseBRL } from "@/utils/currency";

export default function AddItemModal() {
  const { theme } = useTheme();
  const { addItem, sessaoAtiva } = useCart();
  const params = useLocalSearchParams<{ nome?: string; preco?: string }>();

  const [nome, setNome] = useState(params.nome ?? "");
  const [precoInput, setPrecoInput] = useState(
    params.preco ? maskBRLInput(params.preco) : ""
  );
  const [quantidade, setQuantidade] = useState(1);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Produto[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Autocomplete debounce simples: faz busca quando o usuário muda o nome.
  useEffect(() => {
    if (nome.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await searchProducts(nome);
        if (!cancelled) setSuggestions(res);
      } catch (err) {
        console.error("[add-item] autocomplete:", err);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [nome]);

  const preco = parseBRL(precoInput);
  const precoValido = !Number.isNaN(preco) && preco > 0;
  const subtotal = useMemo(
    () => (precoValido ? preco * quantidade : 0),
    [preco, precoValido, quantidade]
  );
  const podeSalvar = nome.trim().length > 0 && precoValido && quantidade > 0;

  async function handleSave() {
    if (!podeSalvar || !sessaoAtiva) return;
    setSaving(true);
    try {
      await addItem(nome.trim(), preco, quantidade);
      router.back();
    } catch (err) {
      console.error("[add-item] erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Field label="Nome do produto">
          <TextInput
            value={nome}
            onChangeText={(t) => {
              setNome(t);
              setShowSuggestions(true);
            }}
            placeholder="Ex: Arroz Camil 5kg"
            placeholderTextColor={theme.textHint}
            style={[
              styles.input,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            autoFocus
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && suggestions.length > 0 ? (
            <View
              style={[
                styles.suggestionBox,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <FlatList
                data={suggestions}
                keyExtractor={(p) => String(p.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setNome(item.nome);
                      setShowSuggestions(false);
                    }}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={theme.textMuted}
                    />
                    <Text style={[styles.suggestionText, { color: theme.text }]}>
                      {item.nome}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          ) : null}
        </Field>

        <Field label="Preço">
          <View
            style={[
              styles.input,
              styles.row,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.prefix, { color: palette.accentLight }]}>
              R$
            </Text>
            <TextInput
              value={precoInput}
              onChangeText={(t) => setPrecoInput(maskBRLInput(t))}
              placeholder="0,00"
              placeholderTextColor={theme.textHint}
              keyboardType="number-pad"
              style={[styles.priceInput, { color: theme.text }]}
            />
          </View>
        </Field>

        <Field label="Quantidade">
          <View style={styles.qtyRow}>
            <QtyPad
              icon="remove"
              onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
            />
            <Text style={[styles.qtyValue, { color: theme.text }]}>
              {quantidade}
            </Text>
            <QtyPad icon="add" onPress={() => setQuantidade((q) => q + 1)} />
          </View>
        </Field>

        <View
          style={[
            styles.previewBox,
            { backgroundColor: theme.cardDeep, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.previewLabel, { color: theme.textMuted }]}>
            Subtotal
          </Text>
          <Text style={[styles.previewValue, { color: theme.text }]}>
            {formatBRL(subtotal)}
          </Text>
        </View>
      </View>

      <ActionBar
        buttons={[
          {
            label: "Cancelar",
            icon: "close",
            variant: "ghost",
            onPress: () => router.back(),
          },
          {
            label: "Adicionar",
            icon: "checkmark",
            variant: "primary",
            onPress: handleSave,
            disabled: !podeSalvar || saving,
          },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function QtyPad({
  icon,
  onPress,
}: {
  icon: "add" | "remove";
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.qtyPad,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={palette.accentLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 16 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "600",
    marginLeft: 4,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  prefix: { fontSize: 16, fontWeight: "700" },
  priceInput: { flex: 1, fontSize: 18, fontWeight: "700" },
  suggestionBox: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 180,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  suggestionText: { fontSize: 14 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 8,
  },
  qtyPad: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: { fontSize: 28, fontWeight: "800", minWidth: 40, textAlign: "center" },
  previewBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: { fontSize: 11, letterSpacing: 1, fontWeight: "600" },
  previewValue: { fontSize: 20, fontWeight: "800" },
});
