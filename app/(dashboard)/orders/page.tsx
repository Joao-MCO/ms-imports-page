"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Select } from "@/components/ui";
import { OrderTable } from "@/components/orders/OrderTable";
import { OrderFormData } from "@/components/orders/OrderModal";
import { PAYMENT_METHODS, PaymentMethod } from "@/components/orders/PaymentModal";
import { getApiErrorMessage } from "@/lib/api";

interface Order {
  id: string;
  orderNumber: number | null;
  clientId: string;
  clientName: string;
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number }>;
  discount: number;
  totalPrice: number;
  status: "OPENED" | "PAID" | "DISCARDED";
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; stock: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (paymentFilter !== "ALL") params.append("paymentMethod", paymentFilter);

      const [ordersRes, clientsRes, productsRes] = await Promise.all([
        fetch(`/api/orders?${params.toString()}`, { credentials: "include" }),
        fetch("/api/clients", { credentials: "include" }),
        fetch("/api/products", { credentials: "include" }),
      ]);

      if (!ordersRes.ok || !clientsRes.ok || !productsRes.ok) {
        throw new Error("Erro ao buscar dados");
      }

      const ordersData = await ordersRes.json();
      const clientsData = await clientsRes.json();
      const productsData = await productsRes.json();

      setOrders(ordersData.data || []);
      setClients(clientsData.data || []);
      setProducts(productsData.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, paymentFilter]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, [fetchData]);

  const handleCreate = async (data: OrderFormData & { allowOutOfStock?: boolean }) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao criar pedido"));
  };

  const handleUpdate = async (id: string, data: Partial<OrderFormData> & { allowOutOfStock?: boolean }) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao atualizar pedido"));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Erro ao excluir pedido"));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus pedidos de venda</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Pedido
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-52 flex-shrink-0">
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
        <div className="w-full sm:w-64 flex-shrink-0">
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

      <OrderTable
        data={orders}
        isLoading={isLoading}
        clients={clients}
        products={products}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={fetchData}
        isCreateModalOpen={isCreateModalOpen}
        onCreateModalOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}