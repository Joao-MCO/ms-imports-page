import mongoose, { Document, Schema } from "mongoose";

export interface IClient extends Document {
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
    },
    phone: {
      type: String,
      required: [true, "Telefone é obrigatório"],
      trim: true,
    },
    document: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          const clean = v.replace(/\D/g, "");
          return clean.length === 11 || clean.length === 14;
        },
        message: "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
      },
    },
    address: {
      type: String,
      required: [true, "Endereço é obrigatório"],
      trim: true,
      maxlength: [200, "Endereço não pode ter mais de 200 caracteres"],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ name: "text", email: "text", document: "text" });

export default mongoose.models.Client || mongoose.model("Client", clientSchema);