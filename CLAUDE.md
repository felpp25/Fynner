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

**Branch `dev` (trabalho do dia a dia)** — Stages 1–7 + Sub-stage 8a estão
mergeados. **Branch `main`** sincronizada com `dev`.

| Stage                  | Status      | Conteúdo                                                                                                                             |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Setup + tema       | ✅ pronto   | Expo SDK 54, NativeWind v4, dark/light com AsyncStorage, 5 skeletons                                                                 |
| 2 — SQLite             | ✅ pronto   | Schema, migrations (001, 002, 003), queries CRUD, seed em DEV, useDatabase hook                                                      |
| 3 — Carrinho           | ✅ pronto   | CartContext real, MarketHeader, TotalBanner, CartItem com swipe-delete, 3 modais (market-select, add-item, item-detail), BudgetModal |
| 3.5 — Design system    | ✅ pronto   | `IconBox`, `Card`, `SectionHeader`, `ListRow`, `ActionBar` + telas Carrinho/Mercado/Configurações refatoradas para usarem            |
| 4 — Histórico          | ✅ pronto   | `SessionCard`, `InsightCard`, `MarketComparison`, `FilterSheet`, `SessionItemRow`, tela `history.tsx` + `modals/session-detail.tsx`  |
| 5 — Listas             | ✅ pronto   | Migration 003 (`listas` + `lista_itens.lista_id`); `ListCard`, `ListItemRow`, `NewListSheet`, `AddItemSheet`; tela `list.tsx` + `modals/list-detail.tsx` |
| 6 — Scanner OCR        | ✅ pronto   | UI completa + OCR real via ML Kit (commit `69d6d7c`). Crop programático pela região da moldura via `expo-image-manipulator`; `extractName` com heurísticas robustas (filtra lixo + pontua por caixa alta/letras/posição antes do preço); `extractPrice` pega o maior valor `\d+[.,]\d{2}` |
| 7 — Export/import CSV  | ✅ pronto   | `services/csv.ts` com parser RFC 4180; botões em Configurações; preview/result modal; dedup por (data+mercado+produto+preço)            |
| 8 — Fynner IA          | ✅ pronto       | Sub-stages: 8a ✅ (dev client + OCR real), 8b ✅ (chat + OpenAI tool calling), 8c ✅ (voz nativa pt-BR via `expo-speech-recognition`)     |
| ~~9~~                  | mesclado    | Decisão (2026-05-22): Stage 9 absorvido pelo 8b. IA real desde o início com OpenAI GPT-4o-mini + tool calling sobre queries do banco. Key local no `.env` durante dev (não distribuir builds com a key embutida).                                                                                |
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
| Câmera + OCR (Stage 6) | expo-camera + `@react-native-ml-kit/text-recognition` + `expo-image-manipulator` | Todos instalados e ativos. App agora roda como **dev client** (não mais Expo Go) — Sub-stage 8a (`69d6d7c`) |
| Voz (Stage 8c)         | `expo-speech-recognition`                                                         | ✅ ativo via `services/voice.ts` + `hooks/useVoice.ts` (commit `ab9cc3f`). Idioma pt-BR forçado. Tap-tap: toca pra começar, toca no mic central pra enviar. **Decisão**: trocamos `@react-native-voice/voice` por `expo-speech-recognition` durante a Fase 1 — API mais idiomática Expo, melhor integração com SDK 54, suporte oficial |
| IA (Stage 8b)          | OpenAI GPT-4o-mini via fetch direto                                               | ✅ ativo via `services/ai.ts` (commit `2be04dc`). Sem SDK, chamada HTTP direta. API key em `EXPO_PUBLIC_OPENAI_API_KEY` no `.env` local (NUNCA committar) |
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
- **Tool calling com OpenAI:** o `services/ai.ts` usa fetch direto à
  `chat/completions`. As 4 tools (`getFinancialOverview`, `getShoppingHistory`,
  `getAllMarketsList`, `searchProducts`) consomem as queries existentes em
  `database/queries/` e devolvem JSON compacto pro modelo. Loop limitado a 5
  iterações como salvaguarda contra tool-call em loop. Histórico enviado limitado
  às últimas 6 mensagens (controla tokens sem perder contexto recente).
- **Padrão `XXX_AVAILABLE`:** quando um service depende de configuração externa
  ou módulo nativo opcional, ele exporta uma constante `XXX_AVAILABLE` booleana.
  A UI consome essa flag pra mostrar/esconder funcionalidade e/ou banners
  explicativos. Exemplos: `OCR_AVAILABLE` (services/ocr.ts), `AI_AVAILABLE`
  (services/ai.ts), futuro `VOICE_AVAILABLE` (services/voice.ts no Stage 8c).
- **`wasListeningRef` pra detectar transição de estado:** quando precisar
  reagir a uma transição específica de boolean (ex: `isListening` indo de
  `true` → `false`), usar um `useRef<boolean>` ao lado do `useEffect`. Não
  derivar do `useState` anterior porque o efeito não tem acesso ao valor
  anterior. Padrão aplicado em `app/(tabs)/ai.tsx` pra disparar auto-envio
  da pergunta gravada por voz exatamente uma vez quando a gravação termina.
  Cuidado importante: incluir só a variável principal nas deps (`[isListening]`),
  não o transcript — senão o efeito re-roda em cada partial result e pode
  disparar envio múltiplo.
- **Limpar transcript ANTES de mudar isListening em cancel:** no
  `hooks/useVoice.ts`, a função `cancel()` zera o transcript antes de setar
  `isListening = false`. Sem essa ordem, o useEffect de auto-envio veria
  `transcript` ainda preenchido e dispararia envio acidental ao cancelar.
  Race condition sutil mas real — vale registrar.

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

# Rodar no dev (a partir do Sub-stage 8a o app roda como dev client, não mais Expo Go)
npm start                   # abre Metro; abrir o app "Fynner" instalado no celular
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
- **Firewall do Windows** bloqueia 8081 em redes `Public`. Se o dev client
  não conectar ao Metro do PC, checar se a Wi-Fi está classificada como
  `Public` no Windows e mudar para `Private` (requer Admin). Fallback que
  sempre funciona: `npm start -- --tunnel`.
- **Build vs Expo Go**: a partir do Sub-stage 8a (commit `69d6d7c`), o app não roda mais no Expo Go. Pra rodar, é necessário ter o APK do dev client instalado no celular e o Metro rodando no PC (`npm start`). Pra **adicionar módulo nativo novo** (ex: `expo-image-manipulator`, `expo-speech-recognition`), é obrigatório fazer:
  1. `npx expo install <pacote>` (não `npm install`)
  2. `npx expo prebuild --platform android --clean` (regenera pasta `android/` com Gradle ciente do módulo)
  3. `eas build --profile development --platform android` (sobe nova build pra nuvem)
  4. Instalar o novo APK por cima do antigo (dados SQLite preservados)
- **Módulos nativos JS-only não existem**: se ao adicionar um pacote o app crashar com `Cannot find native module 'XXX'`, é porque o módulo tem código nativo (Kotlin/Java) que precisa estar no APK. Hot reload do Metro só atualiza JS. Solução: rebuild EAS (passos acima).
- **OCR com crop pela moldura** (Sub-stage 8a): `services/ocr.ts` está acoplado a `app/(tabs)/scan.tsx` por uma decisão importante — o crop é feito no `scan.tsx` ANTES de chamar `recognizeText`. Crop = 65% da largura da foto, centralizado, mantendo aspect 1.625:1 (proporção da moldura visual `260×160`). Se ajustar a moldura visual, ajustar também o ratio no `handleCapture`.
- **Variáveis `EXPO_PUBLIC_*` são embutidas no bundle em build time** —
  não lidas em runtime. Ao editar o `.env`, é obrigatório reiniciar o Metro
  com `npx expo start --clear`. Sem o `--clear`, o bundle anterior é servido
  e as variáveis novas não chegam ao app. Sintoma comum: `AI_AVAILABLE` continua
  `false` mesmo após adicionar a key no `.env`.
- **`KeyboardAvoidingView` no Android exige `behavior="height"`** (não
  `undefined`) quando a tela tem tab bar nativa. Sem isso, o teclado cobre
  o input. Padrão usado em todos os modais com TextInput do app (NewMarketSheet,
  NewListSheet, AddItemSheet, FilterSheet, tela ai.tsx). iOS continua com
  `behavior="padding"`.
- **API key da OpenAI no `.env` é só pra desenvolvimento.** A variável
  `EXPO_PUBLIC_OPENAI_API_KEY` fica embutida no bundle final do APK — qualquer
  pessoa com conhecimento técnico consegue extrair. **Nunca distribuir build
  com a key embutida** (família, beta, lojas). Quando o app virar produto pago,
  migrar para backend próprio que faz a chamada à OpenAI server-side.
- **`expo-speech-recognition` precisa de plugin no `app.json`** com strings
  de permissão em PT-BR. Sem isso, o app crasha ao tentar `requestPermissionsAsync`.
  Plugin estruturado assim:
  ```json
  "plugins": [
    ["expo-speech-recognition", {
      "microphonePermission": "O Fynner usa o microfone para você fazer perguntas por voz",
      "speechRecognitionPermission": "O Fynner usa reconhecimento de voz para entender suas perguntas"
    }]
  ]
  ```
- **Glow animado em sombras quebra TS strict**: `shadowOpacity: animatedValue`
  não é tipável corretamente em RN sem `as any`. Solução: usar só `transform: [{ scale }]`
  pra pulsar elementos (ex: VoiceOverlay), 100% no native driver, sem cast.
- **`Animated.loop` precisa de cleanup**: sempre `return () => animation.stop()`
  no useEffect. Sem isso, animações continuam rodando após unmount → memory leak.
  Padrão aplicado em `TypingIndicator.tsx` (3 dots) e `VoiceOverlay.tsx` (mic pulsante).

---

## 8. Próximos passos

### Stage 10 — Polish e onboarding (último stage de feature)

Esse stage não tem urgência — o app já é funcionalmente completo desde o
fechamento do Stage 8. Sugestões pra incluir:

- **Onboarding** na primeira abertura — apresenta cada aba com tooltip ou
  swipe horizontal. Ideal: 3-4 telas curtas (Carrinho, Scan, IA, Histórico).
- **Edge cases revelados pelo uso real** — bugs sutis que só aparecem com
  uso de dias/semanas. Sugestão: usar o app por 1-2 semanas antes de
  começar o Stage 10 pra ter lista real de coisas a corrigir.
- **Animações sutis** — transições entre telas, microinterações em botões,
  shake/spring quando um botão é desabilitado, etc. Aplicar com moderação.
- **Empty states melhores** — Histórico vazio, Lista vazia, Mercados zerados.
  Hoje funcionam mas são genéricos.
- **Acessibilidade** — auditar `accessibilityLabel` em todos os botões com
  ícone-only (regra já em `patterns.md`). Confirmar que screen reader
  consegue navegar a tela de IA.

### Decisão de monetização (não bloqueia o Stage 10)

A API key da OpenAI está embutida no APK durante desenvolvimento. Pra
distribuir o app pra qualquer pessoa além de você, precisa:

- **Caminho A — uso pessoal**: continuar como está. Build assinado, instala
  no celular pra família/amigos com aviso "este APK tem minha key embutida".
- **Caminho B — produto pago**: backend próprio (Cloudflare Worker mínimo)
  + assinatura (RevenueCat) + auth anônimo por device ID. Discutido em
  2026-05-22. ~1-2 semanas de trabalho pra montar.

Recomendação: usar o app por algumas semanas em uso pessoal antes de decidir.
Se prevalecer o desejo de monetizar, o Caminho B é viável e o app está
arquiteturalmente pronto pra ele (não tem nada acoplado à OpenAI fora do
`services/ai.ts` — fácil trocar pelo backend).

### Pendências de documentação

- **Verde no design system** documentado em CLAUDE.md mas falta consolidar
  em `docs/uiux/design-tokens.md` (próxima atualização da skill).
- **Padrão `XXX_AVAILABLE`** documentado na Seção 5 do CLAUDE.md mas falta
  adicionar em `docs/uiux/patterns.md` com exemplos completos
  (`OCR_AVAILABLE`, `AI_AVAILABLE`, `VOICE_AVAILABLE`).
- **Padrão de overlay de voz** (mic pulsante, transcript em tempo real,
  tap-pra-parar via Pressable) merece doc própria em
  `docs/uiux/patterns.md` na próxima atualização da skill.
- **Padrão de tool calling** (estrutura híbrida: poucas tools compostas +
  uma tool de busca) também merece doc própria.
- **Convenção de service `XXX-test.ts` temporário** para validação seca
  durante desenvolvimento (removido antes do commit final). Padrão usado
  em `ai-test.ts` (8b) e `voice-test.ts` (8c).

---

## 9. Onde encontrar mais detalhes

- **Histórico de commits**: `git log --oneline` — cada commit tem descrição do
  que mudou em qual stage. Os principais marcos:
  - `dd1e5d0` — Stage 1 (setup + tema)
  - `c77ef50` — Stage 2 (SQLite)
  - `779ccc5` — Stage 3 (Carrinho)
  - `f782140` — Design system base (IconBox/Card/SectionHeader/ListRow)
  - `6113f46` — ActionBar + botões de rodapé padronizados
  - `7bcf3ff` — Mercados como cards swipeable + DeleteMarketSheet
  - `e21e48a` — Stage 4 (Histórico)
  - `93108ed` — Stage 5 (Listas nomeadas, migration 003)
  - `d3b58c9` — Fix layout list-detail (2 SwipeListViews + ScrollView pai)
  - `3c286d3` — Stage 6 UI: câmera, viewfinder, form de resultado (OCR stub)
  - `31e8567` — Stage 7: export/import CSV completos
  - `cc92722` — Settings: Export/Import vira ActionBar fixo
  - `69d6d7c` — **Sub-stage 8a**: dev client (EAS) + OCR real (ML Kit) + crop pela moldura
  - `2be04dc` — **Sub-stage 8b**: IA por texto com OpenAI tool calling + persistência (migration 004, services/ai.ts, components/ai/, tela ai.tsx)
  - `ab9cc3f` — **Sub-stage 8c**: voz nativa com `expo-speech-recognition` (services/voice.ts, hooks/useVoice.ts, VoiceOverlay, tap-tap auto-envio). **Stage 8 completo.**
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
5. **Validar no celular** via dev client (Sub-stage 8a em diante) antes de commitar

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
