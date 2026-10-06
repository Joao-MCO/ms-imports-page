import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Client from "@/models/Client";
import { clientUpdateSchema } from "@/lib/validations/client";
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

    const client = await Client.findOne({ _id: id, deletedAt: null }).lean();

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: client._id.toString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
      address: client.address,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
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
    const validatedData = clientUpdateSchema.parse(body);

    if (validatedData.document) {
      const existingClient = await Client.findOne({
        document: validatedData.document,
        _id: { $ne: id },
      });
      if (existingClient) {
        return NextResponse.json({ error: "Documento já cadastrado" }, { status: 400 });
      }
    }

    if (validatedData.email) {
      const existingEmail = await Client.findOne({
        email: validatedData.email,
        _id: { $ne: id },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
      }
    }

    const client = await Client.findOneAndUpdate({ _id: id, deletedAt: null }, validatedData, { returnDocument: "after" }).lean();

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: client._id.toString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      document: client.document,
      address: client.address,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
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

    const client = await Client.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { returnDocument: "after" }
    );
    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Cliente excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}