import { getSupabaseClient } from "@/lib/supabase/client"; // or admin depending on env
import { Role } from "../models/role";

export type { Role };

interface RoleWithAccess extends Role {
  role_access: Array<{
    id: string;
    resource: string;
    action: string;
  }>;
}

export const rolesService = {
  /**
   * Get all roles
   */
  getAllRoles: async (): Promise<Role[]> => {
    const supabase = getSupabaseClient(); // adjust environment
    const { data, error } = await supabase.from("roles").select("*");

    if (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
    return data ?? [];
  },

  /**
   * Get a role by ID
   */
  getRoleById: async (id: string): Promise<Role | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching role with ID ${id}:`, error);
      return null;
    }
    return data;
  },

  /**
   * Get roles with their access permissions
   */
  getRolesWithAccess: async (): Promise<RoleWithAccess[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, description, role_access(id, resource, action)");

    if (error) {
      console.error("Error fetching roles with access:", error);
      return [];
    }
    return (data as RoleWithAccess[]) ?? [];
  },

  /**
   * Get paginated roles
   */
  getPaginatedRoles: async (
    page = 1,
    pageSize = 10
  ): Promise<{ roles: Role[]; total: number }> => {
    const supabase = getSupabaseClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("roles")
      .select("*", { count: "exact" })
      .range(from, to);

    if (error) {
      console.error("Error fetching paginated roles:", error);
      return { roles: [], total: 0 };
    }

    return { roles: data ?? [], total: count ?? 0 };
  },

  /**
   * Search roles by name
   */
  searchRoles: async (searchTerm: string): Promise<Role[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .ilike("name", `%${searchTerm}%`);

    if (error) {
      console.error(`Error searching roles with term "${searchTerm}":`, error);
      return [];
    }
    return data ?? [];
  },

  /**
   * Get role by name
   */
  getRoleByName: async (roleName: string = "user"): Promise<string> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (error || !data?.id) {
      console.error("Error fetching user role:", error);
      // fallback ID
      return "e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4";
    }

    return data.id;
  },
};
