"use client";

import { format } from "date-fns";
import { Button, Modal } from "@/components/ui";
import { PAYMENT_METHOD_LABELS, PaymentMethod } from "./PaymentModal";

interface ReceiptOrder {
  orderNumber: number | null;
  clientName: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
  discount: number;
  totalPrice: number;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReceiptOrder;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  const subtotal = order.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recibo do Pedido" size="sm" showCloseButton={false} closeOnOverlayClick={false}>
      <div className="space-y-3">
        <div className="print-receipt bg-white text-gray-900 rounded-lg p-6 border border-gray-200 space-y-4">
          <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-4">
            <h2 className="text-xl font-bold tracking-wide">MS Imports</h2>
            <p className="text-sm text-gray-600">Comprovante de Venda</p>
            <p className="text-sm text-gray-600">
              Nº {order.orderNumber ? String(order.orderNumber).padStart(4, "0") : "—"}
            </p>
            <p className="text-sm text-gray-600">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-semibold">Cliente</p>
            <p className="text-gray-700">{order.clientName}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-dashed border-gray-300">
                <th className="text-left font-medium pb-1">Produto</th>
                <th className="text-center font-medium pb-1">Qtd</th>
                <th className="text-right font-medium pb-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-dotted border-gray-200">
                  <td className="py-1">{item.productName}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-sm border-t border-dashed border-gray-300 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Desconto</span>
              <span>{order.discount.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span>R$ {order.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span>Forma de pagamento</span>
              <span>{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span>Pago</span>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 border-t border-dashed border-gray-300 pt-3">
            Obrigado pela preferência!
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => window.print()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h12z" />
            </svg>
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  );
}