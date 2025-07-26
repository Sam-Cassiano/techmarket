"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "react-toastify";
import { z } from "zod";
import Cookies from "js-cookie";
import { useAuth } from "./AuthProvider";
import { Product, productSchema } from "./schema";
import api from "@/services/api";
import {
  formatCurrency,
  handleApiError,
  checkCartStock as verifyCartStock,
} from "@/lib/utils";

interface CartItem extends Product {
  quantity: number;
}

interface CheckoutInfo {
  paymentMethod: "credit_card" | "debit_card" | "pix";
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  checkout: (checkoutInfo: CheckoutInfo) => Promise<void>;
  checkCartStock: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user, token, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady) return;

    const stored = Cookies.get("cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const cartSchema = z.array(
          productSchema.extend({ quantity: z.number().int().positive() })
        );
        setCart(cartSchema.parse(parsed));
      } catch (error) {
        console.error("Erro ao carregar carrinho dos cookies:", error);
        Cookies.remove("cart");
        setCart([]);
      }
    }
  }, [isAuthReady]);

  useEffect(() => {
    Cookies.set("cart", JSON.stringify(cart), { expires: 7 });
  }, [cart]);

  const checkStock = async (productId: number, requestedQuantity: number): Promise<boolean> => {
    try {
      const response = await api.get(`/products/${productId}`);
      const product = productSchema.parse(response.data);
      const cartItem = cart.find((item) => item.id === productId);
      const currentQuantity = cartItem ? cartItem.quantity : 0;
      const totalQuantity = currentQuantity + requestedQuantity;
      return totalQuantity <= product.stock;
    } catch (error) {
      console.error("Erro ao verificar estoque:", error);
      toast.error(handleApiError(error));
      return false;
    }
  };

  const checkCartStock = async (): Promise<boolean> => {
    return await verifyCartStock(cart);
  };

  const addToCart = async (product: Product) => {
    if (!isAuthReady) return;

    if (!user || !token) {
      toast.error("Você precisa estar logado para adicionar itens ao carrinho.");
      return;
    }

    const isStockAvailable = await checkStock(product.id, 1);
    if (!isStockAvailable) {
      toast.error(`Estoque insuficiente para ${product.name}.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    toast.success(`${product.name} adicionado ao carrinho por ${formatCurrency(product.price)}!`);
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    // Removido toast.info daqui – será controlado no componente.
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }

    const cartItem = cart.find((item) => item.id === id);
    if (!cartItem) return;

    const quantityDiff = quantity - cartItem.quantity;
    if (quantityDiff !== 0) {
      const isStockAvailable = await checkStock(id, quantityDiff);
      if (!isStockAvailable) {
        toast.error(`Estoque insuficiente para ${cartItem.name}.`);
        return;
      }
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );

    toast.info(`Quantidade de ${cartItem.name} atualizada para ${quantity}.`);
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Carrinho esvaziado.");
  };

  const checkout = async (checkoutInfo: CheckoutInfo) => {
    if (!isAuthReady) return;

    if (!user || !token) {
      toast.error("Você precisa estar logado para finalizar a compra.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Carrinho vazio.");
      return;
    }

    const isStockValid = await checkCartStock();
    if (!isStockValid) {
      toast.error("Alguns itens estão com estoque insuficiente. Por favor, ajuste as quantidades no carrinho.");
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const payload = {
      userId: user.id,
      client: user.username,
      total,
      paymentMethod: checkoutInfo.paymentMethod,
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    try {
      await api.post("/sales", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCart([]);
      toast.success(`Compra finalizada com sucesso! Total: ${formatCurrency(total)}`);
    } catch (error: any) {
      console.error("Erro ao finalizar compra:", error);
      toast.error(handleApiError(error));
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        checkCartStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
