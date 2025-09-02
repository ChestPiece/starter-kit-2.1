import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import DataTableSkeleton from "./data-table-skeleton";
// Add a new interface for toolbar props
interface DataTableToolbarProps {
  onRefresh: () => void;
  onGlobalFilterChange: (filter: string) => void;
  table?: any; // Add other specific props as needed
  onExport?: () => void;
  tableName?: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onGlobalFilterChange: (filter: string) => void;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
  pageCount?: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  rowCount: number | 0;
  tableName?: string;
  toolbar?: React.ReactElement<DataTableToolbarProps>; // Update toolbar type
  pagination?: boolean;
  type?: string;
  handleRowClick?: (row: any) => void;
  pageSizeOptions?: number[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onGlobalFilterChange,
  onPageChange,
  onPageSizeChange,
  pageSize,
  pageCount,
  currentPage,
  loading,
  error,
  rowCount,
  tableName,
  toolbar,
  pagination = true,
  type,
  handleRowClick,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  React.useEffect(() => {
    table.setPageIndex(currentPage);
  }, [currentPage, table]);

  const getRowClass = (row: any) => {
    const isUnderLegal = row.original?.under_legal;
    return isUnderLegal ? "bg-red-200 hover:bg-red-200" : "";
  };

  const handleRefresh = () => {
    onGlobalFilterChange("");
  };

  const exportToCSV = (data: any[]) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_export.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
  };

  const handleExport = async () => {
    // if (tableName) {
    //   try {
    //     const { data, error } = await supabase.from(tableName).select("*");
    //     if (error) {
    //       console.error("Error fetching data from Supabase:", error);
    //       return;
    //     }
    //     if (data && data.length > 0) {
    //       exportToCSV(data);
    //     } else {
    //       console.log("No data available to export");
    //     }
    //   } catch (error) {
    //     console.error("Error exporting data:", error);
    //   }
    // }
  };

  return (
    <div className="space-y-4 overflow-y-auto">
      {toolbar &&
        React.cloneElement(toolbar, {
          table,
          onExport: handleExport,
          tableName,
          onGlobalFilterChange,
          onRefresh: handleRefresh,
        })}
      {!toolbar && (
        <DataTableToolbar
          onRefresh={handleRefresh}
          table={table}
          onExport={handleExport}
          tableName={tableName}
          onGlobalFilterChange={onGlobalFilterChange}
        />
      )}

      {error && <div className="text-red-500">{error}</div>}
      <div className="border">
        <Table>
          <TableHeader className="bg-sidebar rounded-[20px]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-md font-medium ">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <DataTableSkeleton type={type as string} />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-4"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={`${getRowClass(row)} ${
                    handleRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className=" py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageIndex={currentPage}
          pageSize={pageSize}
          rowCount={rowCount}
        />
      )}
    </div>
  );
}
