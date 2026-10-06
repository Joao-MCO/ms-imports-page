import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres"),
  description: z.string().max(500, "Descrição não pode ter mais de 500 caracteres").optional(),
  price: z.coerce.number().min(0, "Preço não pode ser negativo"),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo").default(0),
  category: z.string().min(1, "Categoria é obrigatória").max(50, "Categoria não pode ter mais de 50 caracteres"),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres").optional(),
  description: z.string().max(500, "Descrição não pode ter mais de 500 caracteres").optional(),
  price: z.coerce.number().min(0, "Preço não pode ser negativo").optional(),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo").optional(),
  category: z.string().min(1, "Categoria é obrigatória").max(50, "Categoria não pode ter mais de 50 caracteres").optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(["createdAt", "name", "price", "stock"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;