/**
 * Unified Roles Service
 * 
 * This service centralizes all role-related database operations using BaseService
 * for consistent error handling, response structures, and client management.
 * 
 * The service uses a functional approach with direct function exports.
 */

import { baseService, type ServiceResponse, type ClientEnvironment } from "@/lib/BaseService";
import { Role } from "../models/role";

// Constants
const TABLE_NAME = "roles";
const DEFAULT_ROLE_ID = "e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4"; // Default user role ID

/**
 * Extended Role interface that includes access permissions
 */
export interface RoleWithAccess extends Role {
  role_access: Array<{
    id: string;
    resource: string;
    action: string;
  }>;
}

/**
 * Get all roles from the database
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function getAllRoles(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Role[]>> {
  return await baseService.readAll<Role>(
    TABLE_NAME,
    { environment: options?.environment }
  );
}

/**
 * Get a role by its ID
 * 
 * @param id - The role ID to look up
 * @param options - Options including environment (client/server/admin)
 */
export async function getRoleById(
  id: string,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Role>> {
  return await baseService.readById<Role>(
    TABLE_NAME,
    id,
    { environment: options?.environment }
  );
}

/**
 * Get roles with their access permissions
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function getRolesWithAccess(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<RoleWithAccess[]>> {
  return await baseService.readAll<RoleWithAccess>(
    TABLE_NAME,
    {
      select: "id, name, description, role_access(id, resource, action)",
      environment: options?.environment
    }
  );
}

/**
 * Get paginated roles
 * 
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @param options - Options including environment (client/server/admin)
 */
export async function getPaginatedRoles(
  page: number = 1,
  pageSize: number = 10,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<{ data: Role[]; total: number; page: number; pageSize: number }>> {
  return await baseService.paginate<Role>(
    TABLE_NAME,
    {
      page,
      limit: pageSize
    },
    { environment: options?.environment }
  );
}

/**
 * Search roles by name
 * 
 * @param searchTerm - The search term to look for in role names
 * @param options - Options including environment (client/server/admin)
 */
export async function searchRoles(
  searchTerm: string,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Role[]>> {
  const result = await baseService.paginate<Role>(
    TABLE_NAME,
    {
      search: searchTerm,
      searchFields: ["name", "description"]
    },
    { environment: options?.environment }
  );
  
  return {
    ...result,
    data: result.success ? result.data?.data || [] : []
  };
}

/**
 * Get role ID by role name
 * 
 * @param roleName - The role name to look up
 * @param options - Options including environment (client/server/admin)
 * @returns Role ID as string, or default ID if not found
 */
export async function getRoleByName(
  roleName: string = "user",
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<string>> {
  try {
    // Use readAll with filtering
    const result = await baseService.readAll<Role>(
      TABLE_NAME,
      {
        select: "id, name",
        environment: options?.environment
      }
    );
    
    if (result.success && result.data) {
      const role = result.data.find(r => r.name === roleName);
      if (role && role.id) {
        return {
          success: true,
          data: role.id,
          meta: result.meta
        };
      }
    }
    
    // Return default role ID if not found
    return {
      success: true,
      data: DEFAULT_ROLE_ID,
      meta: { requestId: `fallback_${Date.now()}` }
    };
  } catch (error) {
    return {
      success: false,
      data: DEFAULT_ROLE_ID,
      error: {
        code: "ROLE_FETCH_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch role by name",
        details: error
      }
    };
  }
}

// Export individual functions directly for the unified service
export const rolesServiceUnified = {
  getAllRoles,
  getRoleById,
  getRolesWithAccess,
  getPaginatedRoles,
  searchRoles,
  getRoleByName
};

// Legacy compatibility export to maintain backward compatibility
export const rolesService = {
  getAllRoles: async (environment?: ClientEnvironment) => {
    const result = await getAllRoles({ environment });
    return result.success ? result.data || [] : [];
  },
  
  getRoleById: async (id: string, environment?: ClientEnvironment) => {
    const result = await getRoleById(id, { environment });
    return result.success ? result.data : null;
  },
  
  getRolesWithAccess: async (environment?: ClientEnvironment) => {
    const result = await getRolesWithAccess({ environment });
    return result.success ? result.data || [] : [];
  },
  
  getPaginatedRoles: async (page = 1, pageSize = 10, environment?: ClientEnvironment) => {
    const result = await getPaginatedRoles(page, pageSize, { environment });
    return result.success 
      ? { roles: result.data?.data || [], total: result.data?.total || 0 }
      : { roles: [], total: 0 };
  },
  
  searchRoles: async (searchTerm: string, environment?: ClientEnvironment) => {
    const result = await searchRoles(searchTerm, { environment });
    return result.success ? result.data || [] : [];
  },
  
  getRoleByName: async (roleName = "user", environment?: ClientEnvironment) => {
    const result = await getRoleByName(roleName, { environment });
    return result.data;
  }
};

// Export types
export type { Role };