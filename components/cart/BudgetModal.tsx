/**
 * Modal inline para editar o orçamento da sessão atual.
 *
 * Usei <Modal> nativo do RN ao invés de criar uma rota dedicada porque
 * é uma interação curta (um input + dois botões) e não compensa o overhead
 * de uma tela inteira.
 */
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import { formatBRL, maskBRLInput, parseBRL } from "@/utils/currency";

interface BudgetModalProps {
  visible: boolean;
  currentValue: number;
  onClose: () => void;
  onSave: (orcamento: number) => Promise<void> | void;
}

export function BudgetModal({
  visible,
  currentValue,
  onClose,
  onSave,
}: BudgetModalProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Resetar valor ao abrir.
  useEffect(() => {
    if (visible) {
      setValue(currentValue > 0 ? currentValue.toFixed(2).replace(".", ",") : "");
    }
  }, [visible, currentValue]);

  const parsed = parseBRL(value);
  const valid = !Number.isNaN(parsed) && parsed >= 0;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave(parsed);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.centerWrap}
        >
          <Pressable
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => {
              // bloqueia o press do backdrop ao tocar dentro do card.
            }}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              Definir orçamento
            </Text>
            <Text style={[styles.help, { color: theme.textMuted }]}>
              Quanto você quer gastar nesta compra?
            </Text>

            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.cardDeep,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.prefix, { color: palette.accentLight }]}>
                R$
              </Text>
              <TextInput
                value={value}
                onChangeText={(t) => setValue(maskBRLInput(t))}
                keyboardType="number-pad"
                placeholder="0,00"
                placeholderTextColor={theme.textHint}
                style={[styles.input, { color: theme.text }]}
                autoFocus
              />
            </View>

            {valid && parsed > 0 ? (
              <Text style={[styles.preview, { color: theme.textMuted }]}>
                Limite: {formatBRL(parsed)}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button label="Cancelar" variant="ghost" onPress={onClose} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Salvar"
                  onPress={handleSave}
                  disabled={!valid}
                  loading={saving}
                  fullWidth
                />
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700" },
  help: { fontSize: 13 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  prefix: { fontSize: 16, fontWeight: "700" },
  input: { flex: 1, fontSize: 20, fontWeight: "700" },
  preview: { fontSize: 12, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
});
