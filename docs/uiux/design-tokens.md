# Design Tokens — Fynner

## Paleta de cores

```typescript
// constants/Colors.ts

export const palette = {
  accent: "#a203ff",
  accentLight: "#d6a5fa",
  accentMid: "rgba(162, 3, 255, 0.22)",
  accentBg: "rgba(162, 3, 255, 0.10)",
  accentBorder: "rgba(162, 3, 255, 0.22)",
  deleteBg: "#1a0010",
  deleteFg: "#ff6b9d",
  black: "#000000",
  white: "#ffffff",
};

export const darkTheme = {
  background: "#000000",
  surface: "#0d0015",
  card: "#1a0229",
  cardDeep: "#220133",
  text: "#ffffff",
  textMuted: "rgba(214, 165, 250, 0.55)",
  textHint: "rgba(255, 255, 255, 0.30)",
  border: "rgba(162, 3, 255, 0.22)",
  ...palette,
};

export const lightTheme = {
  background: "#ffffff",
  surface: "#f5f0ff",
  card: "#faf5ff",
  cardDeep: "#f0e6ff",
  text: "#1a0229",
  textMuted: "rgba(100, 20, 140, 0.55)",
  textHint: "rgba(100, 20, 140, 0.35)",
  border: "rgba(162, 3, 255, 0.20)",
  ...palette,
};
```

## Espaçamento e dimensões

```typescript
// constants/Layout.ts

export const Layout = {
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 14, // cards e botões padrão
    xl: 18, // cards maiores
    xxl: 22, // hero cards
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    xxl: 24,
  },
  iconBox: {
    sm: { box: 28, icon: 14, radius: 7 },
    md: { box: 36, icon: 17, radius: 9 },
    lg: { box: 44, icon: 22, radius: 11 },
  },
  row: {
    minHeight: 62, // altura mínima de qualquer linha tocável
    paddingH: 13, // padding horizontal de cards
    paddingV: 11, // padding vertical de cards
    gap: 11, // gap entre elementos de uma linha
  },
  bottomBar: {
    paddingH: 14,
    paddingV: 10,
    buttonGap: 8,
    buttonRadius: 12,
    buttonPaddingV: 11,
  },
  screen: {
    paddingH: 14,
    paddingBottom: 90, // espaço para tab bar não cobrir conteúdo
  },
};
```

## Tipografia

```typescript
export const Typography = {
  // Tamanhos
  heroValue: { fontSize: 36, fontWeight: "600", letterSpacing: -1 },
  heroLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  screenTitle: { fontSize: 24, fontWeight: "600", letterSpacing: -0.4 },
  cardTitle: { fontSize: 14, fontWeight: "500" },
  cardSubtitle: { fontSize: 11 },
  itemName: { fontSize: 13, fontWeight: "500" },
  itemSub: { fontSize: 11 },
  buttonPrimary: { fontSize: 12, fontWeight: "600" },
  buttonGhost: { fontSize: 12, fontWeight: "500" },
  tag: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1.1 },
};
```

## Cores de mercados disponíveis

```typescript
// Paleta de cores que o usuário pode escolher para identificar mercados
export const MARKET_COLORS = [
  "#a203ff", // roxo  (padrão Fynner)
  "#e63946", // vermelho
  "#457b9d", // azul
  "#f4a261", // laranja
  "#2ec4b6", // teal
  "#f9c74f", // amarelo
  "#4ecdc4", // ciano
  "#e76f51", // terracota
];
```
