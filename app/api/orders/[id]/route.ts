import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order, { OrderItemSerialization } from "@/models/Order";
import Client from "@/models/Client";
import Product from "@/models/Product";
import { orderUpdateSchema } from "@/lib/validations/order";
import { auth } from "@/lib/auth-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findOne({ _id: id, deletedAt: null })
      .populate("clientId", "name email phone document address")
      .populate("items.productId", "name description price stock category")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: order._id.toString(),
      orderNumber: order.orderNumber ?? null,
      clientId: order.clientId._id.toString(),
      client: order.clientId,
      items: Array.isArray(order.items) && order.items.length > 0
        ? (order.items as OrderItemSerialization[]).map((it) => ({
            productId: String(it.productId._id ?? it.productId),
            product: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        : order.productId
          ? [{
              productId: (order.productId._id ?? order.productId).toString(),
              product: order.productId,
              quantity: order.quantity,
              unitPrice: order.unitPrice,
            }]
          : [],
      discount: order.discount,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentMethod: order.paymentMethod ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const body = await request.json();
    const validatedData = orderUpdateSchema.parse(body);

    const order = await Order.findOne({ _id: id, deletedAt: null });
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (validatedData.clientId) {
      const client = await Client.findOne({ _id: validatedData.clientId, deletedAt: null });
      if (!client) {
        return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      }
    }

    const oldItems: Array<{ productId: string; quantity: number; unitPrice: number }> =
      Array.isArray(order.items) && order.items.length > 0
        ? (order.items as OrderItemSerialization[]).map((it) => ({
            productId: String(it.productId._id ?? it.productId),
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        : order.productId
          ? [{ productId: order.productId.toString(), quantity: order.quantity, unitPrice: order.unitPrice }]
          : [];

    if (validatedData.items) {
      const products = await Product.find({ _id: { $in: validatedData.items.map((i) => i.productId) }, deletedAt: null });
      const productById = new Map(products.map((p) => [p._id.toString(), p]));

      for (const item of validatedData.items) {
        const product = productById.get(item.productId);
        if (!product) {
          return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
        }
        if (product.stock < item.quantity && !validatedData.allowOutOfStock) {
          return NextResponse.json({ error: `Estoque insuficiente: ${product.name} (tem ${product.stock})` }, { status: 400 });
        }
      }

      await Product.bulkWrite(
        oldItems.map((it) => ({
          updateOne: { filter: { _id: it.productId }, update: { $inc: { stock: it.quantity } } },
        }))
      );
      await Product.bulkWrite(
        validatedData.items.map((item) => ({
          updateOne: { filter: { _id: item.productId }, update: { $inc: { stock: -item.quantity } } },
        }))
      );
    }

    const itemsToUse =
      validatedData.items ??
      oldItems.map((it) => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice }));
    const discountToUse = validatedData.discount !== undefined ? validatedData.discount : order.discount;
    const subtotal = itemsToUse.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const totalPrice = subtotal * (1 - discountToUse / 100);

    const updateData: Record<string, unknown> = { totalPrice };
    if (validatedData.clientId) updateData.clientId = validatedData.clientId;
    if (validatedData.items) updateData.items = validatedData.items;
    if (validatedData.discount !== undefined) updateData.discount = validatedData.discount;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.paymentMethod !== undefined) updateData.paymentMethod = validatedData.paymentMethod;

    const updatedOrder = await Order.findOneAndUpdate({ _id: id, deletedAt: null }, updateData, { returnDocument: "after" })
      .populate("clientId", "name email")
      .populate("items.productId", "name price");

    return NextResponse.json({
      id: updatedOrder!._id.toString(),
      orderNumber: updatedOrder!.orderNumber ?? null,
      clientId: updatedOrder!.clientId._id.toString(),
      clientName: updatedOrder!.clientId.name,
      items: (updatedOrder!.items as OrderItemSerialization[]).map((it) => ({
        productId: String(it.productId._id ?? it.productId),
        productName: it.productId.name ?? "Produto",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      discount: updatedOrder!.discount,
      totalPrice: updatedOrder!.totalPrice,
      status: updatedOrder!.status,
      paymentMethod: updatedOrder!.paymentMethod ?? null,
      createdAt: updatedOrder!.createdAt,
      updatedAt: updatedOrder!.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string>> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findOneAndUpdate(
      { _id: id },
      { status: "DISCARDED", },
      { returnDocument: "after" }
    );
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Pedido descartado com sucesso" });
  } catch (error) {
    console.error("Erro ao descartar pedido:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}