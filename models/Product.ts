import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Descrição não pode ter mais de 500 caracteres"],
    },
    price: {
      type: Number,
      required: [true, "Preço é obrigatório"],
      min: [0, "Preço não pode ser negativo"],
    },
    stock: {
      type: Number,
      required: [true, "Estoque é obrigatório"],
      min: [0, "Estoque não pode ser negativo"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Categoria é obrigatória"],
      trim: true,
      maxlength: [50, "Categoria não pode ter mais de 50 caracteres"],
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

productSchema.index({ name: "text", description: "text", category: "text" });

export default mongoose.models.Product || mongoose.model("Product", productSchema);