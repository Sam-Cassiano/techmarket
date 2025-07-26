import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.preprocess(
    (val) => Number(val),
    z.number()
      .refine((val) => !isNaN(val), { message: "ID do produto inválido" })
      .int()
      .positive("ID do produto inválido")
  ),
  name: z.string().min(1, "Nome do produto obrigatório"),
  price: z.preprocess(
    (val) => Number(val),
    z.number()
      .refine((val) => !isNaN(val), { message: "Preço inválido" })
      .positive("Preço deve ser positivo")
  ),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number()
      .refine((val) => !isNaN(val), { message: "Quantidade inválida" })
      .int()
      .positive("Quantidade deve ser positiva")
  ),
});

export const createSaleSchema = z.object({
  client: z.string().min(1, "Nome do cliente obrigatório"),
  total: z.preprocess(
    (val) => Number(val),
    z.number()
      .refine((val) => !isNaN(val), { message: "Total inválido" })
      .positive("Total deve ser maior que zero")
  ),
  paymentMethod: z.enum(["credit_card", "debit_card", "pix"], {
    errorMap: () => ({ message: "Método de pagamento inválido" }),
  }),
  items: z.array(saleItemSchema).min(1, "A venda deve conter ao menos um item"),
});

export type CreateSaleForm = z.infer<typeof createSaleSchema>;
