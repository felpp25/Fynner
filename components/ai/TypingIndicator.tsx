/**
 * Indicador "digitando..." enquanto a IA processa.
 *
 * 3 dots oscilando em opacity, com delays escalonados pra parecer um
 * pulso contínuo. Cleanup no unmount para evitar Animated.loop órfã
 * (ManadaAnimated continua rodando se não for stop'd).
 */
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

export function TypingIndicator() {
  const { theme } = useTheme();
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.5)).current;
  const dot3 = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const animations = [animate(dot1, 0), animate(dot2, 150), animate(dot3, 300)];
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dot1, dot2, dot3]);

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: theme.card,
        borderWidth: 0.5,
        borderColor: theme.accentBorder,
        borderRadius: 14,
        borderBottomLeftRadius: 4,
        paddingVertical: 11,
        paddingHorizontal: 14,
        flexDirection: "row",
        gap: 4,
      }}
    >
      {[dot1, dot2, dot3].map((dot, idx) => (
        <Animated.View
          key={idx}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.accentLight,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}
