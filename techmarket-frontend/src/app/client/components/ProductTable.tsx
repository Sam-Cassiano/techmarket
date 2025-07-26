
"use client";

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
import { useCart } from "@/lib/CartProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const { addToCart, cart } = useCart();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getAvailableStock = (product: Product) => {
    const cartItem = cart.find((item) => item.id === product.id);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    return product.stock - cartQuantity;
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Produtos</h2>
      {products.length === 0 ? (
        <p className="text-center text-muted-foreground">
          Nenhum produto disponível.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Disponível</TableHead>
              <TableHead>Imagem</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const availableStock = getAvailableStock(product);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{availableStock}</TableCell>
                  <TableCell>
                    {product.imageUrl ? (
                      <a
                        href={product.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-image.png";
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() =>
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                category: product.category,
                                quantity: 1,
                              })
                            }
                            disabled={availableStock <= 0}
                          >
                            {availableStock <= 0 ? "Esgotado" : "Adicionar"}
                          </Button>
                        </TooltipTrigger>
                        {availableStock <= 0 && (
                          <TooltipContent>
                            Estoque esgotado ou limite atingido no carrinho.
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
