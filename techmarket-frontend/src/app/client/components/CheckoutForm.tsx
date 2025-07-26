"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createSaleSchema,
  CreateSaleForm,
} from "@/lib/schema";
import { useAuth } from "@/lib/AuthProvider";
import { checkCartStock, formatCurrency } from "@/lib/utils";
import api from "@/services/api";

interface CheckoutFormProps {
  cart: {
    id: number;
    name: string;
    price: number;
    category: string;
    quantity: number;
  }[];
  clearCart: () => void;
}

export function CheckoutForm({ cart, clearCart }: CheckoutFormProps) {
  const { user, token, isAuthReady } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [isStockValid, setIsStockValid] = useState(true);

  const totalValue = Number(
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CreateSaleForm>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      client: user?.username || "",
      total: totalValue,
      paymentMethod: "credit_card",
      items: [],
    },
  });

  useEffect(() => {
    setValue("total", totalValue);
    setValue(
      "items",
      cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))
    );
  }, [cart, totalValue, setValue]);

  useEffect(() => {
    const validateStock = async () => {
      if (cart.length === 0) {
        setIsStockValid(true);
        return;
      }

      setIsCheckingStock(true);
      try {
        const isValid = await checkCartStock(cart);
        setIsStockValid(isValid);

        if (!isValid) {
          toast.error("Alguns itens estão com estoque insuficiente.");
        }
      } catch (error) {
        console.error("Erro ao verificar estoque:", error);
        toast.error("Erro ao verificar estoque. Tente novamente.");
        setIsStockValid(false);
      } finally {
        setIsCheckingStock(false);
      }
    };

    validateStock();
  }, [cart]);

  const onSubmit = async (data: CreateSaleForm) => {
    if (!isAuthReady) {
      toast.error("Aguardando autenticação. Tente novamente em instantes.");
      return;
    }

    if (!user || !token) {
      toast.error("Você precisa estar logado para finalizar a compra.");
      router.push("/client/login");
      return;
    }

    if (!cart.length) {
      toast.error("O carrinho está vazio.");
      return;
    }

    if (!isStockValid) {
      toast.error("Estoque insuficiente. Atualize o carrinho.");
      return;
    }

    const payload = {
      client: data.client,
      total: totalValue,
      paymentMethod: data.paymentMethod,
      items: data.items,
    };

    try {
      await api.post("/sales", payload);
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Compra finalizada com sucesso!");
      clearCart();
    } catch (error: any) {
      console.error("Erro ao finalizar compra:", error);
      const message =
        error?.response?.data?.message || "Erro ao finalizar compra.";
      toast.error(message);
    }
  };

  if (!isAuthReady) {
    return (
      <p className="text-center text-muted-foreground text-sm">
        Carregando autenticação...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!user && (
        <div>
          <label className="block text-sm font-medium">Cliente</label>
          <Input {...register("client")} placeholder="Nome do cliente" />
          {errors.client && (
            <p className="text-red-500 text-sm">{errors.client.message}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Método de Pagamento</label>
        <Select
          defaultValue="credit_card"
          onValueChange={(value) =>
            setValue("paymentMethod", value as CreateSaleForm["paymentMethod"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
          </SelectContent>
        </Select>
        {errors.paymentMethod && (
          <p className="text-red-500 text-sm">
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Total</label>
        <Input type="text" value={formatCurrency(totalValue)} disabled />
        {errors.total && (
          <p className="text-red-500 text-sm">{errors.total.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={
          isSubmitting || !cart.length || isCheckingStock || !isStockValid
        }
      >
        {isSubmitting || isCheckingStock ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Finalizando...
          </>
        ) : (
          "Confirmar Compra"
        )}
      </Button>
    </form>
  );
}
