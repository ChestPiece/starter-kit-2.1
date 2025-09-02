"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Ellipsis,
  Edit,
  Trash,
  ShieldBan,
  Ban,
  CheckCircle,
  KeyRound,
} from "lucide-react";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { User } from "@/types/types";
import EditUser from "@/components/(main)/user/component/edit-user";
import ChangePassword from "@/components/(main)/user/component/change-password";
import { Role } from "@/modules/roles/models/role";
import { rolesService } from "@/modules/roles/services/roles-service";
import { deleteAuthUser } from "@/lib/actions/auth-actions";

import { usersServiceClient } from "@/modules/users";
import ConfirmationDialogBox from "@/components/ui/confirmation-dialog-box";
import { useAuth } from "@/context/AuthContext";

interface UserTableRowActionsProps {
  row: Row<User>;
  fetchUsers: () => void;
  listRoles: Role[];
}

export function UserTableRowActions({
  row,
  fetchUsers,
  listRoles,
}: UserTableRowActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: "disable" | "enable" | "delete" | null;
  }>({ isOpen: false, action: null });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { userProfile } = useAuth();
  // const userService = new UserApiService();
  const values: User = { ...row.original };

  const handleConfirmation = (action: "disable" | "enable" | "delete") => {
    setConfirmationDialog({ isOpen: true, action });
  };

  const onConfirm = async () => {
    if (!values?.id) {
      return;
    }
    try {
      setLoading(true);
      const action = confirmationDialog.action;
      if (action === "delete") {
        await usersServiceClient.deleteUser(values.id);
        toast.success("User deleted successfully");
      } else if (action === "disable") {
        await usersServiceClient.updateUser({
          id: values.id,
          is_active: false,
          profile: values.profile,
          role_id: values.role_id,
          first_name: values.first_name,
          last_name: values.last_name,
        });
        toast.success("User disabled successfully");
      } else if (action === "enable") {
        await usersServiceClient.updateUser({
          id: values.id,
          is_active: true,
          profile: values.profile,
          role_id: values.role_id,
          first_name: values.first_name,
          last_name: values.last_name,
        });
        toast.success("User enabled successfully");
      }

      setConfirmationDialog({ isOpen: false, action: null });
      fetchUsers(); // Refresh the user list after action
    } catch (error: any) {
      toast.error(error?.message || "Unknown error");
    } finally {
      setLoading(false);
      setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  if (values.email === userProfile?.email) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-max">
          <DropdownMenuItem
            onClick={() => {
              setIsEditDialogOpen(true);
            }}
            className="cursor-pointer flex items-center"
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setIsPasswordDialogOpen(true)}
            className="cursor-pointer flex items-center"
          >
            <KeyRound className="mr-1 h-4 w-4" />
            Change Password
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleConfirmation("delete")}
            className="cursor-pointer flex items-center"
          >
            <Trash className="mr-1 h-4 w-4" />
            Remove
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              handleConfirmation(values.is_active ? "disable" : "enable")
            }
            className="cursor-pointer flex items-center"
          >
            {values.is_active ? (
              <>
                <Ban className="mr-1 h-4 w-4" />
                Block
              </>
            ) : (
              <>
                <CheckCircle className="mr-1 h-4 w-4" />
                Enable
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUser
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        userData={values}
        fetchUser={fetchUsers}
        listRoles={listRoles}
      />

      <ChangePassword
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        userId={values.id}
      />

      <ConfirmationDialogBox
        title={
          confirmationDialog.action === "delete"
            ? `Are you sure you want to remove this user?`
            : confirmationDialog.action === "disable"
              ? `Are you sure you want to block this user?`
              : `Are you sure you want to activate this user?`
        }
        description={
          confirmationDialog.action === "delete"
            ? `This action cannot be undone. This will permanently delete the selected user.`
            : confirmationDialog.action === "disable"
              ? `This will prevent the user from accessing the system.`
              : `This will restore the user's access to the system.`
        }
        cancelText="Cancel"
        confirmText={
          confirmationDialog.action === "delete"
            ? "Remove"
            : confirmationDialog.action === "disable"
              ? "Block"
              : "Activate"
        }
        isOpen={confirmationDialog.isOpen}
        setIsOpen={(isOpen: boolean) =>
          setConfirmationDialog((prev) => ({ ...prev, isOpen }))
        }
        loading={loading}
        onConfirm={onConfirm}
        icon={
          confirmationDialog.action === "delete" ? (
            <Trash className="mr-2 h-4 w-4" />
          ) : confirmationDialog.action === "disable" ? (
            <ShieldBan className="mr-2 h-4 w-4" />
          ) : (
            <Edit className="mr-2 h-4 w-4" />
          )
        }
      />
    </>
  );
}
