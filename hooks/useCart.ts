import { useContext } from "react";

import { CartContext } from "@/context/CartContext";

/**
 * Hook para consumir o estado e ações do carrinho.
 * Lança erro se usado fora do CartProvider.
 */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de um <CartProvider>.");
  }
  return ctx;
}
