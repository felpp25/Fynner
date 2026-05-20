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
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";

import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
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
 * Stack interno — separado para poder consumir o tema.
 * O ThemeProvider precisa estar acima na árvore.
 */
function ThemedStack() {
  const { theme, mode } = useTheme();

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
      </Stack>
    </View>
  );
}
