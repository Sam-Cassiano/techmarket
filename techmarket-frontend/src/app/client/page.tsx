"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { fetchProducts, fetchSales } from "@/lib/api";
import { Product, Sale, FilterForm } from "@/lib/schema";
import { useAuth } from "@/lib/AuthProvider";
import { Filters } from "./components/Filters";
import { ProductTable } from "./components/ProductTable";
import { CartTable } from "./components/CartTable";
import { SalesTable } from "../admin/components/SalesTable";

export default function ClientPanel() {
  const { user, logout, isAuthReady } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState<FilterForm>({
    search: "",
    category: "",
    minPrice: undefined,
    maxPrice: undefined,
  });

  // Aguarda user e isAuthReady estarem prontos para decidir
  const isClientAuthenticated = isAuthReady && user?.role === "user";

  useEffect(() => {
    if (!isAuthReady) return;

    if (!user || user.role !== "user") {
      router.replace("/client/login");
    }
  }, [isAuthReady, user, router]);

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    enabled: isClientAuthenticated,
    refetchInterval: 10000,
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: fetchSales,
    enabled: isClientAuthenticated,
  });

  const clientSales = sales.filter((sale) => sale.client === user?.username);

  const handleLogout = () => {
    logout();
    router.replace("/client/login");
  };

  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando painel do cliente...</p>
      </div>
    );
  }

  if (!user || user.role !== "user") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Painel do Cliente</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="produtos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="carrinho">Carrinho</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <Filters onFilterChange={setFilters} />
          {loadingProducts ? (
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando produtos...</p>
            </div>
          ) : (
            <ProductTable products={products} />
          )}
        </TabsContent>

        <TabsContent value="carrinho">
          <CartTable />
        </TabsContent>

        <TabsContent value="historico">
          <SalesTable sales={clientSales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
