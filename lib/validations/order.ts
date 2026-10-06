import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório"),
  quantity: z.coerce.number().int().min(1, "Quantidade deve ser pelo menos 1"),
  unitPrice: z.coerce.number().min(0, "Preço unitário não pode ser negativo"),
});

export const PAYMENT_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const orderCreateSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um produto"),
  discount: z.coerce.number().min(0, "Desconto não pode ser negativo").max(100, "Desconto não pode ser maior que 100%").default(0),
  status: z.enum(["OPENED", "PAID", "DISCARDED"]).default("OPENED"),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  allowOutOfStock: z.boolean().optional(),
});

export const orderUpdateSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").optional(),
  items: z.array(orderItemSchema).min(1, "Adicione pelo menos um produto").optional(),
  discount: z.coerce.number().min(0, "Desconto não pode ser negativo").max(100, "Desconto não pode ser maior que 100%").optional(),
  status: z.enum(["OPENED", "PAID", "DISCARDED"]).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  allowOutOfStock: z.boolean().optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["OPENED", "PAID", "DISCARDED", "ALL"]).default("ALL"),
  paymentMethod: z.enum([...PAYMENT_METHODS, "ALL"]).default("ALL"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "totalPrice", "status", "orderNumber"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;