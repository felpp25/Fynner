/**
 * Tela Scan (Stage 6) — câmera + captura + resultado editável.
 *
 * Status: UI funcional em Expo Go. O reconhecimento de texto (OCR) está
 * stub em `services/ocr.ts`; quando o ML Kit nativo for integrado, basta
 * preencher aquela função e os campos abaixo são auto-populados. Hoje, o
 * usuário tira a foto como referência e digita nome/preço manualmente.
 *
 * Fluxos:
 *  - Permissão pendente → tela explicativa + botão "Permitir"
 *  - Câmera ativa      → viewfinder com moldura + botão captura + atalho manual
 *  - Foto capturada    → preview pequeno + form (nome, preço) + 2 ações
 */
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type CameraView as CameraViewType,
} from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionBar } from "@/components/ui/ActionBar";
import { palette } from "@/constants/Colors";
import { useTheme } from "@/hooks/useTheme";
import {
  OCR_AVAILABLE,
  recognizeText,
  type OcrResult,
} from "@/services/ocr";
import { formatBRL, maskBRLInput, parseBRL } from "@/utils/currency";

export default function ScanScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewType | null>(null);

  // Estado do fluxo
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [nome, setNome] = useState("");
  const [precoInput, setPrecoInput] = useState("");

  const preco = parseBRL(precoInput);
  const precoValido = !Number.isNaN(preco) && preco > 0;
  const podeAdicionar = nome.trim().length > 0 && precoValido;

  async function handleCapture() {
    if (!cameraRef.current) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        // base64 só seria útil pra OCR em web; em mobile passamos URI direto
      });
      if (!photo?.uri) {
        setProcessing(false);
        return;
      }
      setPhotoUri(photo.uri);
      // Tenta OCR (stub por enquanto — vai retornar vazio)
      const result: OcrResult = await recognizeText(photo.uri);
      if (result.nome) setNome(result.nome);
      if (result.preco !== null) {
        // Recompõe a máscara a partir do número
        const centavos = Math.round(result.preco * 100).toString();
        setPrecoInput(maskBRLInput(centavos));
      }
    } catch (err) {
      console.error("[scan] falha ao capturar:", err);
    } finally {
      setProcessing(false);
    }
  }

  function handleRetake() {
    setPhotoUri(null);
    setNome("");
    setPrecoInput("");
  }

  function handleAddManually() {
    // Atalho: abre o modal de adicionar item sem capturar nada
    router.push("/modals/add-item");
  }

  function handleConfirm() {
    if (!podeAdicionar) return;
    // Envia centavos como string (formato esperado pelo add-item)
    const centavos = Math.round(preco * 100).toString();
    router.push({
      pathname: "/modals/add-item",
      params: { nome: nome.trim(), preco: centavos },
    });
    // Limpa pra próxima captura
    handleRetake();
  }

  // === 1. Permissão pendente / negada ============================================
  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          paddingTop: insets.top,
        }}
      >
        <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: theme.text,
              letterSpacing: -0.3,
            }}
          >
            Scan
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            gap: 14,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.accentBg,
              borderWidth: 0.5,
              borderColor: theme.accentBorder,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="camera-outline"
              size={32}
              color={palette.accentLight}
            />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.text,
              textAlign: "center",
            }}
          >
            Permitir acesso à câmera
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: theme.textMuted,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            O Fynner usa a câmera para escanear etiquetas de preço e adicionar
            produtos rapidamente ao seu carrinho.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{
              backgroundColor: palette.accent,
              borderRadius: 12,
              paddingVertical: 11,
              paddingHorizontal: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
              Permitir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddManually}
            style={{ paddingVertical: 8 }}
          >
            <Text
              style={{
                fontSize: 12,
                color: theme.accentLight,
                fontWeight: "500",
              }}
            >
              Ou inserir manualmente →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // === 2. Foto capturada — tela de resultado =====================================
  if (photoUri) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ paddingTop: insets.top }}>
          <View
            style={{
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
              Confira o produto
            </Text>
            {!OCR_AVAILABLE ? (
              <Text
                style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  marginTop: 4,
                }}
              >
                Digite os dados manualmente. O OCR automático chega quando o
                app for compilado nativamente.
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 14, gap: 14 }}>
          {/* Preview da foto com botão de descartar no canto */}
          <View
            style={{
              alignSelf: "center",
              width: 160,
              height: 120,
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: theme.accentBorder,
              // Sem overflow:hidden no wrapper pra deixar o X "vazar" os
              // cantos do preview e ficar mais fácil de tocar.
            }}
          >
            <Image
              source={{ uri: photoUri }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
              }}
            />
            <TouchableOpacity
              onPress={handleRetake}
              accessibilityLabel="Descartar foto"
              hitSlop={8}
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.6)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Campo nome */}
          <View>
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              Nome do produto
            </Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Arroz Camil 5kg"
              placeholderTextColor={theme.textHint}
              autoFocus={!OCR_AVAILABLE}
              style={{
                backgroundColor: theme.card,
                borderWidth: 0.5,
                borderColor:
                  nome.length > 0
                    ? "rgba(162, 3, 255, 0.6)"
                    : theme.accentBorder,
                borderRadius: 11,
                padding: 11,
                paddingHorizontal: 13,
                fontSize: 14,
                color: theme.text,
              }}
            />
          </View>

          {/* Campo preço */}
          <View>
            <Text
              style={{
                fontSize: 9,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 6,
              }}
            >
              Preço
            </Text>
            <View
              style={{
                backgroundColor: theme.card,
                borderWidth: 0.5,
                borderColor:
                  precoValido ? "rgba(162, 3, 255, 0.6)" : theme.accentBorder,
                borderRadius: 11,
                paddingHorizontal: 13,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: palette.accentLight,
                }}
              >
                R$
              </Text>
              <TextInput
                value={precoInput}
                onChangeText={(t) => setPrecoInput(maskBRLInput(t))}
                placeholder="0,00"
                placeholderTextColor={theme.textHint}
                keyboardType="number-pad"
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.text,
                }}
              />
            </View>
          </View>

          {/* Preview subtotal (uma unidade) */}
          {precoValido ? (
            <Text
              style={{
                fontSize: 11,
                color: theme.textMuted,
                textAlign: "center",
              }}
            >
              {formatBRL(preco)} · ajuste a quantidade no próximo passo
            </Text>
          ) : null}
        </View>

        <ActionBar
          buttons={[
            {
              label: "Nova foto",
              icon: "camera-reverse-outline",
              variant: "ghost",
              onPress: handleRetake,
            },
            {
              label: "Adicionar",
              icon: "checkmark",
              variant: "primary",
              onPress: handleConfirm,
              disabled: !podeAdicionar,
            },
          ]}
        />
      </KeyboardAvoidingView>
    );
  }

  // === 3. Câmera ativa ===========================================================
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        // O CameraView preenche a tela inteira; UI fica overlay por cima.
      />

      {/* Overlay superior: título sobre fundo translúcido */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + 6,
          paddingHorizontal: 14,
          paddingBottom: 10,
          backgroundColor: "rgba(0, 0, 0, 0.35)",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: "#fff",
            letterSpacing: -0.3,
          }}
        >
          Scan
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.7)",
            marginTop: 2,
          }}
        >
          Enquadre a etiqueta e toque para capturar
        </Text>
      </View>

      {/* Moldura do viewfinder no centro */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 260,
            height: 160,
            borderColor: palette.accent,
            borderWidth: 2,
            borderRadius: 14,
            backgroundColor: "transparent",
          }}
        />
      </View>

      {/* Spinner enquanto processa */}
      {processing ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={{ color: "#fff", fontSize: 12 }}>Processando…</Text>
        </View>
      ) : null}

      {/* Controles inferiores */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 14,
          paddingBottom: 24,
          paddingHorizontal: 24,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Espaço fantasma à esquerda pra centralizar o botão de captura */}
        <TouchableOpacity onPress={handleAddManually} style={{ width: 64 }}>
          <Text
            style={{
              fontSize: 11,
              color: "#fff",
              fontWeight: "500",
              textAlign: "left",
            }}
          >
            Inserir{"\n"}manualmente
          </Text>
        </TouchableOpacity>

        {/* Botão de captura circular */}
        <TouchableOpacity
          onPress={handleCapture}
          disabled={processing}
          accessibilityLabel="Capturar"
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "#fff",
            justifyContent: "center",
            alignItems: "center",
            opacity: processing ? 0.5 : 1,
          }}
        >
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: palette.accent,
            }}
          />
        </TouchableOpacity>

        {/* Espaço à direita pra simetria */}
        <View style={{ width: 64 }} />
      </View>
    </View>
  );
}
