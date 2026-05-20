/**
 * CartContext — placeholder do Stage 1.
 *
 * No Stage 1 ainda não temos banco de dados; este provider apenas existe para
 * que o RootLayout possa envolver a árvore com ele. O estado real (sessão
 * ativa, itens, mercado) será implementado no Stage 3 junto com o SQLite.
 */
import { createContext, ReactNode } from "react";

export interface CartContextValue {
  // Placeholder — campos reais virão no Stage 3.
  ready: boolean;
}

export const CartContext = createContext<CartContextValue>({ ready: false });

export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <CartContext.Provider value={{ ready: false }}>
      {children}
    </CartContext.Provider>
  );
}
