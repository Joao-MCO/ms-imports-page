import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { productCreateSchema, productQuerySchema } from "@/lib/validations/product";
import { auth } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = productQuerySchema.parse(Object.fromEntries(searchParams));

    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.category) {
      filter.category = query.category;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;

    const skip = (query.page - 1) * query.limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Product.countDocuments(filter),
    ]);

    const formattedProducts = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json({
      data: formattedProducts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
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
    const validatedData = productCreateSchema.parse(body);

    const product = await Product.create(validatedData);

    return NextResponse.json(
      {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
