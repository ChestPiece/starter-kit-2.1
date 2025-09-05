"use client";
import { useState, useEffect, useCallback } from "react";

import { getUserColumns } from "@/components/data-table/columns/column-user";
import { UserDataTableToolbar } from "@/components/data-table/toolbars/user-toolbar";
import { DataTable } from "@/components/data-table/data-table";
import { usersService } from "@/modules/users";
import { User } from "@/types/types";
import { rolesService } from "@/modules/roles/services/roles-service";
import { Role } from "@/modules/roles/models/role";
import { useDebounce } from "@/hooks/use-debounce";

export default function UserManagementPage({ type }: { type: string }) {
  const [listUsers, setListUsers] = useState<User[]>([]);
  const [listRoles, setListRoles] = useState<Role[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const fetchUsers = useCallback(async () => {
    setIsRefetching(true);
    try {
      console.log("Fetching users with params:", {
        search: debouncedSearchTerm,
        page: currentPage + 1,
        pageSize,
      });

      const usersResponse: any = await usersService.getUsersPaginated(
        debouncedSearchTerm,
        currentPage + 1, // Convert from 0-based to 1-based pagination
        pageSize
      );

      console.log("Users response:", usersResponse);

      if (!usersResponse || typeof usersResponse !== "object") {
        console.error(
          "Invalid response format from getUsersPaginated:",
          usersResponse
        );
        setListUsers([]);
        setRecordCount(0);
        return;
      }

      setListUsers(
        Array.isArray(usersResponse.users) ? usersResponse.users : []
      );
      setRecordCount(
        typeof usersResponse.total === "number" ? usersResponse.total : 0
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      setListUsers([]);
      setRecordCount(0);
    } finally {
      setIsRefetching(false);
    }
  }, [debouncedSearchTerm, pageSize, currentPage]);
  const fetchRoles = async () => {
    const rolesResponse: Role[] = await rolesService.getAllRoles();
    setListRoles(rolesResponse);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [currentPage, pageSize, debouncedSearchTerm, fetchUsers]);

  const handleGlobalFilterChange = (filter: string) => {
    if (!searchQuery && !filter) {
      setIsRefetching(true);
      fetchUsers();
    } else {
      setSearchQuery(filter);
    }
    setCurrentPage(0);
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  return (
    <div>
      <DataTable
        data={listUsers || []}
        toolbar={
          <UserDataTableToolbar
            fetchRecords={fetchUsers}
            type={type}
            listRoles={listRoles}
          />
        }
        // @ts-ignore
        columns={getUserColumns(fetchUsers, listRoles as Role[])}
        onGlobalFilterChange={handleGlobalFilterChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSize={pageSize}
        currentPage={currentPage}
        loading={isRefetching}
        error={""}
        rowCount={recordCount}
        type="users"
      />
    </div>
  );
}
