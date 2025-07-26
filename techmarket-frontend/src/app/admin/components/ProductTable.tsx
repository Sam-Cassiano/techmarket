"use client";

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, ImageOff, Loader2 } from "lucide-react";

import { Product } from "@/lib/schema";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
}

function ConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirmar exclusão</h2>
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir este produto?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductTable({ products, onEdit }: ProductTableProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleDelete = useCallback(async (id: number) => {
    setIsDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success("Produto excluído com sucesso!", { autoClose: 3000 });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao excluir produto.";
      toast.error(msg, { autoClose: 5000 });
    } finally {
      setIsDeleting(null);
      setPendingDeleteId(null);
    }
  }, [queryClient]);

  if (products.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow border border-gray-200">
        <p className="text-gray-500 text-lg font-medium">Nenhum produto disponível.</p>
        <p className="text-gray-400 text-sm mt-2">Adicione um novo produto para começar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              {["Nome", "Preço", "Categoria", "Estoque", "Descrição", "Imagem", "Ações"].map(
                (header) => (
                  <TableHead
                    key={header}
                    className={cn(
                      "px-6 py-4 text-sm font-semibold text-gray-700",
                      header === "Ações" && "text-right"
                    )}
                  >
                    {header}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="px-6 py-4 text-sm font-medium text-gray-900">
                  {product.name}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-900">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-900">{product.category}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-900">{product.stock}</TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {product.description || "Sem descrição"}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-900">
                  {product.imageUrl ? (
                    <a
                      href={product.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visualizar imagem de ${product.name}`}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.png";
                        }}
                      />
                    </a>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <ImageOff className="w-4 h-4" />
                      Sem imagem
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-right">
                  <TooltipProvider>
                    <div className="flex justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(product)}
                            className="flex items-center gap-1"
                            aria-label={`Editar ${product.name}`}
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar {product.name}</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPendingDeleteId(product.id)}
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
                        <TooltipContent>Excluir {product.name}</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pendingDeleteId !== null && (
        <ConfirmDialog
          onConfirm={() => handleDelete(pendingDeleteId)}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}
