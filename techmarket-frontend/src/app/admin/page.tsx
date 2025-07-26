"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

import { ProductTable } from "./components/ProductTable";
import { ProductForm } from "./components/ProductForm";
import { SalesTable } from "./components/SalesTable";

import {
  fetchProducts,
  fetchSales,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteSale,
} from "@/lib/api";
import { Product, Sale, FilterForm } from "@/lib/schema";
import { useAuth } from "@/lib/AuthProvider";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isReady, setIsReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);

  const [filters, setFilters] = useState<FilterForm>({
    search: "",
    category: "",
    minPrice: undefined,
    maxPrice: undefined,
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady && (!user || user.role !== "admin")) {
      router.push("/admin/login");
    }
  }, [user, isReady, router]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    enabled: isReady && !!user,
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
    enabled: isReady && !!user,
  });

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
      toast.success("Produto adicionado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao adicionar produto.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (product: Product) => {
      if (!product.id) throw new Error("ID do produto ausente.");
      const { id, createdAt, updatedAt, ...data } = product;
      return updateProduct(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
      setEditingProduct(null);
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao atualizar produto.");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao excluir produto.");
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao excluir venda.");
    },
  });

  const handleSubmitProduct = (product: Product) => {
    if (editingProduct?.id) {
      updateMutation.mutate({ ...product, id: editingProduct.id });
    } else {
      addMutation.mutate(product);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  if (!isReady || !user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Painel do Administrador</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex justify-between mb-4">
            <Input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>Adicionar Produto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Produto" : "Adicionar Produto"}
                  </DialogTitle>
                </DialogHeader>
                <ProductForm
                  onSubmit={handleSubmitProduct}
                  initialData={editingProduct}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando produtos...</span>
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={handleEditProduct}
              onDelete={(id) => deleteProductMutation.mutate(id)}
            />
          )}
        </TabsContent>

        <TabsContent value="sales">
          {loadingSales ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando vendas...</span>
            </div>
          ) : (
            <SalesTable
              sales={sales}
              onDelete={(id) => deleteSaleMutation.mutate(id)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
