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

**Branch `dev` (trabalho do dia a dia)** — último commit `f22cf07` (UI fix).
**Branch `main`** — `dd1e5d0` (Stage 1 estável; só recebe merge testado).

| Stage | Status | Conteúdo |
|-------|--------|----------|
| 1 — Setup + tema | ✅ pronto | Expo SDK 54, NativeWind v4, dark/light com AsyncStorage, 5 skeletons |
| 2 — SQLite | ✅ pronto | Schema, migrations, queries CRUD, seed em DEV, useDatabase hook |
| 3 — Carrinho | ✅ pronto | CartContext real, MarketHeader, TotalBanner, CartItem com swipe-delete, 3 modais (market-select, add-item, item-detail), BudgetModal |
| 4 — Histórico | ⏳ pendente | Compras passadas, comparativo de mercados, filtros |
| 5 — Lista de compras | ⏳ pendente | Lista reutilizável com checkboxes |
| 6 — Scanner OCR | ⏳ pendente | Câmera + ML Kit para ler etiquetas |
| 7 — Export/import CSV | ⏳ pendente | Backup do histórico |
| 8 — UI da IA | ⏳ pendente | Chat com respostas locais (banco) |
| 9 — Integração IA real | ⏳ pendente | API definida quando o user escolher modelo |
| 10 — Polish | ⏳ pendente | Onboarding, edge cases, animações |

---

## 3. Stack — não trocar sem motivo

| Camada | Tech | Observação |
|--------|------|-----------|
| Framework | Expo SDK 54 | `expo@~54.0.33` |
| Navegação | Expo Router 6.x | file-based |
| Estilização | NativeWind v4 | exige **Tailwind 3.4.x** (NÃO Tailwind 4) |
| Banco | expo-sqlite | colunas geradas suportadas |
| Estado | React Context + useReducer | sem Redux |
| Storage prefs | @react-native-async-storage/async-storage `2.2.0` | versão é fixada pelo SDK 54 — `npx expo install` quando atualizar |
| Tipagem | TypeScript strict | sem `any` explícito |
| Câmera (Stage 6) | expo-camera + `@react-native-ml-kit/text-recognition` | já instalado |
| Voz (Stage 8) | `@react-native-voice/voice` | a instalar |
| Swipe-delete | `react-native-swipe-list-view` | já instalado |

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
│   │   ├── _layout.tsx           ← tab bar com 5 abas
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
│   ├── ui/                       ← Button, EmptyState, Screen, ScreenHeader, ThemeToggle
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
npx expo-doctor             # verificações Expo (17/17 atualmente passam)

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

---

## 8. Próximo stage: 4 — Histórico

Quando o user disser pra prosseguir, implementar:
- `app/(tabs)/history.tsx` com:
  - Card de resumo do mês (total + comparação com mês anterior)
  - Comparativo de mercados (`getMarketComparison`) com badge no mais barato do mês
  - Lista `SessionCard` das compras recentes (`getSessionHistory`) com badge
    "Em andamento" para sessão ativa
  - Filtros: por mercado e por período (esta semana / este mês / últimos 3 meses)
- Tocar produto no histórico → reaproveitar `app/modals/item-detail.tsx` já
  pronto. No Stage 4, adicionar gráfico de variação de preço (react-native-svg
  + dados do `getProductPriceHistory`).

Queries do banco para isso já existem em `database/queries/sessions.ts` e
`markets.ts` — só consumir.

---

## 9. Onde encontrar mais detalhes

- Histórico de commits: `git log --oneline` — cada commit tem descrição do
  que mudou em qual stage.
- Memórias do Claude: `~/.claude/projects/c--Users-ti/memory/` (relevantes:
  `project_fynner.md`, `fynner_stack.md`, `fynner_architecture.md`,
  `user_profile.md`).
- Repo: https://github.com/felpp25/Fynner (branches `main` e `dev`).
