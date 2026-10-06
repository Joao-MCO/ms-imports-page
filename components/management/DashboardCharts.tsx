"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend } from "recharts";
import { ChartWrapper } from "@/components/ui";

interface DailyOrdersChartProps {
  data: Array<{ date: string; orders: number; revenue: number }>;
}

export function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  if (!data.length) return null;

  const formattedData = data.map((d) => ({
    date: d.date.split("-").reverse().join("/"),
    orders: d.orders,
    revenue: d.revenue,
  }));

  return (
    <ChartWrapper height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
          labelStyle={{ color: "#374151", fontWeight: 500 }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="orders"
          name="Pedidos"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Receita (R$)"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          yAxisId="right"
        />
      </LineChart>
    </ChartWrapper>
  );
}

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length) return null;

  const formattedData = data.map((d) => ({
    date: d.date.split("-").reverse().join("/"),
    revenue: d.revenue,
  }));

  return (
    <ChartWrapper height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
          labelStyle={{ color: "#374151", fontWeight: 500 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Receita"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartWrapper>
  );
}

interface TopProductsChartProps {
  data: Array<{ name: string; totalQty: number; totalRevenue: number }>;
}

export function TopProductsChartV2({ data }: TopProductsChartProps) {
  if (!data.length) return null;

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <ChartWrapper height={300}>
      <PieChart>
        <Pie
          data={data.map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="totalQty"
          nameKey="name"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <PieTooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        />
        <PieLegend />
      </PieChart>
    </ChartWrapper>
  );
}

interface StatusDistributionChartProps {
  data: { OPENED: number; PAID: number; DISCARDED: number };
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const total = data.OPENED + data.PAID + data.DISCARDED;
  if (total === 0) return null;

  const chartData = [
    { name: "Abertos", value: data.OPENED, color: "#f59e0b" },
    { name: "Pagos", value: data.PAID, color: "#22c55e" },
    { name: "Descartados", value: data.DISCARDED, color: "#ef4444" },
  ];

  return (
    <ChartWrapper height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(1)}%`}
          labelLine={false}
        >
          {chartData.map((item, i) => (
            <Cell key={`cell-${i}`} fill={item.color} />
          ))}
        </Pie>
        <PieTooltip
          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        />
        <PieLegend />
      </PieChart>
    </ChartWrapper>
  );
}