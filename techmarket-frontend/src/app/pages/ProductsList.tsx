typescript
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "@/lib/schema";
import { toast } from "react-toastify";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { Edit, Trash2, ImageOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;

    setIsDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      onDelete(id);
      toast.success("Produto excluído com sucesso!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error);
      const errorMessage =
        error?.response?.data?.message || "Erro ao excluir produto. Tente novamente.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-500 text-lg">Nenhum produto disponível.</p>
        <p className="text-gray-400 text-sm mt-2">
          Adicione um novo produto para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6">
              Nome
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6">
              Preço
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6">
              Categoria
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6">
              Estoque
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6">
              Descrição
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6">
              Imagem
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4 px-6 text-right">
              Ações
            </TableHead>
        </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell className="text-sm text-gray-900 py-4 px-6 font-medium">
                {product.name}
              </TableCell>
              <TableCell className="text-sm text-gray-900 py-4 px-6">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell className="text-sm text-gray-900 py-4 px-6">
                {product.category}
              </TableCell>
              <TableCell className="text-sm text-gray-900 py-4 px-6">
                {product.stock}
              </TableCell>
              <TableCell className="text-sm text-gray-600 py-4 px-6 max-w-xs truncate">
                {product.description || "Sem descrição"}
              </TableCell>
              <TableCell className="text-sm text-gray-900 py-4 px-6">
                {product.imageUrl ? (
                  <a
                    href={product.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                    aria-label={`Visualizar imagem de ${product.name}`}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md border border-gray-200"
                      onError={(e) => (e.currentTarget.src = "/placeholder-image.png")}
                    />
                  </a>
                ) : (
                  <span className="text-gray-500 flex items-center gap-1">
                    <ImageOff className="w-4 h-4" />
                    Sem imagem
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm py-4 px-6 text-right">
                <TooltipProvider>
                  <div className="flex justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(product)}
                          className="flex items-center gap-1 text-gray-700 hover:bg-blue-50"
                          aria-label={`Editar ${product.name}`}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Editar produto {product.name}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          disabled={isDeleting === product.id}
                          className={cn(
                            "flex items-center gap-1",
                            isDeleting === product.id && "opacity-50 cursor-not-allowed"
                          )}
                          aria-label={`Excluir ${product.name}`}
                        >
                          {isDeleting === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Excluir
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Excluir produto {product.name}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}