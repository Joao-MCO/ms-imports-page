"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button, Input, Modal, DataTable, Badge, Select, ConfirmModal, useToast } from "@/components/ui";

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

interface ProductTableProps {
  data: Product[];
  isLoading: boolean;
  onCreate: (data: { name: string; description: string; price: number; stock: number; category: string }) => Promise<void>;
  onUpdate: (id: string, data: Partial<{ name: string; description: string; price: number; stock: number; category: string }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  categories: string[];
}

function createColumns(
  categories: string[],
  onEdit: (product: Product) => void,
  onDelete: (id: string) => void
): Array<{
  id: string;
  header: string;
  cell: (row: Product) => React.ReactNode;
  sortable?: boolean;
}> {
  return [
    {
      id: "name",
      header: "Nome",
      cell: (row: Product) => <span className="font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      id: "description",
      header: "Descrição",
      cell: (row: Product) => <span className="max-w-xs truncate block">{row.description}</span>,
      sortable: false,
    },
    {
      id: "price",
      header: "Preço",
      cell: (row: Product) => <span>R$ {row.price.toFixed(2)}</span>,
      sortable: true,
    },
    {
      id: "stock",
      header: "Estoque",
      cell: (row: Product) => (
        <Badge variant={row.stock === 0 ? "danger" : row.stock < 10 ? "warning" : "success"}>
          {row.stock}
        </Badge>
      ),
      sortable: true,
    },
    {
      id: "category",
      header: "Categoria",
      cell: (row: Product) => <Badge variant="info">{row.category}</Badge>,
      sortable: true,
    },
    {
      id: "actions",
      header: "Ações",
      cell: (row: Product) => (
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

export function ProductTable({
  data,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  categories,
}: ProductTableProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const { error: toastError, success: toastSuccess } = useToast();

  const allCategories = [...new Set(categories)];

  const filteredData = categoryFilter ? data.filter((p) => p.category === categoryFilter) : data;

  const handleCreate = async (formData: { name: string; description: string; price: number; stock: number; category: string }) => {
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setIsCreateModalOpen(false);
      onRefresh();
      toastSuccess("Produto criado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao criar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (formData: { name: string; description: string; price: number; stock: number; category: string }) => {
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await onUpdate(editingProduct.id, formData);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      onRefresh();
      toastSuccess("Produto atualizado com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao atualizar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingProductId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProductId) return;
    setIsSubmitting(true);
    try {
      await onDelete(deletingProductId);
      setIsDeleteModalOpen(false);
      setDeletingProductId(null);
      onRefresh();
      toastSuccess("Produto excluído com sucesso");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Erro ao excluir produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = createColumns(allCategories, handleEdit, handleDelete);

  return (
    <>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        searchKey={(row) => `${row.name} ${row.description} ${row.category}`}
        searchPlaceholder="Buscar por nome, descrição ou categoria..."
        pageSize={10}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: "", label: "Todas as categorias" },
                ...allCategories.map((category) => ({ value: category, label: category })),
              ]}
              className="w-48"
            />
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Produto
            </Button>
          </div>
        }
      />

      <ProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        categories={allCategories}
        title="Novo Produto"
        isLoading={isSubmitting}
      />

      {editingProduct && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={handleUpdate}
          categories={allCategories}
          initialData={{
            name: editingProduct.name,
            description: editingProduct.description,
            price: editingProduct.price,
            stock: editingProduct.stock,
            category: editingProduct.category,
          }}
          title="Editar Produto"
          isLoading={isSubmitting}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; price: number; stock: number; category: string }) => Promise<void>;
  categories: string[];
  initialData?: Partial<{ name: string; description: string; price: number; stock: number; category: string }> | null;
  title: string;
  isLoading?: boolean;
}

function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
  title,
  isLoading = false,
}: ProductModalProps) {
  const productFormSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome não pode ter mais de 100 caracteres"),
    description: z.string().max(500, "Descrição não pode ter mais de 500 caracteres"),
    price: z.coerce.number().min(0, "Preço não pode ser negativo"),
    stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
    category: z.string().min(1, "Categoria é obrigatória").max(50, "Categoria não pode ter mais de 50 caracteres"),
  });

  type ProductFormData = z.infer<typeof productFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      stock: 0,
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
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
          <textarea
            {...register("description")}
            rows={3}
            className={`
              w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
              ${errors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300 dark:border-gray-600"}
            `}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Preço (R$)"
            type="number"
            min="0"
            step="0.01"
            error={errors.price?.message}
            {...register("price")}
          />
          <Input
            label="Estoque"
            type="number"
            min="0"
            step="1"
            error={errors.stock?.message}
            {...register("stock")}
          />
          <div>
            <Input
              label="Categoria"
              list="product-categories"
              placeholder="Selecione ou digite uma categoria"
              error={errors.category?.message}
              {...register("category")}
            />
            <datalist id="product-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>
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