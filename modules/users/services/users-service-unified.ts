import { getSupabaseClient } from "@/lib/supabase/client"; // or admin if needed
import { User } from "../models/user";
// export interface UserProfile {
//   id: string;
//   email: string;
//   role_id: string;
//   first_name: string;
//   last_name: string;
//   is_active: boolean;
//   profile?: string;
//   created_at?: string;
//   updated_at?: string;
//   last_login?: string;
//   roles?: {
//     name: string;
//     description?: string;
//     role_access?: Array<{
//       id: string;
//       resource: string;
//       action: string;
//     }>;
//   };
// }

export interface UserServiceResponse {
  success: boolean;
  data: User | null;
  error: any;
}

export const usersService = {
  /**
   * Create user profile
   */
  createUser: async (user: Omit<User, "created_at" | "updated_at">) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_profile")
      .insert(user)
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return { success: false, error };
    }

    return { success: true, data };
  },

  /**
   * Get all users
   */
  getUsers: async (): Promise<User[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_profile")
      .select("*, roles(name, description, role_access(id, resource, action))");

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }

    return data ?? [];
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<UserServiceResponse> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_profile")
      .select("*, roles(name, description, role_access(id, resource, action))")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      return { success: false, error, data: null };
    }

    return { success: true, data, error: null };
  },

  /**
   * Get users with pagination + search
   */
  getUsersPaginated: async (
    search: string = "",
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ users: User[]; total: number }> => {
    const supabase = getSupabaseClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("user_profile")
      .select("*, roles(name, description, role_access(id, resource, action))", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search && search.trim() !== "%%") {
      query = query.ilike("email", search);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching paginated users:", error);
      return { users: [], total: 0 };
    }

    return { users: data ?? [], total: count ?? 0 };
  },

  /**
   * Update user profile
   */
  updateUser: async (id: string, updates: Partial<User>) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_profile")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return { success: false, error };
    }

    return { success: true, data };
  },

  /**
   * Delete user profile
   */
  deleteUser: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("user_profile").delete().eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
      return { success: false, error };
    }

    return { success: true };
  },
};
