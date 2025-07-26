"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/AuthProvider";
import { Sale } from "@/lib/schema";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SalesTableProps {
  sales: Sale[];
}

const paymentLabels: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  cash: "Dinheiro",
  pix: "PIX",
};

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
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Confirmar exclusão
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja excluir esta venda? Esta ação não poderá ser desfeita.
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

export function SalesTable({ sales }: SalesTableProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const filteredSales =
    user?.role === "admin"
      ? sales
      : sales.filter((sale) => sale.user?.username === user?.username);

  const formatDate = (date: Date | string) => {
    try {
      const parsed = new Date(date);
      return isNaN(parsed.getTime())
        ? "Data inválida"
        : new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(parsed);
    } catch {
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const confirmDelete = (id: number) => {
    setPendingDeleteId(id);
  };

  const handleDelete = async (id: number) => {
    if (!id || typeof id !== "number") {
      toast.error("ID inválido para exclusão.");
      return;
    }

    setIsDeleting(id);
    try {
      await api.delete(`/sales/${id}`);
      toast.success("Venda excluída com sucesso!");
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Erro ao excluir venda.";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
      setPendingDeleteId(null);
    }
  };

  if (!filteredSales.length) {
    return (
      <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-500 text-lg">Nenhuma venda disponível.</p>
        <p className="text-gray-400 text-sm mt-2">
          Registre uma nova venda para começar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Itens</TableHead>
              {user?.role === "admin" && (
                <TableHead className="text-right">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.id}</TableCell>
                <TableCell>{sale.client}</TableCell>
                <TableCell>
                  {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                </TableCell>
                <TableCell>{formatDate(sale.createdAt)}</TableCell>
                <TableCell>{formatCurrency(sale.total)}</TableCell>
                <TableCell>
                  <ul className="list-disc pl-5 space-y-1">
                    {sale.items?.map((item, index) => (
                      <li key={index} className="truncate">
                        {item.quantity}x {item.name} ({formatCurrency(item.price)})
                      </li>
                    ))}
                  </ul>
                </TableCell>
                {user?.role === "admin" && (
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(sale.id)}
                            disabled={isDeleting === sale.id}
                            className={cn(
                              "flex items-center gap-1",
                              isDeleting === sale.id && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label={`Excluir venda ID ${sale.id}`}
                          >
                            {isDeleting === sale.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Excluir
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir venda ID {sale.id}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                )}
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
