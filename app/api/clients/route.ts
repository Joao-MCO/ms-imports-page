import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientCreateSchema, clientQuerySchema } from "@/lib/validations/client";
import { auth } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = clientQuerySchema.parse(Object.fromEntries(searchParams));

    const filter: Record<string, unknown> = { deletedAt: null };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { document: { $regex: query.search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;

    const skip = (query.page - 1) * query.limit;

    const [clients, total] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
      Client.countDocuments(filter),
    ]);

    const formattedClients = clients.map((client) => ({
      id: client._id.toString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
      address: client.address,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return NextResponse.json({
      data: formattedClients,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
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
    const validatedData = clientCreateSchema.parse(body);

    if (validatedData.document) {
      const existingClient = await Client.findOne({ document: validatedData.document });
      if (existingClient) {
        return NextResponse.json({ error: "Documento já cadastrado" }, { status: 400 });
      }
    }

    if (validatedData.email) {
      const existingEmail = await Client.findOne({ email: validatedData.email });
      if (existingEmail) {
        return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
      }
    }

    const client = await Client.create(validatedData);

    return NextResponse.json(
      {
        id: client._id.toString(),
        name: client.name,
        email: client.email,
        phone: client.phone,
        document: client.document,
        address: client.address,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
