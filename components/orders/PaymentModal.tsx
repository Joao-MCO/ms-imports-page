"use client";

import { useState } from "react";
import { Button, Modal, Select } from "@/components/ui";

export const PAYMENT_METHODS = [
  { value: "PIX", label: "PIX" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "CASH", label: "Dinheiro" },
  { value: "BOLETO", label: "Boleto" },
  { value: "OTHER", label: "Outro" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
) as Record<PaymentMethod, string>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  isLoading?: boolean;
}

export function PaymentModal({ isOpen, onClose, onConfirm, isLoading = false }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("PIX");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receber Pagamento" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Selecione a forma de cobrança para registrar o pagamento deste pedido.
        </p>
        <Select
          label="Forma de Cobrança"
          options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(method)} isLoading={isLoading}>
            Confirmar Pagamento
          </Button>
        </div>
      </div>
    </Modal>
  );
}