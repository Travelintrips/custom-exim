import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  X,
  Eye,
  Pencil,
  Trash2,
  Upload,
  FileDown,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import {
  MasterDataType,
  masterDataConfig,
  BaseMasterData,
} from "@/types/master-data";

interface MasterDataTableProps<T extends BaseMasterData> {
  dataType: MasterDataType;
  data: T[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onView: (item: T) => void;
  onViewHistory: (item: T) => void;
  onImportExcel: () => void;
  onExportExcel: () => void;
  renderExtraColumns?: (item: T) => React.ReactNode;
}

export function MasterDataTable<T extends BaseMasterData>({
  dataType,
  data,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onViewHistory,
  onImportExcel,
  onExportExcel,
  renderExtraColumns,
}: MasterDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { role, permissions } = useRole();
  const isAdmin = role === "super_admin" || permissions.canEditMasterData;
  const config = masterDataConfig[dataType];

  const filteredData = data.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.is_active) ||
      (statusFilter === "inactive" && !item.is_active);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{config.label}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin
              ? `Manage ${config.label.toLowerCase()}`
              : `View ${config.label.toLowerCase()} (Read-Only)`}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onImportExcel}
              >
                <Upload size={14} />
                Import
              </Button>
              <Button size="sm" className="gap-1.5" onClick={onAdd}>
                <Plus size={14} />
                Add {config.singularLabel}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onExportExcel}
          >
            <FileDown size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "active" | "inactive") => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr className="text-left">
                <th className="p-2 px-3 font-medium text-muted-foreground text-xs">
                  Code
                </th>
                <th className="p-2 font-medium text-muted-foreground text-xs">
                  Name
                </th>
                {renderExtraColumns && (
                  <th className="p-2 font-medium text-muted-foreground text-xs">
                    Details
                  </th>
                )}
                <th className="p-2 font-medium text-muted-foreground text-xs">
                  Status
                </th>
                <th className="p-2 font-medium text-muted-foreground text-xs">
                  Updated
                </th>
                <th className="p-2 px-3 font-medium text-muted-foreground text-xs text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground text-sm"
                  >
                    No {config.label.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={
                      index !== paginatedData.length - 1 ? "border-b" : ""
                    }
                  >
                    <td className="p-2 px-3 font-mono text-xs">{item.code}</td>
                    <td className="p-2 text-sm">{item.name}</td>
                    {renderExtraColumns && (
                      <td className="p-2">{renderExtraColumns(item)}</td>
                    )}
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-1.5 py-0",
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-slate-100 text-slate-600 border-slate-300",
                        )}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground font-mono">
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onView(item)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onViewHistory(item)}
                        >
                          <History size={14} />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEdit(item)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDelete(item)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground text-xs">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
          {Math.min(startIndex + pageSize, filteredData.length)} of{" "}
          {filteredData.length} entries
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 py-1 text-xs">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
