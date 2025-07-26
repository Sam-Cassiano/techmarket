"use client";

import { useState, useEffect, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCart } from "@/lib/CartProvider";
import { CheckoutForm } from "./CheckoutForm";
import { checkCartStock, formatCurrency } from "@/lib/utils";

export function CartTable() {
  const { cart, removeFromCart, clearCart } = useCart();
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [isStockValid, setIsStockValid] = useState(true);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

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
          toast.error("Estoque insuficiente para um ou mais produtos.");
        }
      } catch (error) {
        console.error("Erro ao verificar estoque:", error);
        toast.error("Erro ao verificar estoque.");
        setIsStockValid(false);
      } finally {
        setIsCheckingStock(false);
      }
    };

    validateStock();
  }, [cart]);

  const handleClearCart = () => {
    if (window.confirm("Tem certeza que deseja limpar o carrinho?")) {
      clearCart();
    }
  };

  if (cart.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Seu carrinho está vazio.
      </p>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Carrinho</h2>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleClearCart}>
            Limpar Carrinho
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={isCheckingStock || !isStockValid}>
                {isCheckingStock ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verificando estoque...
                  </>
                ) : !isStockValid ? (
                  "Estoque insuficiente"
                ) : (
                  "Finalizar Compra"
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar Compra</DialogTitle>
              </DialogHeader>
              <CheckoutForm cart={cart} clearCart={clearCart} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cart.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{formatCurrency(item.price)}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                {formatCurrency(item.price * item.quantity)}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => {
                    removeFromCart(item.id);
                    toast.info(`${item.name} removido do carrinho.`);
                  }}
                >
                  Remover
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 text-right">
        <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
      </div>
    </div>
  );
}
