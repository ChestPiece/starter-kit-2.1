/**
 * Unified Users Service
 * Uses BaseService for consistent error handling and client management
 * Replaces both users-service.ts and users-service-client.ts
 */

import { baseService, type ServiceResponse, type PaginatedResponse, type ClientEnvironment } from '@/lib/BaseService';

// User types
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role_id: string;
  is_active: boolean;
  profile?: any;
  created_at?: string;
  updated_at?: string;
  roles?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CreateUserData {
  id: string;
  email: string;
  role_id: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  profile?: any;
}

export interface UpdateUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  role_id?: string;
  profile?: any;
  is_active?: boolean;
}

export interface UserSearchOptions {
  search?: string;
  page?: number;
  limit?: number;
  includeRoles?: boolean;
  environment?: ClientEnvironment;
}

/**
 * Unified Users Service Class
 */
export class UsersService {
  private static instance: UsersService;
  private readonly tableName = 'user_profile';
  private readonly defaultSelect = `
    *,
    roles:role_id (
      id,
      name,
      description
    )
  `;

  private constructor() {}

  public static getInstance(): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService();
    }
    return UsersService.instance;
  }

  /**
   * Create a new user
   */
  async createUser(
    userData: CreateUserData,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<UserProfile>> {
    const createData = {
      id: userData.id,
      email: userData.email,
      role_id: userData.role_id,
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      is_active: userData.is_active ?? true,
      profile: userData.profile || null,
    };

    return await baseService.create<UserProfile>(
      this.tableName,
      createData,
      {
        select: this.defaultSelect,
        environment: options?.environment,
      }
    );
  }

  /**
   * Get all users (with optional filtering)
   */
  async getUsers(
    options?: {
      search?: string;
      includeRoles?: boolean;
      environment?: ClientEnvironment;
    }
  ): Promise<ServiceResponse<UserProfile[]>> {
    const select = options?.includeRoles === false ? '*' : this.defaultSelect;

    let queryOptions: any = {
      select,
      orderBy: { field: 'created_at', ascending: false },
      environment: options?.environment,
    };

    // Add search functionality if provided
    if (options?.search?.trim()) {
      // For search, we need to use a custom query since BaseService doesn't support OR conditions yet
      // This is a limitation we'll address in a future enhancement
      queryOptions.filters = {};
    }

    return await baseService.read<UserProfile>(this.tableName, queryOptions);
  }

  /**
   * Get users with pagination and search
   */
  async getUsersPagination(
    options: UserSearchOptions = {}
  ): Promise<ServiceResponse<PaginatedResponse<UserProfile>>> {
    const {
      search = '',
      page = 1,
      limit = 10,
      includeRoles = true,
      environment
    } = options;

    const select = includeRoles ? this.defaultSelect : '*';
    const searchFields = ['first_name', 'last_name', 'email'];

    return await baseService.paginate<UserProfile>(
      this.tableName,
      {
        page,
        limit,
        search: search.trim() || undefined,
        searchFields,
        orderBy: { field: 'created_at', ascending: false },
        select,
        environment,
      }
    );
  }

  /**
   * Get a user by ID
   */
  async getUserById(
    id: string,
    options?: {
      includeRoles?: boolean;
      environment?: ClientEnvironment;
    }
  ): Promise<ServiceResponse<UserProfile | null>> {
    const select = options?.includeRoles === false ? '*' : this.defaultSelect;

    return await baseService.readById<UserProfile>(
      this.tableName,
      id,
      {
        select,
        environment: options?.environment,
      }
    );
  }

  /**
   * Update a user
   */
  async updateUser(
    userData: UpdateUserData,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<UserProfile>> {
    const updateData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      role_id: userData.role_id,
      profile: userData.profile,
      is_active: userData.is_active,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    return await baseService.update<UserProfile>(
      this.tableName,
      userData.id,
      updateData,
      {
        select: this.defaultSelect,
        environment: options?.environment,
      }
    );
  }

  /**
   * Delete a user
   */
  async deleteUser(
    id: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    return await baseService.delete(
      this.tableName,
      id,
      {
        environment: options?.environment,
      }
    );
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(
    usersData: CreateUserData[],
    options?: {
      batchSize?: number;
      environment?: ClientEnvironment;
    }
  ): Promise<ServiceResponse<UserProfile[]>> {
    const createData = usersData.map(userData => ({
      id: userData.id,
      email: userData.email,
      role_id: userData.role_id,
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      is_active: userData.is_active ?? true,
      profile: userData.profile || null,
    }));

    return await baseService.bulkInsert<UserProfile>(
      this.tableName,
      createData,
      {
        batchSize: options?.batchSize,
        environment: options?.environment,
      }
    );
  }

  /**
   * Check if user exists by email
   */
  async userExistsByEmail(
    email: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<boolean>> {
    const result = await baseService.read<UserProfile>(
      this.tableName,
      {
        select: 'id',
        filters: { email },
        environment: options?.environment,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: (result.data || []).length > 0,
    };
  }

  /**
   * Get users by role
   */
  async getUsersByRole(
    roleId: string,
    options?: {
      page?: number;
      limit?: number;
      environment?: ClientEnvironment;
    }
  ): Promise<ServiceResponse<PaginatedResponse<UserProfile>>> {
    return await baseService.paginate<UserProfile>(
      this.tableName,
      {
        page: options?.page || 1,
        limit: options?.limit || 10,
        filters: { role_id: roleId },
        orderBy: { field: 'created_at', ascending: false },
        select: this.defaultSelect,
        environment: options?.environment,
      }
    );
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<number>> {
    const result = await baseService.read<UserProfile>(
      this.tableName,
      {
        select: 'id',
        filters: { is_active: true },
        count: true,
        environment: options?.environment,
      }
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.meta?.count || 0,
    };
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(
    id: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<UserProfile>> {
    // First get the current user
    const userResult = await this.getUserById(id, { 
      includeRoles: false, 
      environment: options?.environment 
    });

    if (!userResult.success || !userResult.data) {
      return userResult as ServiceResponse<UserProfile>;
    }

    // Toggle the active status
    return await this.updateUser(
      {
        id,
        is_active: !userResult.data.is_active,
      },
      options
    );
  }
}

// Export singleton instance
export const usersServiceUnified = UsersService.getInstance();

// Export legacy functions for backward compatibility
export const usersService = {
  insertUser: (data: CreateUserData, environment?: ClientEnvironment) => 
    usersServiceUnified.createUser(data, { environment }),
  createUser: (data: CreateUserData, environment?: ClientEnvironment) => 
    usersServiceUnified.createUser(data, { environment }),
  getUsers: (environment?: ClientEnvironment) => 
    usersServiceUnified.getUsers({ environment }),
  getUsersPagination: (search: string, limit: number, offset: number, environment?: ClientEnvironment) => {
    const page = Math.floor(offset / limit) + 1;
    return usersServiceUnified.getUsersPagination({ 
      search, 
      limit, 
      page, 
      environment 
    });
  },
  updateUser: (data: UpdateUserData, environment?: ClientEnvironment) => 
    usersServiceUnified.updateUser(data, { environment }),
  deleteUser: (id: string, environment?: ClientEnvironment) => 
    usersServiceUnified.deleteUser(id, { environment }),
  getUserById: (id: string, environment?: ClientEnvironment) => 
    usersServiceUnified.getUserById(id, { environment }),
};

// Client service compatibility
export const usersServiceClient = usersService;
