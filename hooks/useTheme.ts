import { useContext } from "react";

import { ThemeContext } from "@/context/ThemeContext";

/**
 * Hook para acessar o tema atual e funções de troca.
 * Lança erro se usado fora do ThemeProvider — isso previne bugs sutis.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme deve ser usado dentro de um <ThemeProvider>.");
  }
  return ctx;
}
