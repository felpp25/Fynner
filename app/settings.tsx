/**
 * Tela de Configurações.
 *
 * Construída sobre os componentes base do design system:
 * `SectionHeader` para rótulos de seção e `ListRow` para cada item.
 *
 * Stage 7: seção "Dados" com export/import CSV. Ambos os fluxos usam
 * `services/csv.ts`. O import abre um modal de preview antes de tocar
 * no banco, e mostra o resultado (importado/pulado/erros) no mesmo modal.
 */
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import {
  exportToCSV,
  importFromCSV,
  pickCsvFile,
  previewCsvFile,
  type ImportResult,
} from "@/services/csv";

type ImportPhase =
  | { phase: "idle" }
  | {
      phase: "preview";
      fileName: string;
      fileUri: string;
      totalRows: number;
    }
  | { phase: "importing" }
  | { phase: "result"; result: ImportResult };

export default function SettingsScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const isDark = mode === "dark";
  const appVersion = Constants.expoConfig?.version ?? "0.1.0";

  const [exporting, setExporting] = useState(false);
  const [importState, setImportState] = useState<ImportPhase>({ phase: "idle" });

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const { rowCount, shared } = await exportToCSV();
      if (!shared) {
        Alert.alert(
          "Backup gerado",
          `${rowCount} ${rowCount === 1 ? "item" : "itens"} exportados. ` +
            `Compartilhamento não disponível nesta plataforma — arquivo salvo localmente.`
        );
      } else if (rowCount === 0) {
        Alert.alert(
          "Backup vazio",
          "Você ainda não tem compras finalizadas pra exportar."
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Erro ao exportar", msg);
    } finally {
      setExporting(false);
    }
  }

  async function handlePickImport() {
    if (importState.phase !== "idle") return;
    try {
      const picked = await pickCsvFile();
      if (!picked) return; // usuário cancelou
      const { totalRows } = await previewCsvFile(picked.uri);
      setImportState({
        phase: "preview",
        fileName: picked.name,
        fileUri: picked.uri,
        totalRows,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Erro ao ler CSV", msg);
    }
  }

  async function handleConfirmImport() {
    if (importState.phase !== "preview") return;
    const uri = importState.fileUri;
    setImportState({ phase: "importing" });
    try {
      const result = await importFromCSV(uri);
      setImportState({ phase: "result", result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportState({
        phase: "result",
        result: { imported: 0, skipped: 0, errors: [msg] },
      });
    }
  }

  function handleCloseModal() {
    setImportState({ phase: "idle" });
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: 14 }}
      >
        <SectionHeader>Aparência</SectionHeader>

        <ListRow
          icon={isDark ? "moon" : "sunny"}
          title="Tema"
          subtitle={isDark ? "Escuro" : "Claro"}
          rightContent={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.accentBorder, true: theme.accent }}
              thumbColor={theme.text}
            />
          }
        />

        <SectionHeader marginTop={20}>Dados</SectionHeader>

        <ListRow
          icon="download-outline"
          title="Exportar histórico (CSV)"
          subtitle={
            exporting
              ? "Gerando arquivo…"
              : "Baixe seus dados para abrir em planilha ou backup"
          }
          showArrow={!exporting}
          rightContent={
            exporting ? (
              <ActivityIndicator size="small" color={palette.accent} />
            ) : undefined
          }
          onPress={exporting ? undefined : handleExport}
        />

        <ListRow
          icon="cloud-upload-outline"
          title="Importar backup (CSV)"
          subtitle="Restaure dados de uma exportação anterior"
          showArrow
          onPress={
            importState.phase === "idle" ? handlePickImport : undefined
          }
        />

        <SectionHeader marginTop={20}>Sobre</SectionHeader>

        <ListRow
          icon="information-circle"
          title="Fynner"
          subtitle={`Versão ${appVersion}`}
        />
      </ScrollView>

      <ImportModal
        state={importState}
        onConfirm={handleConfirmImport}
        onClose={handleCloseModal}
      />
    </>
  );
}

/**
 * Modal de import — três fases num só componente:
 *   preview  → mostra contagem e botões Cancelar/Importar
 *   importing → spinner cobrindo tudo
 *   result   → contagem de importados/pulados/erros + botão OK
 *
 * Idle fica invisível (Modal visible=false).
 */
function ImportModal({
  state,
  onConfirm,
  onClose,
}: {
  state: ImportPhase;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const visible = state.phase !== "idle";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={state.phase === "importing" ? undefined : onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: theme.surface,
            borderRadius: 18,
            borderWidth: 0.5,
            borderColor: theme.accentBorder,
            padding: 18,
          }}
        >
          {state.phase === "preview" ? (
            <PreviewBody
              fileName={state.fileName}
              totalRows={state.totalRows}
              onConfirm={onConfirm}
              onClose={onClose}
            />
          ) : null}

          {state.phase === "importing" ? (
            <View style={{ alignItems: "center", paddingVertical: 24, gap: 12 }}>
              <ActivityIndicator size="large" color={palette.accent} />
              <Text style={{ fontSize: 13, color: theme.text }}>
                Importando…
              </Text>
            </View>
          ) : null}

          {state.phase === "result" ? (
            <ResultBody result={state.result} onClose={onClose} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function PreviewBody({
  fileName,
  totalRows,
  onConfirm,
  onClose,
}: {
  fileName: string;
  totalRows: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.accentBg,
          borderWidth: 0.5,
          borderColor: theme.accentBorder,
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          marginBottom: 12,
        }}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={22}
          color={palette.accentLight}
        />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.text,
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        Importar {totalRows} {totalRows === 1 ? "linha" : "linhas"}?
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: theme.textMuted,
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 16,
        }}
        numberOfLines={2}
      >
        Arquivo: {fileName}
        {"\n"}Itens duplicados (mesma data + mercado + produto + preço) serão
        pulados automaticamente.
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={onClose}
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
          <Ionicons name="close" size={14} color={palette.accentLight} />
          <Text
            style={{
              color: palette.accentLight,
              fontSize: 12,
              fontWeight: "500",
            }}
          >
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={{
            flex: 1,
            backgroundColor: palette.accent,
            borderRadius: 12,
            paddingVertical: 11,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Ionicons name="checkmark" size={14} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            Importar
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function ResultBody({
  result,
  onClose,
}: {
  result: ImportResult;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const hasErrors = result.errors.length > 0;
  // Sucesso "puro" = importou algo e nada deu erro
  const success = result.imported > 0 && !hasErrors;
  const iconName = success
    ? "checkmark-circle-outline"
    : hasErrors
      ? "warning-outline"
      : "information-circle-outline";
  const iconColor = success
    ? "rgba(80, 220, 100, 0.85)"
    : hasErrors
      ? "#ff6b9d"
      : palette.accentLight;
  const iconBg = success
    ? "rgba(80, 220, 100, 0.12)"
    : hasErrors
      ? "rgba(255, 107, 157, 0.12)"
      : theme.accentBg;

  return (
    <>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: iconBg,
          borderWidth: 0.5,
          borderColor: theme.accentBorder,
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          marginBottom: 12,
        }}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.text,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        {success
          ? "Importação concluída"
          : hasErrors
            ? "Importação com avisos"
            : "Nada importado"}
      </Text>

      <View style={{ gap: 6, marginBottom: 14 }}>
        <CountLine
          label="Itens importados"
          value={result.imported}
          color={
            result.imported > 0 ? "rgba(80, 220, 100, 0.85)" : theme.textMuted
          }
        />
        <CountLine
          label="Itens pulados"
          value={result.skipped}
          color={theme.textMuted}
        />
        {hasErrors ? (
          <CountLine
            label="Erros"
            value={result.errors.length}
            color="#ff6b9d"
          />
        ) : null}
      </View>

      {hasErrors ? (
        <View
          style={{
            backgroundColor: theme.card,
            borderWidth: 0.5,
            borderColor: theme.accentBorder,
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
            maxHeight: 120,
          }}
        >
          <ScrollView>
            {result.errors.slice(0, 5).map((e, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  lineHeight: 14,
                }}
              >
                • {e}
              </Text>
            ))}
            {result.errors.length > 5 ? (
              <Text
                style={{
                  fontSize: 10,
                  color: theme.textHint,
                  fontStyle: "italic",
                  marginTop: 4,
                }}
              >
                ...e mais {result.errors.length - 5}
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onClose}
        style={{
          backgroundColor: palette.accent,
          borderRadius: 12,
          paddingVertical: 11,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Ionicons name="checkmark" size={14} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
          OK
        </Text>
      </TouchableOpacity>
    </>
  );
}

function CountLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 12, color: theme.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "600", color }}>{value}</Text>
    </View>
  );
}
