/**
 * Overlay de gravação de voz (Sub-stage 8c).
 *
 * Aparece sobre a tela enquanto o usuário fala com a IA. O mic central
 * pulsa via `Animated.Value` (native driver, escala 1↔1.1). Tocar no mic
 * pulsante chama `onStop` (encerra + envia). O botão "Cancelar" chama
 * `onCancel` (descarta sem enviar).
 *
 * Decisão de design: descartamos o glow JS-driven (shadowOpacity animado)
 * do mockup inicial — pulse via scale já é forte visualmente e mantém a
 * animação 100% no native driver (zero overhead na thread JS).
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

interface VoiceOverlayProps {
  visible: boolean;
  transcript: string;
  onCancel: () => void;
  onStop: () => void;
}

export function VoiceOverlay({
  visible,
  transcript,
  onCancel,
  onStop,
}: VoiceOverlayProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          justifyContent: "center",
          alignItems: "center",
          padding: 30,
          gap: 14,
        }}
      >
        {/* Mic grande pulsante — tap para parar e enviar */}
        <Pressable
          onPress={onStop}
          accessibilityLabel="Parar gravação e enviar"
          hitSlop={20}
        >
          <Animated.View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.accent,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale }],
            }}
          >
            <Ionicons name="mic" size={38} color="#fff" />
          </Animated.View>
        </Pressable>

        <Text style={{ fontSize: 13, color: theme.text, fontWeight: "500" }}>
          Ouvindo...
        </Text>

        {/* Transcrição em tempo real — itálico quando vazia (placeholder) */}
        <Text
          style={{
            fontSize: 14,
            color: transcript ? theme.text : theme.textMuted,
            textAlign: "center",
            maxWidth: 280,
            lineHeight: 20,
            fontStyle: transcript ? "normal" : "italic",
          }}
        >
          {transcript || "Comece a falar..."}
        </Text>

        <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 8 }}>
          Toque no mic para enviar
        </Text>

        <TouchableOpacity
          onPress={onCancel}
          accessibilityLabel="Cancelar gravação"
          style={{
            marginTop: 8,
            paddingVertical: 8,
            paddingHorizontal: 18,
            backgroundColor: theme.card,
            borderWidth: 0.5,
            borderColor: theme.accentBorder,
            borderRadius: 18,
          }}
        >
          <Text style={{ fontSize: 11, color: theme.accentLight }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
