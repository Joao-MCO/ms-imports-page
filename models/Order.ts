import mongoose, { Document, Schema, Types } from "mongoose";

export type OrderStatus = "OPENED" | "PAID" | "DISCARDED";

export type PaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO" | "OTHER";

export const PAYMENT_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "BOLETO", "OTHER"] as const;

export interface IOrderItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  _id: Types.ObjectId;
}

export interface OrderItemSerialization {
  productId: {
    _id?: { toString(): string } | null;
    name?: string;
  };
  quantity: number;
  unitPrice: number;
}

export interface IOrder extends Document {
  clientId: Types.ObjectId;
  items: IOrderItem[];
  discount: number;
  totalPrice: number;
  status: OrderStatus;
  orderNumber: number;
  paymentMethod: PaymentMethod | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Cliente é obrigatório"],
    },
    items: {
      type: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Produto é obrigatório"],
          },
          quantity: {
            type: Number,
            required: [true, "Quantidade é obrigatória"],
            min: [1, "Quantidade deve ser pelo menos 1"],
          },
          unitPrice: {
            type: Number,
            required: [true, "Preço unitário é obrigatório"],
            min: [0, "Preço unitário não pode ser negativo"],
          },
        },
      ],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "O pedido deve ter pelo menos um produto",
      },
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Desconto não pode ser negativo"],
      max: [100, "Desconto não pode ser maior que 100%"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Preço total é obrigatório"],
      min: [0, "Preço total não pode ser negativo"],
    },
    status: {
      type: String,
      enum: ["OPENED", "PAID", "DISCARDED"],
      default: "OPENED",
    },
    orderNumber: {
      type: Number,
      unique: true,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: null,
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

orderSchema.index({ clientId: 1, createdAt: -1 });
orderSchema.index({ "items.productId": 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);