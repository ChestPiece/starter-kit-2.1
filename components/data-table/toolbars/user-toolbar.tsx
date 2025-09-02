"use client";

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Download, Plus, RefreshCcw, X, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import AddUser from "@/components/(main)/user/component/add-user";
import type { Role } from "@/modules/roles/models/role";
// import UserSettingsDialogBox from "@/components/dashboard/user-management/manage-user-settings";

interface DataTableToolbarProps<TData> {
  table?: Table<TData>;
  onRefresh?: () => void;
  onExport?: () => void;
  tableName?: string;
  onGlobalFilterChange?: (value: string) => void;
  fetchRecords: () => void;
  type?: string;
  listRoles?: Role[];
}

export function UserDataTableToolbar<TData>({
  table,
  onRefresh,
  onExport,
  tableName,
  onGlobalFilterChange,
  fetchRecords,
  type,
  listRoles,
}: DataTableToolbarProps<TData>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    onGlobalFilterChange?.(value);
  };

  const isFiltered = globalFilter !== "";
  return (
    <div className="flex items-center justify-between ">
      <div className="flex flex-1 items-center space-x-2 ">
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search By Name or Email"
            value={globalFilter}
            onChange={handleFilterChange}
            className="h-8 pl-8 w-full focus-visible:ring-0"
          />
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              onGlobalFilterChange?.("");
              setGlobalFilter("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>{" "}
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
          onClick={fetchRecords} // Call the onRefresh function
          className="ml-auto hidden h-8 lg:flex"
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      {table && <DataTableViewOptions table={table} />}
      <div className="pl-2">
        <Button
          variant="default"
          size="sm"
          className="ml-auto h-8"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" /> Add User
        </Button>
      </div>
      <AddUser
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRefresh={fetchRecords}
        listRoles={listRoles}
      />
      {/* {isDialogOpen && (
        // <UserSettingsDialogBox
        //   open={isDialogOpen}
        //   onOpenChange={setIsDialogOpen}
        //   onRefresh={fetchRecords}
        // />
      )} */}
    </div>
  );
}
