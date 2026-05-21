# Padrões de UI/UX — Fynner

## Padrão de tela principal (tabs)

```
┌────────────────────────────────┐
│ [Título 24px bold]    [☀][⚙]  │  ← Header (padding 14px)
├────────────────────────────────┤
│ [Conteúdo scrollável           │
│  com gap:12 entre blocos]      │
│                                │
│  paddingBottom: 90px           │  ← espaço para tab bar
├────────────────────────────────┤
│ [ActionBar com botões]         │  ← borda topo accentBorder
├────────────────────────────────┤
│ 🛒  📷  ✨  🕐  📋           │  ← Tab bar nativa
└────────────────────────────────┘
```

## Padrão de modal/bottom sheet

```
┌────────────────────────────────┐
│  [Overlay rgba(0,0,0,0.75)]   │
│                                │
│  ┌──────────────────────────┐  │
│  │  ─────  (handle)         │  │
│  │  [Conteúdo do modal]     │  │
│  │                          │  │
│  │  [ActionBar]             │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

- Tocar no overlay fecha o modal
- `borderRadius: 22` nos cantos superiores
- `animationType="slide"` sempre

## Padrão de swipe-to-delete

Disponível em:

- CartItem (carrinho)
- MarketCard (lista de mercados)

**Comportamento:**

- Desliza apenas para a esquerda (`disableRightSwipe: true`)
- Abre 80px revelando lixeira + "Remover/Apagar"
- Soltar no meio: card volta (spring)
- Arrastar até o fim OU tocar no botão: confirma
- Dois cards não ficam abertos simultaneamente (`closeOnRowOpen: true`)

**Cores padrão:**

- Fundo: `#1a0010`
- Ícone + texto: `#ff6b9d`

## Padrão de linha de mercado

```
┌────────────────────────────────────────┐
│ ● [nome]               [🗑] [>]        │
│   [última visita: DD de mmm.]          │
└────────────────────────────────────────┘
```

- Ponto colorido: `width:14, height:14, borderRadius:7`
- Lixeira: `width:28, height:28, borderRadius:8, bg:#1a0010, border:rgba(255,107,157,0.30)`
- Toque na lixeira NÃO dispara seleção do card (`onStartShouldSetResponder: () => true`)

## Padrão de formulário com teclado (KeyboardAvoidingView)

Para qualquer modal com TextInput:

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex:1, justifyContent:'flex-end' }}
>
```

- iOS: `padding` empurra o sheet para cima
- Android: `height` reduz a área disponível
- `autoFocus` no TextInput garante abertura automática do teclado

## Padrão de confirmação destrutiva

Sempre 3 opções para ações com consequências:

1. **Opção conservadora** (manter/preservar) — cor `accentLight`, ícone roxo
2. **Opção destrutiva** (apagar tudo) — cor `#ff6b9d`, ícone rosa
3. **Cancelar** — texto muted, sem preenchimento

Nunca mostrar apenas "Confirmar / Cancelar" para ações destrutivas.
O usuário precisa entender o que vai acontecer com os dados relacionados.

## Padrão de empty state

Quando uma lista/tela não tem dados:

```tsx
<View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:14 }}>
  <View style={{ width:72, height:72, borderRadius:36, backgroundColor:accentMid,
    justifyContent:'center', alignItems:'center' }}>
    <Ionicons name="cart-outline" size={32} color={accentLight} />
  </View>
  <Text style={{ fontSize:18, fontWeight:'600', color:text }}>Carrinho vazio</Text>
  <Text style={{ fontSize:13, color:textMuted, textAlign:'center', lineHeight:20 }}>
    Escaneie uma etiqueta de preço ou{'\n'}adicione um produto manualmente.
  </Text>
  <TouchableOpacity onPress={...}>
    <Text style={{ fontSize:14, fontWeight:'600', color:accent }}>Adicionar item</Text>
  </TouchableOpacity>
</View>
```

## Seletor de cor (color picker horizontal)

Para escolha de cor (ex: nova mercado):

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <View style={{ flexDirection: "row", gap: 10 }}>
    {MARKET_COLORS.map((cor) => (
      <TouchableOpacity
        key={cor}
        onPress={() => setCorSelecionada(cor)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: cor,
          borderWidth: corSelecionada === cor ? 2.5 : 0,
          borderColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {corSelecionada === cor && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: "#fff",
            }}
          />
        )}
      </TouchableOpacity>
    ))}
  </View>
</ScrollView>
```

## Banco de dados — queries de delete

**Soft delete** (mantém dados no histórico):

```sql
UPDATE mercados SET ativo = 0 WHERE id = ?
-- Mercado some da lista mas compras/itens preservados para comparativos
```

**Hard delete** (apaga tudo):

```sql
DELETE FROM compras WHERE mercado_id = ?;  -- itens_compra cascade automaticamente
DELETE FROM mercados WHERE id = ?;
```

**Filtro padrão** — toda query que lista mercados deve incluir:

```sql
WHERE ativo = 1
```

## Regras de acessibilidade

- `accessibilityLabel` obrigatório em todos os botões com apenas ícone
- `numberOfLines={1}` em todo texto que pode ser longo em layout horizontal
- Altura mínima de 62px para qualquer elemento tocável
- Nunca desabilitar um botão sem feedback visual (opacity 0.5 no mínimo)
