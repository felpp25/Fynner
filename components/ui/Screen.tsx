/**
 * Wrapper padrão de telas.
 * - Aplica background do tema.
 * - Respeita safe areas no topo (status bar/notch).
 * - A safe area de baixo NÃO é aplicada porque a tab bar já ocupa esse espaço.
 */
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";

interface ScreenProps {
  children: ReactNode;
  /** Se true (padrão), aplica padding horizontal e vertical. */
  padded?: boolean;
}

export function Screen({ children, padded = true }: ScreenProps) {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.root, { backgroundColor: theme.background }]}
    >
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 16, paddingTop: 8 },
});
