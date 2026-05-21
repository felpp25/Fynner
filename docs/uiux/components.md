# Componentes Base — Fynner

## ActionBar

**Arquivo:** `components/ui/ActionBar.tsx`
**Regra:** TODA barra de ação inferior do app usa este componente. Nunca TouchableOpacity solto.

```tsx
export type ActionBarVariant = 'primary' | 'ghost' | 'danger';

export interface ActionBarButton {
  label: string;                          // máx 12 caracteres
  icon: keyof typeof Ionicons.glyphMap;
  variant: ActionBarVariant;
  onPress: () => void;
  disabled?: boolean;
}

// Uso:
<ActionBar buttons={[
  { label: 'Escanear',  icon: 'scan-outline',             variant: 'primary', onPress: ... },
  { label: 'Adicionar', icon: 'add',                       variant: 'ghost',   onPress: ... },
  { label: 'Finalizar', icon: 'checkmark-circle-outline',  variant: 'danger',  onPress: ..., disabled: itens.length === 0 },
]} />
```

**Estilos por variante:**

- `primary`: `backgroundColor: '#a203ff'` · `color: '#fff'` · `fontWeight: '600'`
- `ghost`: `backgroundColor: 'rgba(162,3,255,0.10)'` + border `rgba(162,3,255,0.35)` · `color: '#d6a5fa'`
- `danger`: `backgroundColor: 'rgba(255,107,157,0.10)'` + border `rgba(255,107,157,0.32)` · `color: '#ff6b9d'`
- `disabled`: `opacity: 0.5` + `disabled: true` no TouchableOpacity

---

## ListRow

**Arquivo:** `components/ui/ListRow.tsx`
**Regra:** Toda linha de lista usa este componente.

```tsx
<ListRow
  // Esquerda (um dos dois)
  icon="cart-outline"
  leftCustom={
    <View
      style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: cor }}
    />
  }
  // Centro
  title="Texto principal"
  subtitle="Texto secundário opcional"
  // Direita
  showArrow // mostra chevron-forward
  rightContent={<Switch />} // qualquer elemento
  // Comportamento
  onPress={() => {}}
  disabled={false}
/>
```

**Layout fixo — não alterar:**

```
[leftCustom/IconBox] [flex:1 minWidth:0 título+sub] [flexShrink:0 rightContent/arrow]
```

`minHeight: 62` · `padding: 11px 13px` · `gap: 11` · `borderRadius: 14`

---

## IconBox

**Arquivo:** `components/ui/IconBox.tsx`

```tsx
<IconBox icon="wheat" size="md" />
// Tamanhos: sm(28px) · md(36px) · lg(44px)
// bgColor padrão: accentMid (rgba(162,3,255,0.22))
// iconColor padrão: accentLight (#d6a5fa)
```

---

## Card

**Arquivo:** `components/ui/Card.tsx`

```tsx
<Card variant="default">...</Card>
<Card variant="highlighted">...</Card>
<Card padding={16}>...</Card>  // padding customizado
```

`borderRadius: 14` · `borderWidth: 0.5` · `backgroundColor: card`

---

## SectionHeader

**Arquivo:** `components/ui/SectionHeader.tsx`

```tsx
<SectionHeader>Aparência</SectionHeader>
<SectionHeader marginTop={20} marginBottom={8}>Sobre</SectionHeader>
```

Caixa alta · `fontSize: 11` · `letterSpacing: 1.2` · cor `textMuted`

---

## CartItem

**Arquivo:** `components/cart/CartItem.tsx`
**Usado com:** `SwipeListView` do `react-native-swipe-list-view`

**Layout interno obrigatório:**

```tsx
<View style={{ flexDirection:'row', alignItems:'center', gap:11, minHeight:62 }}>
  <IconBox ... />                          {/* flexShrink:0 */}
  <View style={{ flex:1, minWidth:0 }}>    {/* CRÍTICO — sem isso o layout quebra */}
    <Text numberOfLines={1}>{nome}</Text>
    <Text>{preco} × {qtd}</Text>
  </View>
  <View style={{ flexShrink:0, ... }}>     {/* CRÍTICO */}
    <Text>{subtotal}</Text>
    <View style={{ flexDirection:'row' }}>  {/* controles − qtd + */}
      <TouchableOpacity ...>−</TouchableOpacity>
      <Text>{quantidade}</Text>
      <TouchableOpacity ...>+</TouchableOpacity>
    </View>
  </View>
</View>
```

**HiddenItem (fundo de delete):**

```tsx
<View
  style={{
    flex: 1,
    backgroundColor: "#1a0010",
    borderRadius: 14,
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "center",
  }}
>
  <TouchableOpacity
    style={{
      width: 80,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    }}
  >
    <Ionicons name="trash-outline" size={20} color="#ff6b9d" />
    <Text style={{ color: "#ff6b9d", fontSize: 11, fontWeight: "500" }}>
      Remover
    </Text>
  </TouchableOpacity>
</View>
```

**Configuração SwipeListView:**

```tsx
<SwipeListView
  rightOpenValue={-80}
  disableRightSwipe
  closeOnRowOpen
  closeOnRowPress
  tension={40}
  friction={8}
/>
```

---

## DeleteSheet (padrão de confirmação destrutiva)

**Arquivo:** `components/market/DeleteMarketSheet.tsx`

Estrutura obrigatória:

1. `Modal` com `animationType="slide"` + overlay `rgba(0,0,0,0.75)`
2. Sheet com `borderTopLeftRadius:22 borderTopRightRadius:22`
3. Handle decorativo `(width:36, height:4, background:rgba(214,165,250,0.25))`
4. Ícone centralizado em círculo com fundo `rgba(255,107,157,0.12)`
5. Título + descrição centralizados
6. Opção "Manter histórico" (soft delete) — ícone roxo
7. Opção "Apagar tudo" (hard delete) — ícone e texto `#ff6b9d`
8. Botão "Cancelar" outline sutil

---

## NewMarketSheet (form acima do teclado)

**Arquivo:** `components/market/NewMarketSheet.tsx`

**Estrutura obrigatória para não ficar atrás do teclado:**

```tsx
<Modal visible={visible} transparent animationType="slide">
  <KeyboardAvoidingView
    style={{ flex: 1, justifyContent: "flex-end" }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
      }}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={onClose}
        activeOpacity={1}
      />
      <View
        style={
          {
            /* sheet */
          }
        }
      >
        {/* handle + input + color picker + ActionBar buttons */}
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

**IMPORTANTE:** `autoFocus` no `TextInput` abre o teclado automaticamente e o `KeyboardAvoidingView` sobe o sheet.
