/**
 * Catálogo de ícones disponíveis para listas de compras.
 *
 * Mantido como constante em runtime (não no types/) porque é consumido
 * pelo seletor de ícone no NewListSheet. Adicionar novos ícones aqui basta
 * pra eles aparecerem na UI.
 */
import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface ListIcon {
  id: string;
  name: IconName;
}

export const LIST_ICONS: ListIcon[] = [
  { id: "cart", name: "cart-outline" },
  { id: "flame", name: "flame-outline" }, // churrasco
  { id: "gift", name: "gift-outline" }, // festa/aniversário
  { id: "happy", name: "happy-outline" }, // bebê/família
  { id: "wine", name: "wine-outline" }, // bebidas
  { id: "pizza", name: "pizza-outline" }, // comida
  { id: "paw", name: "paw-outline" }, // pet
  { id: "home", name: "home-outline" }, // casa
];
