import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartItem = {
  cart_id: string;
  type: "APPOINTMENT" | "PRODUCT" | "EXAM";
  reference_id: string;
  title: string;
  subtitle?: string;
  price: number;
  quantity: number;
  image?: string;
  metadata?: any;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cart_id" | "quantity"> & { quantity?: number }) => void;
  removeItem: (cart_id: string) => void;
  updateQty: (cart_id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "cart_items";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) try { setItems(JSON.parse(raw)); } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartCtx["addItem"] = (item) => {
    setItems((prev) => [
      ...prev,
      {
        ...item,
        quantity: item.quantity || 1,
        cart_id: `${item.type}-${item.reference_id}-${Date.now()}`,
      },
    ]);
  };

  const removeItem = (cart_id: string) =>
    setItems((p) => p.filter((i) => i.cart_id !== cart_id));

  const updateQty = (cart_id: string, qty: number) =>
    setItems((p) =>
      p.map((i) => (i.cart_id === cart_id ? { ...i, quantity: Math.max(1, qty) } : i))
    );

  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, addItem, removeItem, updateQty, clear, subtotal }}>
      {children}
    </Ctx.Provider>
  );
};

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
};
