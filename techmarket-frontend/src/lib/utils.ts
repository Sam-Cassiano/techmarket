// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import api from "@/services/api";
import qs from "qs";
import { CartItem } from "@/types"; // certifique-se de que CartItem esteja exportado corretamente

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response?.data?.message === "string"
  ) {
    return (error as any).response.data.message;
  }

  return "Erro inesperado. Tente novamente.";
}

export async function checkCartStock(cart: CartItem[]): Promise<boolean> {
  try {
    if (cart.length === 0) return true;

    const productIds = [...new Set(cart.map((item) => item.id))];
    const query = qs.stringify({ id: productIds }, { arrayFormat: "repeat", encodeValuesOnly: true });
    const response = await api.get(`/products?${query}`);

    const products = Array.isArray(response.data) ? response.data : [];

    return cart.every((item) => {
      const product = products.find((p: any) => p.id === item.id);
      return product && product.stock >= item.quantity;
    });
  } catch (error) {
    console.error("Erro ao verificar estoque:", error);
    return false;
  }
}
