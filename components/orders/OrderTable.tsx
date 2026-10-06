"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button, DataTable, StatusBadge, ConfirmModal, useToast } from "@/components/ui";
import { OrderModal, OrderFormData } from "./OrderModal";
import { PaymentModal, PaymentMethod, PAYMENT_METHOD_LABELS } from "./PaymentModal";
import { ReceiptModal } from "./ReceiptModal";

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

interface OrderTableProps {
  data: Order[];
  isLoading: boolean;
  clients: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; price: number; stock: number }>;
  onCreate: (data: OrderFormData & { allowOutOfStock?: boolean }) => Promise<void>;
  onUpdate: (id: string, data: Partial<OrderFormData> & { allowOutOfStock?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  isCreateModalOpen: boolean;
  onCreateModalOpenChange: (open: boolean) => void;
}

function createOrdersColumns(
  onEdit: (order: Order) => void,
  onDelete: (id: string) => void,
  onPay: (order: Order) => void,
  onPrint: (order: Order) => void
) {
  return [
    {
      id: "orderNumber",
      header: "Nº",
      cell: (row: Order) => (
        <span className="text-xs text-gray-500">{row.orderNumber ? `#${String(row.orderNumber).padStart(4, "0")}` : "—"}</span>
      ),
      sortable: true,
    },
  {
    id: "clientName",
    header: "Cliente",
    cell: (row: Order) => <span className="font-medium">{row.clientName}</span>,
    sortable: true,
  },
  {
    id: "items",
    header: "Produto",
    cell: (row: Order) => {
      if (row.items.length === 0) return <span className="text-gray-400">—</span>;
      if (row.items.length === 1) return <span>{row.items[0].productName}</span>;
      return (
        <span>
          {row.items[0].productName} <span className="text-gray-400">+{row.items.length - 1} outro(s)</span>
        </span>
      );
    },
  },
  {
    id: "discount",
    header: "Desc. (%)",
    cell: (row: Order) => <span className="text-center">{row.discount.toFixed(2)}%</span>,
    sortable: true,
  },
  {
    id: "totalPrice",
    header: "Total",
    cell: (row: Order) => <span className="font-semibold">R$ {row.totalPrice.toFixed(2)}</span>,
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (row: Order) => <StatusBadge status={row.status} />,
    sortable: true,
  },
  {
    id: "paymentMethod",
    header: "Pagamento",
    cell: (row: Order) =>
      row.paymentMethod ? (
        <span className="text-sm">{PAYMENT_METHOD_LABELS[row.paymentMethod]}</span>
      ) : (
        <span className="text-gray-400">—</span>
      ),
  },
  {
    id: "createdAt",
    header: "Data",
    cell: (row: Order) => <span className="text-sm text-gray-500">{format(new Date(row.createdAt), "dd/MM/yyyy HH:mm")}</span>,
    sortable: true,
  },
  {
    id: "actions",
    header: "Ações",
    cell: (row: Order) => (
      <div className="flex items-center gap-2">
        {row.status === "PAID" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => onPrint(row)}
            aria-label="Imprimir recibo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h12z" />
            </svg>
          </Button>
        )}
        {row.status === "OPENED" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            onClick={() => onPay(row)}
            aria-label="Registrar pagamento"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={() => onEdit(row)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(row.id)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    ),
  },
];
}

export function OrderTable({
  data,
  isLoading,
  clients,
  products,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  isCreateModalOpen,
  onCreateModalOpenChange,
}: OrderTableProps) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  const handleCreate = async (formData: OrderFormData & { allowOutOfStock?: boolean }) => {
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      onCreateModalOpenChange(false);
      onRefresh();
      toastSuccess("Pedido criado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao criar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: OrderFormData & { allowOutOfStock?: boolean }) => {
    if (!editingOrder) return;
    setIsSubmitting(true);
    try {
      await onUpdate(editingOrder.id, formData);
      setIsEditModalOpen(false);
      setEditingOrder(null);
      onRefresh();
      toastSuccess("Pedido atualizado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao atualizar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingOrderId(id);
    setIsDeleteModalOpen(true);
  };

  const handlePay = (order: Order) => {
    setPayingOrder(order);
  };

  const handlePrint = (order: Order) => {
    setReceiptOrder(order);
  };

  const confirmPay = async (method: PaymentMethod) => {
    if (!payingOrder) return;
    setIsSubmitting(true);
    try {
      await onUpdate(payingOrder.id, { status: "PAID", paymentMethod: method });
      setPayingOrder(null);
      onRefresh();
      toastSuccess("Pagamento registrado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao registrar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingOrderId) return;
    setIsSubmitting(true);
    try {
      await onDelete(deletingOrderId);
      setIsDeleteModalOpen(false);
      setDeletingOrderId(null);
      onRefresh();
      toastSuccess("Pedido descartado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao excluir pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createOrdersColumns(handleEdit, handleDelete, handlePay, handlePrint);

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchKey={(row) => `${row.clientName} ${row.items.map((i) => i.productName).join(" ")} ${row.id}`}
        searchPlaceholder="Buscar por cliente, produto"
        pageSize={10}
      />

{isCreateModalOpen && (
        <OrderModal
          isOpen={isCreateModalOpen}
          onClose={() => onCreateModalOpenChange(false)}
          onSubmit={handleCreate}
          clients={clients}
          products={products}
          title="Novo Pedido"
          isLoading={isSubmitting}
        />
      )}

      {editingOrder && (
        <OrderModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingOrder(null);
          }}
          onSubmit={handleUpdate}
          clients={clients}
          products={products}
          initialData={{
            clientId: editingOrder.clientId,
            items: editingOrder.items,
            discount: editingOrder.discount,
            status: editingOrder.status,
            paymentMethod: editingOrder.paymentMethod ?? undefined,
          }}
          title="Editar Pedido"
          isLoading={isSubmitting}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Descartar Pedido"
        message="Tem certeza que deseja descartar este pedido? Ele ficará marcado como descartado na lista."
        confirmText="Descartar"
        variant="danger"
        isLoading={isSubmitting}
      />

      {payingOrder && (
        <PaymentModal
          isOpen={Boolean(payingOrder)}
          onClose={() => setPayingOrder(null)}
          onConfirm={confirmPay}
          isLoading={isSubmitting}
        />
      )}

      {receiptOrder && (
        <ReceiptModal
          isOpen={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
        />
      )}
    </>
  );
}