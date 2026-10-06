import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Client from "@/models/Client";
import { auth } from "@/lib/auth-config";

interface DateFilter {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

interface OrderFilter {
  deletedAt: null;
  status?: string;
  paymentMethod?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : null;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : null;
    const statusFilter = searchParams.get("status") || "ALL";
    const paymentMethodFilter = searchParams.get("paymentMethod") || "ALL";

    const dateFilter: DateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const baseOrderFilter: OrderFilter = { deletedAt: null };
    if (statusFilter !== "ALL") baseOrderFilter.status = statusFilter;
    if (paymentMethodFilter !== "ALL") baseOrderFilter.paymentMethod = paymentMethodFilter;

    const paidOrderFilter = { ...baseOrderFilter, status: "PAID" as const };

    const [totalOrders, paidOrders, totalRevenue, avgOrderValue, topProducts, statusDistribution, dailyStats] = await Promise.all([
      Order.countDocuments({ ...dateFilter, ...baseOrderFilter }),
      Order.countDocuments({ ...dateFilter, ...paidOrderFilter }),
      Order.aggregate([
        { $match: { ...dateFilter, ...paidOrderFilter } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, ...paidOrderFilter } },
        { $group: { _id: null, avg: { $avg: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, ...paidOrderFilter } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalQty: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] } },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $project: { name: "$product.name", totalQty: 1, totalRevenue: 1 } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, ...baseOrderFilter } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, ...paidOrderFilter } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalClients = await Client.countDocuments({ deletedAt: null });
    const totalProducts = await Product.countDocuments({ deletedAt: null });

    const revenue = totalRevenue[0]?.total || 0;
    const avgValue = avgOrderValue[0]?.avg || 0;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    const dailyOrders = dailyStats.map((d) => ({
      date: d._id,
      orders: d.orders,
      revenue: d.revenue,
    }));

    const statusDist = {
      OPENED: statusDistribution.find((s) => s._id === "OPENED")?.count || 0,
      PAID: statusDistribution.find((s) => s._id === "PAID")?.count || 0,
      DISCARDED: statusDistribution.find((s) => s._id === "DISCARDED")?.count || 0,
    };

    return NextResponse.json({
      kpis: {
        totalOrders,
        totalRevenue: revenue,
        avgOrderValue: avgValue,
        conversionRate,
        totalClients,
        totalProducts,
      },
      charts: {
        dailyOrders,
        topProducts,
        statusDistribution: statusDist,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

interface DateFilter {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}