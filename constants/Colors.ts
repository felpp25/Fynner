/**
 * Sistema de cores do Fynner.
 *
 * - `palette` contém as cores brutas da marca (roxo accent e derivados).
 * - `darkTheme` e `lightTheme` definem as cores semânticas usadas pelas telas
 *   (background, surface, card, text, etc.) e herdam a paleta.
 *
 * Usado via `useTheme()` (ver hooks/useTheme.ts).
 */

export const palette = {
  accent: "#a203ff", // roxo primário — botões, destaques
  accentLight: "#d6a5fa", // lavanda — textos secundários, badges
  accentMid: "rgba(162, 3, 255, 0.25)", // fundo de ícones
  accentBg: "rgba(162, 3, 255, 0.12)", // fundo sutil
  accentBorder: "rgba(162, 3, 255, 0.22)", // bordas
  black: "#000000",
  white: "#ffffff",
} as const;

export type ThemeMode = "dark" | "light";

// Tipo explícito para que dark e light sejam estruturalmente compatíveis
// (sem `as const` para não travar nos valores literais de cada tema).
export interface Theme {
  background: string;
  surface: string;
  card: string;
  cardDeep: string;
  text: string;
  textMuted: string;
  textHint: string;
  border: string;
  accent: string;
  accentLight: string;
  accentMid: string;
  accentBg: string;
  accentBorder: string;
  black: string;
  white: string;
}

export const darkTheme: Theme = {
  background: "#000000", // fundo principal
  surface: "#0d0015", // nav bar, cards de destaque
  card: "#1a0229", // fundo de cards
  cardDeep: "#220133", // cards internos
  text: "#ffffff",
  textMuted: "rgba(214, 165, 250, 0.55)",
  textHint: "rgba(255, 255, 255, 0.30)",
  border: "rgba(162, 3, 255, 0.22)",
  ...palette,
};

export const lightTheme: Theme = {
  background: "#ffffff",
  surface: "#f5f0ff", // superfície levemente roxa
  card: "#faf5ff",
  cardDeep: "#f0e6ff",
  text: "#1a0229", // roxo escuro como texto
  textMuted: "rgba(100, 20, 140, 0.55)",
  textHint: "rgba(100, 20, 140, 0.35)",
  border: "rgba(162, 3, 255, 0.20)",
  ...palette,
};

export const themes: Record<ThemeMode, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};
