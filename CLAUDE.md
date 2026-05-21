# Fynner — Contexto para o Claude Code

> Este arquivo é carregado automaticamente pelo Claude Code ao abrir o projeto.
> Sintetiza o que importa pra você não precisar reler o histórico inteiro.

---

## 1. O que é o Fynner

App mobile (React Native + Expo) para o usuário acompanhar o total das compras
no supermercado em tempo real, **100% offline**. Resolve o problema de chegar
no caixa e levar susto.

Features principais:

- Carrinho com itens, total atualizado e barra de orçamento (verde/amarelo/vermelho)
- OCR de etiquetas de preço (Stage 6 — câmera + ML Kit)
- Histórico por mercado e comparativo de preço entre supermercados
- Lista de compras pré-configurada
- Assistente IA por voz/texto (Stages 8–9)
- Export/import CSV para backup e troca de device

**Princípio**: tudo offline em SQLite local. Única dependência de rede (futura)
é a chamada à API de IA no Stage 9.

---

## 2. Status atual

**Branch `dev` (trabalho do dia a dia)** — último commit `6113f46` (ActionBar
e padronização dos botões de rodapé, 2026-05-21).
**Branch `main`** — `dd1e5d0` (Stage 1 estável; só recebe merge testado).

| Stage                  | Status      | Conteúdo                                                                                                                             |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Setup + tema       | ✅ pronto   | Expo SDK 54, NativeWind v4, dark/light com AsyncStorage, 5 skeletons                                                                 |
| 2 — SQLite             | ✅ pronto   | Schema, migrations, queries CRUD, seed em DEV, useDatabase hook                                                                      |
| 3 — Carrinho           | ✅ pronto   | CartContext real, MarketHeader, TotalBanner, CartItem com swipe-delete, 3 modais (market-select, add-item, item-detail), BudgetModal |
| 3.5 — Design system    | ✅ pronto   | `IconBox`, `Card`, `SectionHeader`, `ListRow`, `ActionBar` + telas Carrinho/Mercado/Configurações refatoradas para usarem            |
| 4 — Histórico          | ⏳ pendente | Compras passadas, comparativo de mercados, filtros                                                                                   |
| 5 — Lista de compras   | ⏳ pendente | Lista reutilizável com checkboxes                                                                                                    |
| 6 — Scanner OCR        | ⏳ pendente | Câmera + ML Kit para ler etiquetas                                                                                                   |
| 7 — Export/import CSV  | ⏳ pendente | Backup do histórico                                                                                                                  |
| 8 — UI da IA           | ⏳ pendente | Chat com respostas locais (banco)                                                                                                    |
| 9 — Integração IA real | ⏳ pendente | API definida quando o user escolher modelo                                                                                           |
| 10 — Polish            | ⏳ pendente | Onboarding, edge cases, animações                                                                                                    |

### Tentativas reprovadas (não repetir)

- **2026-05-20:** redesign global com `AppHeader` (saudação personalizada),
  `HeroCard` (gradiente roxo + valor enorme) e `FloatingTabBar` (pílula com
  FAB central). Falhou no teste de celular — sobreposições, conflito com
  empty state, header sem identidade. Voltamos ao `ScreenHeader` clássico,
  tab bar nativa e bloco mercado + bloco total separados.

---

## 3. Stack — não trocar sem motivo

| Camada           | Tech                                                  | Observação                                                        |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Framework        | Expo SDK 54                                           | `expo@~54.0.33`                                                   |
| Navegação        | Expo Router 6.x                                       | file-based                                                        |
| Estilização      | NativeWind v4                                         | exige **Tailwind 3.4.x** (NÃO Tailwind 4)                         |
| Banco            | expo-sqlite                                           | colunas geradas suportadas                                        |
| Estado           | React Context + useReducer                            | sem Redux                                                         |
| Storage prefs    | @react-native-async-storage/async-storage `2.2.0`     | versão é fixada pelo SDK 54 — `npx expo install` quando atualizar |
| Tipagem          | TypeScript strict                                     | sem `any` explícito                                               |
| Câmera (Stage 6) | expo-camera + `@react-native-ml-kit/text-recognition` | já instalado                                                      |
| Voz (Stage 8)    | `@react-native-voice/voice`                           | a instalar                                                        |
| Swipe-delete     | `react-native-swipe-list-view`                        | já instalado                                                      |

Configurações sutis:

- **babel.config.js** usa `babel-preset-expo` com `jsxImportSource: "nativewind"`,
  preset `nativewind/babel`, e plugin `react-native-worklets/plugin` POR ÚLTIMO
  (Reanimated 4).
- **metro.config.js** envolve com `withNativeWind(config, { input: "./global.css" })`.
- Path alias: **`@/*`** mapeia para raiz do projeto.
- `expo-sqlite` plugin já está em `app.json`.

---

## 4. Estrutura de pastas

```
fynner/
├── app/                          ← rotas Expo Router
│   ├── _layout.tsx               ← root: SafeArea + Theme + Cart providers + useDatabase
│   ├── (tabs)/
│   │   ├── _layout.tsx           ← tab bar nativa, 5 abas (não criar tab bar flutuante)
│   │   ├── index.tsx             ← Carrinho (Stage 3 — completo)
│   │   ├── scan.tsx              ← skeleton (Stage 6)
│   │   ├── ai.tsx                ← skeleton (Stages 8–9)
│   │   ├── history.tsx           ← skeleton (Stage 4)
│   │   └── list.tsx              ← skeleton (Stage 5)
│   ├── modals/                   ← apresentados como modal pelo Stack raiz
│   │   ├── market-select.tsx
│   │   ├── add-item.tsx          ← aceita params nome/preco (OCR vai usar)
│   │   └── item-detail.tsx       ← histórico de preço do produto
│   └── settings.tsx              ← modal de configurações
├── components/
│   ├── ui/                       ← design system: IconBox, Card, SectionHeader,
│   │                              ListRow, ActionBar, Button, EmptyState,
│   │                              Screen, ScreenHeader, ThemeToggle
│   └── cart/                     ← MarketHeader, TotalBanner, CartItem, BudgetModal
├── context/                      ← ThemeContext, CartContext
├── database/
│   ├── db.ts                     ← singleton lazy com PRAGMA foreign_keys=ON
│   ├── schema.ts                 ← CREATE TABLEs + índices
│   ├── migrations.ts             ← _migrations + transação atômica
│   ├── seed.ts                   ← popula 3 mercados/produtos em __DEV__
│   └── queries/                  ← markets, products, sessions, items, list
├── hooks/                        ← useTheme, useCart, useDatabase
├── constants/                    ← Colors.ts (paleta + temas), Layout.ts
├── types/                        ← interfaces de domínio
├── utils/                        ← currency.ts (formatBRL/parseBRL/maskBRLInput),
│                                   categoryIcons.ts
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── global.css                    ← @tailwind base/components/utilities
└── nativewind-env.d.ts
```

---

## 5. Convenções importantes

### Código e domínio

- **Português** para nomes de domínio (`Mercado`, `Compra`, `Produto`, `mercados`,
  `compras`). **Inglês** para nomes técnicos (`handler`, `callback`, `ref`).
- Tema padrão é **dark**. Persiste em AsyncStorage com chave `@fynner/theme-mode`.
- Cor accent: `#a203ff` (roxo). Cor de ação destrutiva/finalizar: `#ff6b9d`
  (rosa-crimson) com fundo `#1a0010`.
- Acessar tema sempre via `useTheme()` (retorna `{ mode, theme, toggleTheme, setMode, isReady }`).
- Acessar carrinho sempre via `useCart()` — não tocar no SQLite direto a partir
  de componentes; usar as actions do context.
- Padrão de mutação do CartContext: **mutar no DB → chamar reload() → re-renderiza**.
  Não tentar manter o estado em sync manualmente.
- `itens_compra.subtotal` é coluna **GERADA** pelo SQLite (`preco * quantidade`).
  Não passar valor manual — é só leitura.
- Após mutar itens, chamar `updateSessionTotal(compraId)` para manter
  `compras.total` em dia (feito automaticamente dentro das actions do CartContext).
- TypeScript strict, sem `any`. Se precisar de tipo indefinido, usar `unknown` +
  type guard.
- Comentários explicam **por quê**, não o que. O user (junior em mobile)
  prefere código claro com comentário em decisão não óbvia, sem comentários
  óbvios tipo `// soma 1 ao contador`.

### Design system — obrigatório

- **Telas novas devem usar os componentes base de `components/ui/`** em vez
  de montar layouts inline com `View + backgroundColor`. Os 5 essenciais:
  - `IconBox` — quadrado tintado com ícone (`flexShrink:0` embutido)
  - `Card` — container de bloco padrão (variante `highlighted` p/ card ativo)
  - `SectionHeader` — rótulo "APARÊNCIA", "SOBRE" etc. em caixa alta
  - `ListRow` — linha de lista padrão; centro tem `flex:1+minWidth:0`,
    extremos têm `flexShrink:0`, `minHeight: 62`
  - `ActionBar` — **única forma** de fazer barra de ação inferior. Aceita
    1-3 botões com variantes `primary` / `ghost` / `danger`. Encapsula
    o wrapper completo (background, paddings, borda superior).
- `Button` continua existindo, mas só para CTAs isolados em cards/modais
  (ex.: dentro do `EmptyState`). **Nunca usar `Button` em barra de rodapé** —
  é `ActionBar` obrigatório.
- Cor `#ff6b9d` (rosa-crimson) é exclusiva de ações destrutivas/finalizar.
  Existe como variante `danger` do `ActionBar` e do `Button`.
- Dark mode é o padrão. Light mode existe mas é alternado em Configurações.

---

## 6. Comandos essenciais

```bash
# Setup inicial (PC novo, depois de git clone)
npm install
npx expo install --check    # confirma versões compatíveis com SDK 54

# Rodar no dev
npm start                   # abre Metro, escaneia QR no Expo Go
npx expo start --clear      # se o Metro estiver com cache antigo

# Validar antes de commitar
npx tsc --noEmit            # type-check
npx expo-doctor             # verificações Expo

# Git workflow (cada máquina)
git pull                    # ao chegar
git push                    # ao sair
```

**Branches:**

- `main` — estável, só recebe merge testado
- `dev` — trabalho do dia a dia
- `feature/*` — features longas (não usamos ainda — projeto está em modo
  iteração rápida no `dev`)

**Padrão de commit:** Conventional Commits — `feat:`, `fix:`, `chore:`,
`refactor:`, `docs:`. Veja `git log --oneline` para exemplos.

---

## 7. Gotchas conhecidos

- **Metro cache** segura código antigo às vezes. Se algo "não atualizou":
  `r` no Metro → `Shift+R` → `npx expo start --clear` (escalando).
- **AsyncStorage versão** é fixada por SDK. Não usar `npm install` direto —
  sempre `npx expo install` em deps nativas.
- **NativeWind v4 exige Tailwind 3.x**, não 4. Se o `tsconfig` ganhar entrada
  nova pelo `expo-doctor`, é normal (ele adiciona `nativewind-env.d.ts`).
- **PRAGMA foreign_keys=ON** é ligado em `db.ts` toda abertura — SQLite vem
  desligado por padrão. Sem isso o `ON DELETE CASCADE` em `itens_compra` falha.
- **Seed** roda só em `__DEV__` e só uma vez. Para forçar re-seed:
  desinstalar o app no celular OU `AsyncStorage.removeItem("@fynner/seed-applied-v1")`.
- **Pressable filho dentro de Pressable** (no CartItem): o RN absorve o tap
  no filho, então tocar nos botões +/− não dispara o navigate do card.
- **Subtotal é coluna gerada** — não passar nos INSERT; o SQLite calcula.
- **getActiveSession recebe mercadoId**: existe no máximo uma sessão ativa
  por mercado, mas podem coexistir sessões ativas em mercados diferentes
  (preserva trabalho do usuário em aberto).
- **windows line endings**: o git mostra warnings de LF→CRLF ao stage. Pode
  ignorar — é o autocrlf do Windows.
- **ActionBar usa cores hardcoded** (`#a203ff`, `#d6a5fa`, `#ff6b9d` e rgba
  derivadas). Intencional — a hierarquia visual é fixa e independe do tema.
  Não trocar por tokens do theme sem aprovação.
- **ActionBar não tem `loading`**. Onde o `Button` antes mostrava spinner
  via `loading=true`, combinar em `disabled: isLoading || !canSubmit`. Se
  precisar de feedback forte, estender com `loading?: boolean` que renderiza
  `ActivityIndicator` no lugar do ícone.
- **Firewall do Windows** bloqueia 8081 em redes `Public`. Se o Expo Go
  não conectar no celular, checar se a Wi-Fi está classificada como `Public`
  no Windows e mudar para `Private` (requer Admin). Fallback que sempre
  funciona: `npm start -- --tunnel`.

---

## 8. Próximo stage: 4 — Histórico

Quando o user disser pra prosseguir, implementar:

- `app/(tabs)/history.tsx` com:
  - Card de resumo do mês (total + comparação com mês anterior) — usar `Card`
  - Comparativo de mercados (`getMarketComparison`) com badge no mais barato do mês
  - Lista de compras recentes (`getSessionHistory`) com badge "Em andamento"
    para sessão ativa — usar `ListRow` (provavelmente com `subtitle` + `rightContent`)
  - Filtros: por mercado e por período (esta semana / este mês / últimos 3 meses)
  - Se tiver botão de "Exportar histórico" no rodapé: `ActionBar` com 1 botão primary
- Tocar produto no histórico → reaproveitar `app/modals/item-detail.tsx` já
  pronto. No Stage 4, adicionar gráfico de variação de preço (react-native-svg
  - dados do `getProductPriceHistory`).

Queries do banco para isso já existem em `database/queries/sessions.ts` e
`markets.ts` — só consumir.

---

## 9. Onde encontrar mais detalhes

- **Histórico de commits**: `git log --oneline` — cada commit tem descrição do
  que mudou em qual stage. Os principais marcos:
  - `dd1e5d0` — Stage 1 (setup + tema)
  - `c77ef50` — Stage 2 (SQLite)
  - `779ccc5` — Stage 3 (Carrinho)
  - `f782140` — Design system base (IconBox/Card/SectionHeader/ListRow)
  - `6113f46` — ActionBar + botões de rodapé padronizados
- **Memórias do Claude na máquina local**:
  `~/.claude/projects/<project-slug>/memory/`. Em PC novo essas memórias
  começam vazias — este `CLAUDE.md` é o ponto de entrada do contexto e
  basta lê-lo para retomar. Memórias vão se acumulando ao longo das sessões.
- **Repo**: https://github.com/felpp25/Fynner (branches `main` e `dev`).

---

## 10. UI/UX — Workflow e referências

### Fluxo obrigatório para qualquer alteração visual

1. **Analisar** o problema (screenshot ajuda — descrever o que está errado)
2. **Mockup** — gerar exemplo visual no claude.ai para aprovação **antes** de qualquer código
3. **Aguardar aprovação** — nunca escrever código de UI sem o design confirmado
4. **Implementar** — prompt detalhado com código completo, ordem de execução e checklist
5. **Validar no celular** via Expo Go antes de commitar

> Regra de ouro: design aprovado primeiro, código depois. Nunca ao contrário.

### Tentativa reprovada — não repetir (registrada na Seção 2)

`AppHeader` + `HeroCard` + `FloatingTabBar` (pílula com FAB central).
Testado em 2026-05-20 e reprovado. Causou sobreposições e conflito com empty state.
A identidade visual aprovada usa: `ScreenHeader` clássico + tab bar nativa + bloco
mercado separado do bloco total.

### Referências de design

Os arquivos abaixo contêm o design system completo. Ler antes de implementar
qualquer tela nova ou alterar componentes visuais:

@docs/uiux/design-tokens.md
@docs/uiux/components.md
@docs/uiux/patterns.md

### Padrões visuais aprovados (resumo rápido)

**CartItem (swipe-to-delete):**

- Fundo de delete: `#1a0010` · ícone e texto: `#ff6b9d`
- Layout: `[IconBox flexShrink:0]` `[flex:1 minWidth:0 nome+preço]` `[flexShrink:0 total+qtd]`
- `rightOpenValue: -80` · `disableRightSwipe: true` · `closeOnRowOpen: true`

**Bottom sheet (modais):**

- `Modal animationType="slide"` + overlay `rgba(0,0,0,0.75)`
- Handle: `width:36 height:4 borderRadius:2 background:rgba(214,165,250,0.25)`
- `borderTopLeftRadius:22 borderTopRightRadius:22`
- Tocar no overlay fecha o modal

**Formulário com teclado (KeyboardAvoidingView):**

- `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`
- `autoFocus` no TextInput abre teclado automaticamente
- Sheet sobe junto com o teclado — input nunca fica escondido

**Confirmação de ação destrutiva:**

- Sempre 2 opções além de Cancelar:
  1. Soft delete (preserva histórico) — ícone roxo
  2. Hard delete (apaga tudo) — ícone e texto `#ff6b9d`
- Nunca só "Confirmar / Cancelar" para ações irreversíveis

**Seletor de cor (mercados):**

- ScrollView horizontal com círculos de 32px
- Selecionado: `borderWidth:2.5 borderColor:'#fff'` + ponto branco central (10px)

Verde (rgba(80, 220, 100, 0.85)) foi introduzido no Stage 4 como cor de indicador positivo.
Uso restrito a:

Delta positivo em métricas (gastou menos, fez menos compras desnecessárias)
Badge "mais barato" no comparativo de mercados
Qualquer indicador visual de "isso é uma boa notícia"

Variantes:

successFg: rgba(80, 220, 100, 0.85) — ícone e texto
successBg: rgba(80, 220, 100, 0.12) — fundo de badge
successBorder: rgba(80, 220, 100, 0.30) — borda de badge

Nunca usar verde em botões de ação primária — botão primário é sempre roxo #a203ff.
Verde é leitura, não ação.
