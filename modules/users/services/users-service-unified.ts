/**
 * Unified Users Service
 * 
 * This service centralizes all user-related database operations using BaseService
 * for consistent error handling, response structures, and client management.
 * 
 * The service uses a functional approach with direct function exports.
 */

import { baseService, type ServiceResponse, type ClientEnvironment } from "@/lib/BaseService";
import { User } from "../models/user";

// Constants
const TABLE_NAME = "user_profile";

/**
 * Create a new user profile in the database
 * 
 * @param user - The user data to create (without created_at/updated_at)
 * @param options - Options including environment (client/server/admin)
 */
export async function createUser(
  user: Omit<User, "created_at" | "updated_at">,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<User>> {
  return await baseService.create<User>(
    TABLE_NAME,
    user,
    { environment: options?.environment }
  );
}

/**
 * Get all users with their associated roles and permissions
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function getUsers(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<User[]>> {
  return await baseService.readAll<User>(
    TABLE_NAME,
    {
      select: "*, roles(name, description, role_access(id, resource, action))",
      environment: options?.environment
    }
  );
}

/**
 * Get a user by their ID including role information
 * 
 * @param id - The user ID to look up
 * @param options - Options including environment (client/server/admin)
 */
export async function getUserById(
  id: string,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<User>> {
  return await baseService.readById<User>(
    TABLE_NAME,
    id,
    {
      select: "*, roles(name, description, role_access(id, resource, action))",
      environment: options?.environment
    }
  );
}

/**
 * Get users with pagination, optional search, and ordered results
 * 
 * @param params - Search and pagination parameters
 * @param options - Options including environment (client/server/admin)
 */
export async function getUsersPaginated(
  params: {
    search?: string;
    page?: number;
    pageSize?: number;
  },
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<{ data: User[]; total: number; page: number; pageSize: number }>> {
  const { search, page = 1, pageSize = 10 } = params;
  
  const paginationParams = {
    page,
    limit: pageSize,
    orderBy: {
      field: "created_at",
      ascending: false
    },
    ...(search ? {
      search,
      searchFields: ["email", "first_name", "last_name"]
    } : {})
  };

  return await baseService.paginate<User>(
    TABLE_NAME,
    paginationParams,
    {
      select: "*, roles(name, description, role_access(id, resource, action))",
      environment: options?.environment
    }
  );
}

/**
 * Update a user profile by ID
 * 
 * @param id - The user ID to update
 * @param updates - The partial user data to update
 * @param options - Options including environment (client/server/admin)
 */
export async function updateUser(
  id: string,
  updates: Partial<User>,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<User>> {
  return await baseService.update<User>(
    TABLE_NAME,
    id,
    updates,
    { environment: options?.environment }
  );
}

/**
 * Delete a user profile by ID
 * 
 * @param id - The user ID to delete
 * @param options - Options including environment (client/server/admin)
 */
export async function deleteUser(
  id: string,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<User>> {
  // Using baseService.delete which is exported as an alias for 'remove'
  return await baseService.delete<User>(
    TABLE_NAME,
    id,
    { environment: options?.environment }
  );
}

// Export individual functions directly for the unified service
export const usersServiceUnified = {
  createUser,
  getUsers,
  getUserById,
  getUsersPaginated,
  updateUser,
  deleteUser,
};

// Legacy compatibility export to maintain backward compatibility
export const usersService = {
  createUser: (user: Omit<User, "created_at" | "updated_at">, environment?: ClientEnvironment) => 
    createUser(user, { environment }),
    
  getUsers: async (environment?: ClientEnvironment) => {
    const result = await getUsers({ environment });
    return result.success ? result.data || [] : [];
  },
  
  getUserById: (id: string, environment?: ClientEnvironment) => 
    getUserById(id, { environment }),
    
  getUsersPaginated: async (search = "", page = 1, pageSize = 10, environment?: ClientEnvironment) => {
    const result = await getUsersPaginated({ search, page, pageSize }, { environment });
    return result.success 
      ? { users: result.data?.data || [], total: result.data?.total || 0 }
      : { users: [], total: 0 };
  },
  
  updateUser: (id: string, updates: Partial<User>, environment?: ClientEnvironment) => 
    updateUser(id, updates, { environment }),
    
  deleteUser: async (id: string, environment?: ClientEnvironment) => {
    const result = await deleteUser(id, { environment });
    return { success: result.success, error: result.error };
  },
};

// Export type for service responses
export interface UserServiceResponse {
  success: boolean;
  data: User | null;
  error: any;
}