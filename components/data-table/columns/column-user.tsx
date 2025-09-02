"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { UserTableRowActions } from "../actions/user-actions";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { currentTimezone } from "@/lib/helper/current-timezone";
import { CircleCheck, CircleX } from "lucide-react";
import { User } from "@/types/types";
import { Role } from "@/modules/roles/models/role";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";

export function getUserColumns(
  fetchUsers: () => void,
  listRoles: Role[]
): ColumnDef<User>[] {
  const columns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const fullname =
          `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim();

        return (
          <div className="flex items-center w-full">
            <Avatar className="border-foreground/10 border-[1px]">
              <AvatarImage
                className=""
                src={
                  row.original.profile?.includes("http")
                    ? row.original.profile
                    : generateNameAvatar(fullname)
                }
                alt={fullname || ""}
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
              <span className="truncate font-semibold">{fullname || ""}</span>
              <span className="truncate text-xs">
                {row.original.email || ""}
              </span>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.original.roles?.name;
        return (
          <div className="text-ellipsis text-left overflow-hidden whitespace-nowrap">
            <Badge className="text-xs font-semibold ">
              {role?.toUpperCase()}
            </Badge>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        return row.original.is_active ? (
          <Badge className="bg-green-500">
            <CircleCheck className="!h-3 !w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-500 text-white h-6">
            <CircleX className="!h-3 !w-3 mr-1" />
            Inactive
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const created = row.original.created_at;
        return (
          <div className="text-left overflow-hidden whitespace-nowrap">
            {created
              ? currentTimezone(created)?.toLocaleString()?.replace("GMT", "")
              : "-"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <UserTableRowActions
            row={row as unknown as Row<User>}
            fetchUsers={fetchUsers}
            listRoles={listRoles as Role[]}
          />
        </div>
      ),
    },
  ];

  return columns;
}
