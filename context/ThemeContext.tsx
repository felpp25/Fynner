/**
 * ThemeContext — gerencia o tema (dark/light) globalmente.
 *
 * Comportamento:
 * - Tenta carregar a preferência salva no AsyncStorage.
 * - Se não houver preferência salva, usa o tema do sistema (Appearance).
 * - Se o sistema não informar, cai no padrão: 'dark'.
 * - Ao chamar toggleTheme(), salva a nova escolha no AsyncStorage.
 *
 * Importante: enquanto a preferência ainda não carregou, expomos `isReady`
 * como false. O RootLayout usa isso para evitar um "flash" da cor errada.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";

import { themes, type Theme, type ThemeMode } from "@/constants/Colors";

const STORAGE_KEY = "@fynner/theme-mode";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isReady: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

function getSystemMode(): ThemeMode {
  const scheme = Appearance.getColorScheme();
  // Padrão do app é dark caso o sistema não informe.
  return scheme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getSystemMode);
  const [isReady, setIsReady] = useState(false);

  // Carrega a preferência salva (uma vez no mount).
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!isMounted) return;
        if (saved === "dark" || saved === "light") {
          setModeState(saved);
        }
      })
      .catch(() => {
        // Falha silenciosa — mantemos o tema do sistema/padrão.
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Persistir falhou — não bloqueia a UI, só fica em memória.
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: themes[mode],
      toggleTheme,
      setMode,
      isReady,
    }),
    [mode, toggleTheme, setMode, isReady]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
