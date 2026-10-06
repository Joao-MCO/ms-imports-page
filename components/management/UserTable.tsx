"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Select, Modal, DataTable, Badge, ConfirmModal, Input, useToast } from "@/components/ui";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  createdAt: string;
  updatedAt: string;
}

interface UserTableProps {
  data: User[];
  isLoading: boolean;
  onCreate: (data: { name: string; email: string; password: string; role: "admin" | "manager" }) => Promise<void>;
  onUpdate: (id: string, data: Partial<{ name: string; email: string; password: string; role: "admin" | "manager" }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  currentUserId: string;
}

function createColumns(
  currentUserId: string,
  onEdit: (user: User) => void,
  onDelete: (id: string) => void
): Array<{
  id: string;
  header: string;
  cell: (row: User) => React.ReactNode;
  sortable?: boolean;
}> {
  return [
    {
      id: "name",
      header: "Nome",
      cell: (row: User) => <span className="font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      id: "email",
      header: "Email",
      cell: (row: User) => <span>{row.email}</span>,
      sortable: true,
    },
    {
      id: "role",
      header: "Perfil",
      cell: (row: User) => (
        <Badge variant={row.role === "admin" ? "info" : "default"}>
          {row.role === "admin" ? "Administrador" : "Gerente"}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Ações",
      cell: (row: User) => {
        const isSelf = row.id === currentUserId;
        return (
          <div className="flex items-center gap-2">
            {!isSelf && (
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
            )}
            {!isSelf && (
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
            )}
          </div>
        );
      },
    },
  ];
}

export function UserTable({
  data,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  currentUserId,
}: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  const handleCreate = async (formData: { name: string; email: string; password: string; role: "admin" | "manager" }) => {
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setIsCreateModalOpen(false);
      onRefresh();
      toastSuccess("Usuário criado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao criar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: { name: string; email: string; password?: string; role: "admin" | "manager" }) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await onUpdate(editingUser.id, formData);
      setIsEditModalOpen(false);
      setEditingUser(null);
      onRefresh();
      toastSuccess("Usuário atualizado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao atualizar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingUserId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;
    setIsSubmitting(true);
    try {
      await onDelete(deletingUserId);
      setIsDeleteModalOpen(false);
      setDeletingUserId(null);
      onRefresh();
      toastSuccess("Usuário excluído com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao excluir usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createColumns(currentUserId, handleEdit, handleDelete);

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchKey={(row) => `${row.name} ${row.email}`}
        searchPlaceholder="Buscar por nome ou email..."
        pageSize={10}
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Usuário
          </Button>
        }
      />

      <UserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="Novo Usuário"
        isLoading={isSubmitting}
        requirePassword={true}
      />

      {editingUser && (
        <UserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleUpdate}
          initialData={{
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
          }}
          title="Editar Usuário"
          isLoading={isSubmitting}
          requirePassword={false}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string; role: "admin" | "manager" }) => Promise<void>;
  initialData?: Partial<{ name: string; email: string; role: "admin" | "manager" }> | null;
  title: string;
  isLoading?: boolean;
  requirePassword?: boolean;
}

function UserModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  isLoading = false,
  requirePassword = true,
}: UserModalProps) {
const createSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    role: z.enum(["admin", "manager"]),
  });

  const updateSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    role: z.enum(["admin", "manager"]),
  });

  const schema = requirePassword ? createSchema : updateSchema;

  type UserFormData = {
    name: string;
    email: string;
    password: string;
    role: "admin" | "manager";
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "manager",
      password: "",
      ...initialData,
    },
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
          label={requirePassword ? "Senha" : "Nova Senha (opcional)"}
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Select
          label="Perfil"
          options={[
            { value: "admin", label: "Administrador" },
            { value: "manager", label: "Gerente" },
          ]}
          error={errors.role?.message}
          {...register("role")}
        />

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