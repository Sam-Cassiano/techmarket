import { z } from "zod";

// ========================
// Produto
// ========================
export const productSchema = z.object({
  name: z.string()
    .min(1, "O nome é obrigatório")
    .max(100, "Máximo de 100 caracteres"),

  price: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "O preço deve ser um número" })
      .refine((val) => !isNaN(val), { message: "Preço inválido" })
      .positive("O preço deve ser maior que zero")
      .max(1_000_000, "Preço muito alto")
  ),

  category: z.string()
    .min(1, "A categoria é obrigatória")
    .max(50, "Máximo de 50 caracteres"),

  stock: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "O estoque deve ser um número inteiro" })
      .refine((val) => !isNaN(val), { message: "Estoque inválido" })
      .int("O estoque deve ser inteiro")
      .nonnegative("O estoque deve ser zero ou positivo")
      .max(100_000, "Estoque muito alto")
  ),

  description: z.string()
    .max(500, "Máximo de 500 caracteres")
    .optional(),

  imageUrl: z.string()
    .url("URL inválida")
    .max(255, "URL muito longa")
    .optional(),
});

export type Product = z.infer<typeof productSchema> & {
  id?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// ========================
// Item de Venda
// ========================
export const saleItemSchema = z.object({
  productId: z.preprocess(
    (val) => Number(val),
    z.number().int().positive({ message: "ID do produto inválido" })
      .refine((val) => !isNaN(val), { message: "ID inválido" })
  ),

  name: z.string().min(1, "Nome do produto obrigatório"),

  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Preço deve ser positivo")
      .refine((val) => !isNaN(val), { message: "Preço inválido" })
  ),

  quantity: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Quantidade deve ser positiva")
      .refine((val) => !isNaN(val), { message: "Quantidade inválida" })
  ),
});

export type SaleItem = z.infer<typeof saleItemSchema>;

// ========================
// Venda
// ========================
export const saleSchema = z.object({
  id: z.preprocess(
    (val) => Number(val),
    z.number().int().positive()
      .refine((val) => !isNaN(val), { message: "ID inválido" })
  ),

  userId: z.preprocess(
    (val) => Number(val),
    z.number().int().positive()
      .refine((val) => !isNaN(val), { message: "User ID inválido" })
  ),

  client: z.string().min(1, "Nome do cliente obrigatório"),

  total: z.preprocess(
    (val) => Number(val),
    z.number().positive("Total deve ser maior que zero")
      .refine((val) => !isNaN(val), { message: "Total inválido" })
  ),

  paymentMethod: z.enum(["credit_card", "debit_card", "cash", "pix"], {
    errorMap: () => ({ message: "Método de pagamento inválido" }),
  }),

  createdAt: z.union([z.date(), z.string()])
    .transform((val) => new Date(val)),

  updatedAt: z.union([z.date(), z.string()])
    .transform((val) => new Date(val)),

  items: z.array(saleItemSchema)
    .min(1, "A venda deve conter ao menos um item"),
});

export type Sale = z.infer<typeof saleSchema> & {
  user?: { id: number; username: string };
};

// ========================
// Login
// ========================
export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginForm = z.infer<typeof loginSchema>;

// ========================
// Registro
// ========================
export const registerSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type RegisterForm = z.infer<typeof registerSchema>;

// ========================
// Filtro de Produtos
// ========================
export const filterSchema = z.object({
  search: z.string().max(100, "Busca muito longa").optional(),

  category: z.string().max(50).optional(),

  minPrice: z.union([z.string(), z.number()])
    .transform((val) => {
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    })
    .refine((val) => val === undefined || val >= 0, {
      message: "Preço mínimo inválido",
    })
    .optional(),

  maxPrice: z.union([z.string(), z.number()])
    .transform((val) => {
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    })
    .refine((val) => val === undefined || val >= 0, {
      message: "Preço máximo inválido",
    })
    .optional(),
});

// Exportação do schema e tipo para criação de venda
export const createSaleSchema = z.object({
  client: z.string().min(1, "Nome do cliente obrigatório"),
  total: z.preprocess(
    (val) => Number(val),
    z.number().positive("Total deve ser maior que zero")
  ),
  paymentMethod: z.enum(["credit_card", "debit_card", "pix"], {
    errorMap: () => ({ message: "Método de pagamento inválido" }),
  }),
  items: z.array(saleItemSchema).min(1, "A venda deve conter ao menos um item"),
});

export type CreateSaleForm = z.infer<typeof createSaleSchema>;

