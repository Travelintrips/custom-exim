import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from "lucide-react";

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { value: string; label: string }[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRows?: (rows: string[]) => void;
  pageSize?: number;
  className?: string;
  rowClassName?: string | ((row: T) => string);
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

interface FilterState {
  [key: string]: string;
}

export function DataTable<T extends object>({
  data,
  columns,
  keyField,
  selectable = false,
  selectedRows = [],
  onSelectRows,
  pageSize = 10,
  className,
  rowClassName,
  onRowClick,
  renderActions,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filters, setFilters] = React.useState<FilterState>({});
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter data
  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Apply column filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (filterValue && filterValue !== "all") {
        const column = columns.find((c) => c.id === columnId);
        if (column) {
          result = result.filter((row) => {
            const value =
              typeof column.accessor === "function"
                ? column.accessor(row)
                : row[column.accessor];
            return String(value).toLowerCase() === filterValue.toLowerCase();
          });
        }
      }
    });

    // Apply search
    if (searchTerm) {
      result = result.filter((row) =>
        columns.some((column) => {
          const value =
            typeof column.accessor === "function"
              ? column.accessor(row)
              : row[column.accessor];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    return result;
  }, [data, filters, searchTerm, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const handleSelectAll = () => {
    if (!onSelectRows) return;
    const allKeys = paginatedData.map((row) => String(row[keyField]));
    if (selectedRows.length === paginatedData.length) {
      onSelectRows([]);
    } else {
      onSelectRows(allKeys);
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectRows) return;
    if (selectedRows.includes(key)) {
      onSelectRows(selectedRows.filter((k) => k !== key));
    } else {
      onSelectRows([...selectedRows, key]);
    }
  };

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters((prev) => ({ ...prev, [columnId]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "all") || searchTerm;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {columns
          .filter((col) => col.filterable && col.filterOptions)
          .map((column) => (
            <Select
              key={column.id}
              value={filters[column.id] || "all"}
              onValueChange={(value) => handleFilterChange(column.id, value)}
            >
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder={column.header} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {column.header}</SelectItem>
                {column.filterOptions?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {selectable && (
                  <th className="p-3 w-10">
                    <Checkbox
                      checked={
                        paginatedData.length > 0 &&
                        selectedRows.length === paginatedData.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "p-3 text-left font-medium text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                {renderActions && (
                  <th className="p-3 text-center font-medium text-muted-foreground w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => {
                  const key = String(row[keyField]);
                  const rowClasses =
                    typeof rowClassName === "function" ? rowClassName(row) : rowClassName;
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "border-b hover:bg-muted/30",
                        onRowClick && "cursor-pointer",
                        rowClasses
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedRows.includes(key)}
                            onCheckedChange={() => handleSelectRow(key)}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.id} className={cn("p-3", column.className)}>
                          {typeof column.accessor === "function"
                            ? column.accessor(row)
                            : (row[column.accessor] as React.ReactNode)}
                        </td>
                      ))}
                      {renderActions && (
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {renderActions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} entries
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
