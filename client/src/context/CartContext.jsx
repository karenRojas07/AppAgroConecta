import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "ac_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((producto, cantidad = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.idProducto === producto.idProducto);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cantidad };
        return next;
      }
      return [
        ...prev,
        {
          idProducto: producto.idProducto,
          nombre: producto.nombre,
          precio: Number(producto.precio),
          cantidad,
          foto: producto.foto,
          idProductor: producto.idProductor,
          cantidadDisponible: producto.cantidadDisponible,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((idProducto, cantidad) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.idProducto === idProducto ? { ...i, cantidad: Math.max(1, cantidad) } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  }, []);

  const removeItem = useCallback((idProducto) => {
    setItems((prev) => prev.filter((i) => i.idProducto !== idProducto));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [items]
  );

  const count = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  );

  const value = { items, addItem, updateQty, removeItem, clear, total, count };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
};
