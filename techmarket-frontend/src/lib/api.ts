import { Product, FilterForm, Sale } from "./schema";
import api from "@/services/api";

interface ProductPayload extends Omit<Product, "id" | "createdAt" | "updatedAt"> {
  id?: number;
}

function cleanProductPayload(product: Partial<Product>): ProductPayload {
  const { id, createdAt, updatedAt, ...rest } = product;
  return rest as ProductPayload;
}

export async function fetchProducts(filters: FilterForm): Promise<Product[]> {
  try {
    const params: Record<string, any> = {};

    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.category?.trim()) params.category = filters.category.trim();
    if (typeof filters.minPrice === "number" && filters.minPrice >= 0)
      params.minPrice = filters.minPrice;
    if (typeof filters.maxPrice === "number" && filters.maxPrice >= 0)
      params.maxPrice = filters.maxPrice;

    const { data } = await api.get<Product[]>("/products", { params });
    return data;
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error);
    throw new Error(error?.response?.data?.message || "Erro ao buscar produtos.");
  }
}

export async function addProduct(product: Product): Promise<Product> {
  try {
    const payload = cleanProductPayload(product);
    const { data } = await api.post<Product>("/products", payload);
    return data;
  } catch (error: any) {
    console.error("Erro ao adicionar produto:", error);
    throw new Error(error?.response?.data?.message || "Erro ao adicionar produto.");
  }
}

export async function updateProduct(id: number, product: Product): Promise<Product> {
  try {
    const payload = cleanProductPayload(product);
    const { data } = await api.put<Product>(`/products/${id}`, payload);
    return data;
  } catch (error: any) {
    console.error("Erro ao atualizar produto:", error);
    throw new Error(error?.response?.data?.message || "Erro ao atualizar produto.");
  }
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    await api.delete(`/products/${id}`);
  } catch (error: any) {
    console.error("Erro ao excluir produto:", error);
    throw new Error(error?.response?.data?.message || "Erro ao excluir produto.");
  }
}

export async function fetchSales(): Promise<Sale[]> {
  try {
    const { data } = await api.get<Sale[]>("/sales");
    return data;
  } catch (error: any) {
    console.error("Erro ao buscar vendas:", error);
    throw new Error(error?.response?.data?.message || "Erro ao buscar vendas.");
  }
}

export async function deleteSale(id: number): Promise<void> {
  try {
    await api.delete(`/sales/${id}`);
  } catch (error: any) {
    console.error("Erro ao excluir venda:", error);
    throw new Error(error?.response?.data?.message || "Erro ao excluir venda.");
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const { data } = await api.get<string[]>("/products/categories");
    return data;
  } catch (error: any) {
    console.warn("Rota /products/categories não disponível, usando fallback.");
    try {
      const products = await fetchProducts({
        search: "",
        category: "",
        minPrice: undefined,
        maxPrice: undefined,
      });
      const categories = Array.from(new Set(products.map((p) => p.category)));
      return categories;
    } catch (fallbackError: any) {
      console.error("Erro no fallback de categorias:", fallbackError);
      throw new Error(fallbackError?.response?.data?.message || "Erro ao buscar categorias.");
    }
  }
}
