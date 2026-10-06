"use client";

import { useState } from "react";
import { Button, Input, Select, Modal, ConfirmModal } from "@/components/ui";
import { PAYMENT_METHODS, PaymentMethod } from "./PaymentModal";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormData {
  clientId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  discount: number;
  status: "OPENED" | "PAID" | "DISCARDED";
  paymentMethod?: PaymentMethod;
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderFormData & { allowOutOfStock?: boolean }) => Promise<void>;
  clients: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; price: number; stock: number }>;
  initialData?: { clientId?: string; items?: OrderItem[]; discount?: number; status?: "OPENED" | "PAID" | "DISCARDED"; paymentMethod?: PaymentMethod } | null;
  isLoading?: boolean;
  title: string;
}

export function OrderModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
  products,
  initialData,
  isLoading = false,
  title,
}: OrderModalProps) {
  const [clientId, setClientId] = useState(initialData?.clientId ?? "");
  const [items, setItems] = useState<OrderItem[]>(
    initialData?.items
      ? initialData.items.map((i) => ({
          ...i,
          productName: products.find((p) => p.id === i.productId)?.name ?? i.productName,
        }))
      : []
  );
  const [discount, setDiscount] = useState(String(initialData?.discount ?? 0));
  const [status, setStatus] = useState<"OPENED" | "PAID" | "DISCARDED">(initialData?.status ?? "OPENED");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(initialData?.paymentMethod);
  const [allowOutOfStock, setAllowOutOfStock] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [pendingAdd, setPendingAdd] = useState<{ productId: string; quantity: number } | null>(null);
  const [error, setError] = useState("");

  const addProduct = products.find((p) => p.id === addProductId);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), 100);
  const totalValue = subtotal * (1 - discountValue / 100);

  const addLine = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product || quantity < 1) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { productId, productName: product.name, quantity, unitPrice: product.price }];
    });
  };

  const removeLine = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    if (!addProductId) {
      setError("Selecione um produto");
      return;
    }
    const qty = Number(addQuantity) || 1;
    if (qty < 1) {
      setError("Quantidade inválida");
      return;
    }
    if (addProduct && qty > addProduct.stock && !allowOutOfStock) {
      setPendingAdd({ productId: addProductId, quantity: qty });
      return;
    }
    addLine(addProductId, qty);
    setAddQuantity("1");
    setError("");
  };

  const confirmPendingAdd = () => {
    if (!pendingAdd) return;
    setAllowOutOfStock(true);
    addLine(pendingAdd.productId, pendingAdd.quantity);
    setPendingAdd(null);
    setAddQuantity("1");
    setError("");
  };

  const handleSubmit = () => {
    if (!clientId) {
      setError("Selecione um cliente");
      return;
    }
    if (items.length === 0) {
      setError("Adicione pelo menos um produto");
      return;
    }
    setError("");
    onSubmit({
      clientId,
      items: items.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
      discount: discountValue,
      status,
      paymentMethod,
      allowOutOfStock,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <Select
          label="Selecionar Cliente"
          placeholder="Selecione um cliente"
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens do pedido</h3>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Produto</th>
                <th className="px-4 py-2 font-medium text-center w-20">QTDE</th>
                <th className="px-4 py-2 font-medium text-right w-32">TOTAL</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Nenhum produto adicionado
                  </td>
                </tr>
              )}
              {items.map((item, index) => (
                <tr key={item.productId} className="text-gray-900 dark:text-white">
                  <td className="px-4 py-2">{item.productName}</td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Remover ${item.productName}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-4 items-end">
          <Select
            label="Produto"
            placeholder="Selecione um produto"
            options={products.map((p) => ({ value: p.id, label: `${p.name} (estoque: ${p.stock})` }))}
            value={addProductId}
            onChange={(e) => setAddProductId(e.target.value)}
          />
          <Input
            label="QTDE"
            type="number"
            min="1"
            step="1"
            value={addQuantity}
            onChange={(e) => setAddQuantity(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={handleAddProduct} className="w-full md:w-auto">
            Adicionar
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total</span>
            <span className="font-medium text-gray-900 dark:text-white">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="discount" className="text-gray-600 dark:text-gray-400">Desconto (%)</label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="w-28 text-right"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="font-medium text-gray-700 dark:text-gray-300">Total Calculado</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>

        {initialData && (
          <>
            <Select
              label="Status"
              options={[
                { value: "OPENED", label: "Aberto" },
                { value: "PAID", label: "Pago" },
                { value: "DISCARDED", label: "Descartado" },
              ]}
              value={status}
              onChange={(e) => setStatus(e.target.value as "OPENED" | "PAID" | "DISCARDED")}
            />
            <Select
              label="Forma de Pagamento"
              placeholder="Selecione a forma de cobrança"
              options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
              value={paymentMethod ?? ""}
              onChange={(e) => setPaymentMethod((e.target.value || undefined) as PaymentMethod | undefined)}
            />
          </>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {initialData ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={pendingAdd !== null}
        onClose={() => setPendingAdd(null)}
        onConfirm={confirmPendingAdd}
        title="Estoque insuficiente"
        message={
          pendingAdd && addProduct
            ? `O produto "${addProduct.name}" tem apenas ${addProduct.stock} unidade(s) em estoque e você informou ${pendingAdd.quantity}. Deseja vender mesmo assim?`
            : ""
        }
        confirmText="Vender mesmo assim"
        variant="primary"
      />
    </Modal>
  );
}