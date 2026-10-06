"use client";

import { useState, useMemo } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

interface Column<TData> {
  id: string;
  header: string | ((row: TData) => React.ReactNode);
  cell: (row: TData) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<TData> {
  data: TData[];
  columns: Column<TData>[];
  searchKey?: keyof TData | ((row: TData) => string);
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function DataTable<TData extends { id: string }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Buscar...",
  pageSize = 10,
  onRowClick,
  isLoading = false,
  emptyMessage = "Nenhum registro encontrado",
  className = "",
  actions,
}: DataTableProps<TData>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (globalFilter && searchKey) {
      const searchLower = globalFilter.toLowerCase();
      result = result.filter((row) => {
        const value = typeof searchKey === "function" ? searchKey(row) : row[searchKey];
        return String(value).toLowerCase().includes(searchLower);
      });
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortConfig.key];
        const bVal = (b as Record<string, unknown>)[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, globalFilter, searchKey, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div className={className}>
      {(searchKey || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {searchKey ? (
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-xs"
            />
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`
                    px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400
                    ${column.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none" : ""}
                  `}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    {typeof column.header === "function" ? column.header({} as TData) : column.header}
                    {column.sortable && (
                      <span>
                        {sortConfig?.key === column.id ? (
                          sortConfig.direction === "asc" ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l4-8 4 8M3 8h18" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Carregando...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    ${onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" : ""}
                    transition-colors
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3 text-gray-900 dark:text-white">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{" "}
            <span className="font-medium">{Math.min(currentPage * pageSize, filteredData.length)}</span> de{" "}
            <span className="font-medium">{filteredData.length}</span> resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}