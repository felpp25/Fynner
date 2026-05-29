/**
 * Tela Fynner IA (Sub-stage 8b + 8c).
 *
 * Chat com persistência em SQLite (tabela ai_messages, migration 004).
 * Integra com OpenAI GPT-4o-mini via tool calling — ver services/ai.ts.
 * Reconhecimento de voz via expo-speech-recognition — ver services/voice.ts.
 *
 * Layout:
 *   - Header: avatar + nome + status (verde=pronto, amarelo=pensando, roxo=ouvindo) + botão limpar
 *   - Chips horizontais (perguntas pré-prontas)
 *   - Body: FlatList de bubbles OU empty state
 *   - Footer: input + mic (tap-tap pra gravar) + send
 *   - Overlay de gravação sobreposto quando isListening
 */
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ai/ChatBubble";
import { QuickPromptChip } from "@/components/ai/QuickPromptChip";
import { TypingIndicator } from "@/components/ai/TypingIndicator";
import { VoiceOverlay } from "@/components/ai/VoiceOverlay";
import {
  addMessage,
  clearAllMessages,
  getAllMessages,
  getRecentMessages,
} from "@/database/queries/ai";
import { useTheme } from "@/hooks/useTheme";
import { useVoice } from "@/hooks/useVoice";
import { AI_AVAILABLE, askAI } from "@/services/ai";
import { VOICE_AVAILABLE } from "@/services/voice";
import type { AIMessage } from "@/types";

interface QuickPrompt {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  question: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    icon: "cash-outline",
    label: "Gasto deste mês",
    question: "Quanto gastei este mês?",
  },
  {
    icon: "trophy-outline",
    label: "Mercado mais barato",
    question: "Qual mercado é o mais barato para mim?",
  },
  {
    icon: "trending-up-outline",
    label: "Produtos que mais subiram",
    question: "Quais produtos tiveram maior alta de preço?",
  },
  {
    icon: "time-outline",
    label: "Última compra",
    question: "Conte sobre minha última compra",
  },
];

const SUCCESS_GREEN = "rgba(80, 220, 100, 0.85)";
const PROCESSING_YELLOW = "#fbbf24";
const DANGER_PINK = "#ff6b9d";

export default function AiScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<AIMessage>>(null);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    isListening,
    transcript: voiceTranscript,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
    cancel: cancelVoice,
  } = useVoice();

  // useFocusEffect recarrega ao voltar pra aba — usuário pode ter limpado
  // a conversa em outro lugar (improvável hoje, mas baixo custo de mantê-lo).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const all = await getAllMessages();
          if (!cancelled) setMessages(all);
        } catch (err) {
          console.error("[ai] falha ao carregar mensagens:", err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  // Auto-scroll quando nova mensagem chega OU typing indicator aparece.
  // Pequeno setTimeout dá tempo do FlatList medir o conteúdo novo antes
  // do scrollToEnd — sem ele, o scroll cai num offset errado.
  useEffect(() => {
    if (messages.length === 0 && !isProcessing) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(t);
  }, [messages.length, isProcessing]);

  // Auto-envio quando a gravação de voz termina com texto válido.
  // wasListeningRef captura o valor anterior de isListening — quando ele
  // transiciona de true → false e existe transcript, envia automaticamente.
  // O `cancel()` do hook zera o transcript antes de setar isListening=false,
  // então cancel correto NÃO dispara o envio.
  const wasListeningRef = useRef(false);
  useEffect(() => {
    if (
      wasListeningRef.current &&
      !isListening &&
      voiceTranscript.trim().length > 0
    ) {
      handleSend(voiceTranscript);
    }
    wasListeningRef.current = isListening;
    // handleSend e voiceTranscript fora das deps de propósito — só queremos
    // disparar na transição de isListening (callback usa o transcript capturado
    // no momento exato da transição).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  async function handleSend(textOverride?: string) {
    const userText = (textOverride ?? input).trim();
    if (!userText || isProcessing) return;

    setInput("");
    setIsProcessing(true);

    try {
      await addMessage("user", userText);
      const updatedMessages = await getAllMessages();
      setMessages(updatedMessages);

      // getRecentMessages retorna em ordem cronológica. A última é a pergunta
      // que acabamos de gravar — askAI prepende ela como `user` separadamente,
      // então cortamos pra não duplicar.
      const recent = await getRecentMessages(6);
      const history = recent.slice(0, -1);

      const aiResponse = await askAI(userText, history);

      await addMessage("assistant", aiResponse);
      const finalMessages = await getAllMessages();
      setMessages(finalMessages);
    } catch (err) {
      console.error("[ai] falha ao processar:", err);
      await addMessage(
        "assistant",
        "Desculpe, tive um problema ao processar sua pergunta. Tente novamente."
      );
      const errMessages = await getAllMessages();
      setMessages(errMessages);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleClearConversation() {
    await clearAllMessages();
    setMessages([]);
  }

  const canSend = input.trim().length > 0 && !isProcessing;
  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Topo: safe area + header + chips */}
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
            paddingTop: 8,
            paddingBottom: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: theme.accentBorder,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.accent,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="sparkles" size={17} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>
              Fynner IA
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 1,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: voiceError
                    ? DANGER_PINK
                    : isListening
                      ? theme.accent
                      : isProcessing
                        ? PROCESSING_YELLOW
                        : SUCCESS_GREEN,
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: voiceError ? DANGER_PINK : theme.textMuted,
                }}
                numberOfLines={1}
              >
                {voiceError
                  ? voiceError
                  : isListening
                    ? "Ouvindo..."
                    : isProcessing
                      ? "Pensando..."
                      : "Pronto para responder"}
              </Text>
            </View>
          </View>

          {messages.length > 0 && !isProcessing && (
            <TouchableOpacity
              onPress={handleClearConversation}
              accessibilityLabel="Limpar conversa"
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                backgroundColor: theme.card,
                borderWidth: 0.5,
                borderColor: theme.accentBorder,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="refresh" size={14} color={theme.accentLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
          style={{
            borderBottomWidth: 0.5,
            borderBottomColor: theme.accentBorder,
          }}
        >
          {QUICK_PROMPTS.map((p) => (
            <QuickPromptChip
              key={p.label}
              icon={p.icon}
              label={p.label}
              onPress={() => handleSend(p.question)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Corpo: empty state ou lista */}
      {isEmpty && !loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.accentMid,
              borderWidth: 0.5,
              borderColor: theme.accentBorder,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="sparkles" size={30} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.text,
              textAlign: "center",
            }}
          >
            Pergunte qualquer coisa
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: theme.textMuted,
              textAlign: "center",
              lineHeight: 17,
              maxWidth: 220,
            }}
          >
            Eu analiso suas compras, histórico e listas para te ajudar a
            economizar e entender seus padrões.
          </Text>
          {!AI_AVAILABLE && (
            <View
              style={{
                marginTop: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: "rgba(255, 107, 157, 0.10)",
                borderWidth: 0.5,
                borderColor: "rgba(255, 107, 157, 0.30)",
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 10.5,
                  color: DANGER_PINK,
                  textAlign: "center",
                  lineHeight: 16,
                }}
              >
                IA não configurada. Adicione EXPO_PUBLIC_OPENAI_API_KEY no
                arquivo .env e reinicie o app.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 14, gap: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ChatBubble role={item.role} content={item.content} />
          )}
          ListFooterComponent={isProcessing ? <TypingIndicator /> : null}
        />
      )}

      {/* Footer: input + mic (stub) + send */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          padding: 12,
          paddingBottom: Platform.OS === "ios" ? 16 : 12,
          borderTopWidth: 0.5,
          borderTopColor: theme.accentBorder,
          backgroundColor: theme.surface,
        }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 36,
            maxHeight: 100,
            backgroundColor: theme.card,
            borderWidth: 0.5,
            borderColor:
              input.length > 0 ? "rgba(162, 3, 255, 0.6)" : theme.accentBorder,
            borderRadius: 18,
            paddingHorizontal: 14,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte algo..."
            placeholderTextColor={theme.textHint}
            multiline
            editable={!isProcessing}
            style={{
              fontSize: 12,
              color: theme.text,
              maxHeight: 80,
              paddingVertical: 9,
            }}
          />
        </View>

        {/* Mic — tap pra começar a gravar. Overlay assume a partir daí. */}
        <TouchableOpacity
          onPress={() => {
            if (isListening) {
              stopVoice();
            } else {
              startVoice();
            }
          }}
          disabled={isProcessing || !VOICE_AVAILABLE}
          accessibilityLabel={
            isListening ? "Parar gravação" : "Gravar pergunta por voz"
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isListening ? theme.accent : theme.card,
            borderWidth: 0.5,
            borderColor: isListening ? theme.accent : theme.accentBorder,
            justifyContent: "center",
            alignItems: "center",
            opacity: isProcessing || !VOICE_AVAILABLE ? 0.4 : 1,
          }}
        >
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={16}
            color={isListening ? "#fff" : theme.accentLight}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!canSend}
          accessibilityLabel="Enviar mensagem"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.accent,
            justifyContent: "center",
            alignItems: "center",
            opacity: canSend ? 1 : 0.3,
          }}
        >
          <Ionicons name="arrow-up" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <VoiceOverlay
        visible={isListening}
        transcript={voiceTranscript}
        onCancel={cancelVoice}
        onStop={stopVoice}
      />
    </KeyboardAvoidingView>
  );
}
