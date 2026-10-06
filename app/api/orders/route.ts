import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order, { OrderItemSerialization } from "@/models/Order";
import { getNextSequence } from "@/models/Counter";
import Client from "@/models/Client";
import Product from "@/models/Product";
import { orderCreateSchema, orderQuerySchema } from "@/lib/validations/order";
import { auth } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = orderQuerySchema.parse(Object.fromEntries(searchParams));

    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.search) {
      filter.$or = [
        { "client.name": { $regex: query.search, $options: "i" } },
        { "product.name": { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }

    if (query.paymentMethod && query.paymentMethod !== "ALL") {
      filter.paymentMethod = query.paymentMethod;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {} as { $gte?: Date; $lte?: Date };
      if (query.startDate) (filter.createdAt as { $gte?: Date }).$gte = new Date(query.startDate);
      if (query.endDate) (filter.createdAt as { $lte?: Date }).$lte = new Date(query.endDate);
    }

    const sort: Record<string, 1 | -1> = {};
    sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("clientId", "name email")
        .populate("items.productId", "name price")
        .sort(sort)
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const formattedOrders = orders.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber ?? null,
      clientId: order.clientId._id.toString(),
      clientName: order.clientId.name,
      items: Array.isArray(order.items) && order.items.length > 0
        ? (order.items as OrderItemSerialization[]).map((it) => ({
            productId: String(it.productId._id ?? it.productId),
            productName: it.productId.name ?? "Produto",
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        : order.productId
          ? [{
              productId: (order.productId._id ?? order.productId).toString(),
              productName: order.productId.name ?? "Produto",
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
    }));

    return NextResponse.json({
      data: formattedOrders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validatedData = orderCreateSchema.parse(body);

    const [client, products] = await Promise.all([
      Client.findOne({ _id: validatedData.clientId, deletedAt: null }),
      Product.find({ _id: { $in: validatedData.items.map((i) => i.productId) }, deletedAt: null }),
    ]);

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

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

    const subtotal = validatedData.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const totalPrice = subtotal * (1 - validatedData.discount / 100);

    await Product.bulkWrite(
      validatedData.items.map((item) => ({
        updateOne: { filter: { _id: item.productId }, update: { $inc: { stock: -item.quantity } } },
      }))
    );

    const orderNumber = await getNextSequence("order");

    const order = await Order.create({
      clientId: validatedData.clientId,
      items: validatedData.items,
      discount: validatedData.discount,
      status: validatedData.status,
      paymentMethod: validatedData.paymentMethod ?? null,
      totalPrice,
      orderNumber,
    });

    await order.populate("clientId", "name email");
    await order.populate("items.productId", "name price");

    return NextResponse.json(
      {
        id: order._id.toString(),
        clientId: order.clientId._id.toString(),
        clientName: order.clientId.name,
        orderNumber: order.orderNumber ?? null,
        items: (order.items as OrderItemSerialization[]).map((it) => ({
          productId: String(it.productId._id ?? it.productId),
          productName: it.productId.name ?? "Produto",
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        discount: order.discount,
        totalPrice: order.totalPrice,
        status: order.status,
        paymentMethod: order.paymentMethod ?? null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
