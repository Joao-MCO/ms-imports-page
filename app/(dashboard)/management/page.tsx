"use client";

import { useState, useEffect, useCallback } from "react";
import { DateRangePicker, StatCard, Card, Select } from "@/components/ui";
import { DailyOrdersChart, RevenueChart, TopProductsChartV2, StatusDistributionChart } from "@/components/management/DashboardCharts";
import { ProductTable } from "@/components/management/ProductTable";
import { ClientTable } from "@/components/management/ClientTable";
import { UserTable } from "@/components/management/UserTable";
import { PAYMENT_METHODS } from "@/components/orders/PaymentModal";
import { getApiErrorMessage } from "@/lib/api";

interface DashboardStats {
  kpis: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    conversionRate: number;
    totalClients: number;
    totalProducts: number;
  };
  charts: {
    dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
    topProducts: Array<{ name: string; totalQty: number; totalRevenue: number }>;
    statusDistribution: { OPENED: number; PAID: number; DISCARDED: number };
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  createdAt: string;
  updatedAt: string;
}

type Tab = "dashboard" | "products" | "clients" | "users";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (paymentFilter !== "ALL") params.append("paymentMethod", paymentFilter);

      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  }, [startDate, endDate, statusFilter, paymentFilter]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products?limit=100", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?limit=100", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClients(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users?limit=100", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  }, []);

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const refreshAll = () => {
    fetchStats();
    fetchProducts();
    fetchClients();
    fetchUsers();
  };

  useEffect(() => {
    const initialLoad = async () => {
      await refreshAll();
      setIsLoading(false);
    };
    initialLoad();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      await fetchStats();
    };
    loadStats();
  }, [fetchStats]);

  const handleCreateProduct = async (data: { name: string; description: string; price: number; stock: number; category: string }) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao criar produto"));
  };

  const handleUpdateProduct = async (id: string, data: Partial<{ name: string; description: string; price: number; stock: number; category: string }>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao atualizar produto"));
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao excluir produto"));
  };

  const handleCreateClient = async (data: { name: string; email: string; phone: string; document: string; address: string }) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao criar cliente"));
  };

  const handleUpdateClient = async (id: string, data: Partial<{ name: string; email: string; phone: string; document: string; address: string }>) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao atualizar cliente"));
  };

  const handleDeleteClient = async (id: string) => {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao excluir cliente"));
  };

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: "admin" | "manager" }) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao criar usuário"));
  };

  const handleUpdateUser = async (id: string, data: Partial<{ name: string; email: string; password: string; role: "admin" | "manager" }>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao atualizar usuário"));
  };

  const handleDeleteUser = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao excluir usuário"));
  };

  const categories = [...new Set(products.map((p) => p.category))];

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "products",
      label: "Produtos",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: "clients",
      label: "Clientes",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "users",
      label: "Usuários",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral e cadastros do sistema</p>
        </div>
        {activeTab === "dashboard" && (
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 w-full lg:w-auto">
            <div className="w-full lg:w-60 flex-shrink-0">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="w-full lg:w-44 flex-shrink-0">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "Todos os status" },
                  { value: "OPENED", label: "Aberto" },
                  { value: "PAID", label: "Pago" },
                  { value: "DISCARDED", label: "Descartado" },
                ]}
              />
            </div>
            <div className="w-full lg:w-56 flex-shrink-0">
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "Todas as formas de pagamento" },
                  ...PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label })),
                ]}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 px-1" aria-label="Abas de navegação">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === tab.id
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "dashboard" && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Pedidos"
              value={stats.kpis.totalOrders.toLocaleString("pt-BR")}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
            <StatCard
              title="Receita Total"
              value={`R$ ${stats.kpis.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Ticket Médio"
              value={`R$ ${stats.kpis.avgOrderValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <StatCard
              title="Taxa Conversão"
              value={`${stats.kpis.conversionRate.toFixed(1)}%`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pedidos por Dia</h3>
              <DailyOrdersChart data={stats.charts.dailyOrders} />
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Receita por Dia</h3>
              <RevenueChart data={stats.charts.dailyOrders} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 5 Produtos</h3>
              <TopProductsChartV2 data={stats.charts.topProducts} />
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição de Status</h3>
              <StatusDistributionChart data={stats.charts.statusDistribution} />
            </Card>
          </div>
        </>
      )}

      {activeTab === "products" && (
        <ProductTable
          data={products}
          isLoading={isLoading}
          onCreate={handleCreateProduct}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          onRefresh={fetchProducts}
          categories={categories}
        />
      )}

      {activeTab === "clients" && (
        <ClientTable
          data={clients}
          isLoading={isLoading}
          onCreate={handleCreateClient}
          onUpdate={handleUpdateClient}
          onDelete={handleDeleteClient}
          onRefresh={fetchClients}
        />
      )}

      {activeTab === "users" && (
        <UserTable
          data={users}
          isLoading={isLoading}
          onCreate={handleCreateUser}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
          onRefresh={fetchUsers}
          currentUserId=""
        />
      )}
    </div>
  );
}