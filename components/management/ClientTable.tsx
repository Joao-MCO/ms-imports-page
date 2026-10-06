"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Input, Modal, DataTable, ConfirmModal, useToast } from "@/components/ui";

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

interface ClientTableProps {
  data: Client[];
  isLoading: boolean;
  onCreate: (data: { name: string; email: string; phone: string; document: string; address: string }) => Promise<void>;
  onUpdate: (id: string, data: Partial<{ name: string; email: string; phone: string; document: string; address: string }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

function formatDocument(doc: string) {
  const clean = doc.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return doc;
}

function formatDocumentInput(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function createColumns(
  onEdit: (client: Client) => void,
  onDelete: (id: string) => void
): Array<{
  id: string;
  header: string;
  cell: (row: Client) => React.ReactNode;
  sortable?: boolean;
}> {
  return [
    {
      id: "name",
      header: "Nome",
      cell: (row: Client) => <span className="font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      id: "email",
      header: "Email",
      cell: (row: Client) => <span>{row.email}</span>,
      sortable: true,
    },
    {
      id: "phone",
      header: "Telefone",
      cell: (row: Client) => <span>{row.phone}</span>,
      sortable: false,
    },
    {
      id: "document",
      header: "Documento",
      cell: (row: Client) => <span className="font-mono">{formatDocument(row.document)}</span>,
      sortable: true,
    },
    {
      id: "address",
      header: "Endereço",
      cell: (row: Client) => <span className="max-w-xs truncate block">{row.address}</span>,
      sortable: false,
    },
    {
      id: "actions",
      header: "Ações",
      cell: (row: Client) => (
        <div className="flex items-center gap-2">
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

export function ClientTable({
  data,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}: ClientTableProps) {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  const handleCreate = async (formData: { name: string; email: string; phone: string; document: string; address: string }) => {
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setIsCreateModalOpen(false);
      onRefresh();
      toastSuccess("Cliente criado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao criar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: { name: string; email: string; phone: string; document: string; address: string }) => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      await onUpdate(editingClient.id, formData);
      setIsEditModalOpen(false);
      setEditingClient(null);
      onRefresh();
      toastSuccess("Cliente atualizado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao atualizar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingClientId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingClientId) return;
    setIsSubmitting(true);
    try {
      await onDelete(deletingClientId);
      setIsDeleteModalOpen(false);
      setDeletingClientId(null);
      onRefresh();
      toastSuccess("Cliente excluído com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao excluir cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createColumns(handleEdit, handleDelete);

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchKey={(row) => `${row.name} ${row.email} ${row.document} ${row.phone}`}
        searchPlaceholder="Buscar por nome, email, documento ou telefone..."
        pageSize={10}
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Cliente
          </Button>
        }
      />

      <ClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="Novo Cliente"
        isLoading={isSubmitting}
      />

      {editingClient && (
        <ClientModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingClient(null);
          }}
          onSubmit={handleUpdate}
          initialData={{
            name: editingClient.name,
            email: editingClient.email,
            phone: editingClient.phone,
            document: editingClient.document,
            address: editingClient.address,
          }}
          title="Editar Cliente"
          isLoading={isSubmitting}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; phone: string; document: string; address: string }) => Promise<void>;
  initialData?: Partial<{ name: string; email: string; phone: string; document: string; address: string }> | null;
  title: string;
  isLoading?: boolean;
}

function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  isLoading = false,
}: ClientModalProps) {
  const documentValidator = (value: string) => {
    const clean = value.replace(/\D/g, "");
    return clean.length === 11 || clean.length === 14;
  };

  const clientFormSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres"),
    email: z.string().email("Email inválido").or(z.literal("")),
    phone: z.string().min(1, "Telefone é obrigatório"),
    document: z.string().refine((value) => !value || documentValidator(value), {
      message: "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
    }),
    address: z.string().min(1, "Endereço é obrigatório").max(200, "Endereço não pode ter mais de 200 caracteres"),
  });

  type ClientFormData = z.infer<typeof clientFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialData || {},
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Telefone"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Documento (CPF/CNPJ)
          </label>
          <input
            {...register("document")}
            type="text"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            onChange={(e) => register("document").onChange({ target: { value: formatDocumentInput(e.target.value) } })}
            className={`
              w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
              ${errors.document ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"}
            `}
          />
          {errors.document && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.document.message}</p>}
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
          <textarea
            {...register("address")}
            rows={3}
            className={`
              w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
              ${errors.address ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"}
            `}
          />
          {errors.address && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialData ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}