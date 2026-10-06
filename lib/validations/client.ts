import { z } from "zod";

const documentValidator = (value: string) => {
  const clean = value.replace(/\D/g, "");
  return clean.length === 11 || clean.length === 14;
};

const emptyToUndefined = (schema: z.ZodType<string>) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional()
  );

const emailSchema = z.string().email("Email inválido");
const documentSchema = z.string().refine(documentValidator, {
  message: "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
});

export const clientCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres"),
  email: emptyToUndefined(emailSchema),
  phone: z.string().min(1, "Telefone é obrigatório"),
  document: emptyToUndefined(documentSchema),
  address: z.string().min(1, "Endereço é obrigatório").max(200, "Endereço não pode ter mais de 200 caracteres"),
});

export const clientUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres").optional(),
  email: emptyToUndefined(emailSchema),
  phone: z.string().min(1, "Telefone é obrigatório").optional(),
  document: emptyToUndefined(documentSchema),
  address: z.string().min(1, "Endereço é obrigatório").max(200, "Endereço não pode ter mais de 200 caracteres").optional(),
});

export const clientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;