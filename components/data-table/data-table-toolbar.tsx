"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Download, RefreshCcw, X } from "lucide-react";
import { useState } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onRefresh: () => void;
  onExport: () => void;
  tableName?: string;
  onGlobalFilterChange: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
}: DataTableToolbarProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    onGlobalFilterChange(value);
  };

  const isFiltered = globalFilter !== "";

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2 p-1">
        <Input
          placeholder="Filter..."
          value={globalFilter}
          onChange={handleFilterChange}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              onGlobalFilterChange("");
              setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {tableName && ( // Conditionally render export button
        <div className="px-2">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
            onClick={onExport}
          >
            <Download className="p-1" />
            Export
          </Button>
        </div>
      )}
      <div className="px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh} // Call the onRefresh function
          className="ml-auto hidden h-8 lg:flex"
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
