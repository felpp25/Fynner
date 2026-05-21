/**
 * Root layout do Expo Router.
 *
 * Responsabilidades:
 * - Importar o CSS global do NativeWind (sempre PRIMEIRO).
 * - Carregar fontes via expo-font.
 * - Envolver a árvore com ThemeProvider e CartProvider.
 * - Configurar o Stack principal com a (tabs) e a tela settings.
 * - Pintar a status bar de acordo com o tema ativo.
 */
import "@/global.css";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";

import { palette } from "@/constants/Colors";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useDatabase } from "@/hooks/useDatabase";
import { useTheme } from "@/hooks/useTheme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CartProvider>
          <ThemedStack />
        </CartProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Stack interno — separado para poder consumir o tema e inicializar o DB.
 * O ThemeProvider precisa estar acima na árvore.
 *
 * Enquanto o banco não está pronto, mostramos um spinner. Se der erro,
 * mostramos uma mensagem (sem nav). Esse caminho de erro só dispara em
 * casos catastróficos (disco cheio, permissão negada) — o app não fica
 * inutilizável silenciosamente.
 */
function ThemedStack() {
  const { theme, mode } = useTheme();
  const { ready, error } = useDatabase();

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>
          Não foi possível iniciar o banco de dados
        </Text>
        <Text style={[styles.errorMsg, { color: theme.textMuted }]}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerTitleStyle: { color: theme.text },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            title: "Configurações",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="modals/market-select"
          options={{
            title: "Mercado",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="modals/add-item"
          options={{
            title: "Adicionar item",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="modals/item-detail"
          options={{
            title: "Detalhes do produto",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="modals/session-detail"
          options={{
            // Card (push lateral) ao invés de modal — combina mais com
            // drill-down a partir do histórico, e o header nativo já dá
            // botão "voltar".
            title: "Detalhe da compra",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="modals/list-detail"
          options={{
            title: "Lista",
            presentation: "card",
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  errorMsg: { fontSize: 13, textAlign: "center" },
});
