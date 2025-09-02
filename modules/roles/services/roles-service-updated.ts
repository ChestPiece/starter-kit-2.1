import { baseService } from "@/lib/BaseService";
import { Role } from "../models/role";
import { 
  GET_ALL_ROLES, 
  GET_ROLE_BY_ID, 
  GET_ROLES_WITH_ACCESS, 
  GET_ROLES_PAGINATED,
  SEARCH_ROLES,
  GET_ROLE_BY_NAME,
} from "./roles-graphql";

// Type for role with access permissions
interface RoleWithAccess extends Role {
  role_access: Array<{
    id: string;
    resource: string;
    action: string;
  }>;
}

// Type for paginated roles response
interface PaginatedRolesResponse {
  roles: Role[];
  roles_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export const rolesService = {
  /**
   * Get all roles
   */
  getAllRoles: async () => {
    try {
      const result = await baseService.executeGraphQL<{ rolesCollection: { edges: Array<{ node: any }> } }>(
        GET_ALL_ROLES, 
        undefined, 
        { environment: 'server' }
      );
      
      if (!result.success || !result.data) {
        console.error('Error fetching roles:', result.error);
        return [];
      }
      
      return result.data.rolesCollection.edges.map((edge: any) => edge.node);  
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  /**
   * Get a role by ID
   */
  getRoleById: async (id: string): Promise<Role | null> => {
    try {
      const result = await baseService.executeGraphQL<{ roles_by_pk: Role }>(
        GET_ROLE_BY_ID,
        { id }
      );
      
      if (!result.success || !result.data) {
        console.error(`Error fetching role with ID ${id}:`, result.error);
        return null;
      }
      
      return result.data.roles_by_pk;
    } catch (error) {
      console.error(`Error fetching role with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Get roles with their access permissions
   */
  getRolesWithAccess: async (): Promise<RoleWithAccess[]> => {
    try {
      const result = await baseService.executeGraphQL<{ roles: RoleWithAccess[] }>(
        GET_ROLES_WITH_ACCESS
      );
      
      if (!result.success || !result.data) {
        console.error('Error fetching roles with access:', result.error);
        return [];
      }
      
      return result.data.roles;
    } catch (error) {
      console.error('Error fetching roles with access:', error);
      return [];
    }
  },

  /**
   * Get paginated roles
   */
  getPaginatedRoles: async (page = 1, pageSize = 10): Promise<{ roles: Role[], total: number }> => {
    try {
      const offset = (page - 1) * pageSize;
      const result = await baseService.executeGraphQL<PaginatedRolesResponse>(
        GET_ROLES_PAGINATED,
        { limit: pageSize, offset }
      );
      
      if (!result.success || !result.data) {
        console.error('Error fetching paginated roles:', result.error);
        return { roles: [], total: 0 };
      }
      
      return {
        roles: result.data.roles,
        total: result.data.roles_aggregate.aggregate.count
      };
    } catch (error) {
      console.error('Error fetching paginated roles:', error);
      return { roles: [], total: 0 };
    }
  },

  /**
   * Search roles by name
   */
  searchRoles: async (searchTerm: string): Promise<Role[]> => {
    try {
      // Add wildcard for partial matches
      const formattedSearchTerm = `%${searchTerm}%`;
      
      const result = await baseService.executeGraphQL<{ roles: Role[] }>(
        SEARCH_ROLES,
        { searchTerm: formattedSearchTerm }
      );
      
      if (!result.success || !result.data) {
        console.error(`Error searching roles with term "${searchTerm}":`, result.error);
        return [];
      }
      
      return result.data.roles;
    } catch (error) {
      console.error(`Error searching roles with term "${searchTerm}":`, error);
      return [];
    }
  },
  
  getRoleByName: async (roleName: string = "user"): Promise<string> => {
    try {
      const result = await baseService.executeGraphQL<{
        rolesCollection: { edges: Array<{ node: { id: string, name: string } }> }
      }>(
        GET_ROLE_BY_NAME,
        { name: roleName },
        { environment: 'server' }
      );

      if (!result.success || !result.data) {
        console.error('Error fetching user role:', result.error);
        return 'e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4'; // Fallback to hardcoded user role ID
      }

      const role = result.data?.rolesCollection.edges[0]?.node;
      if (!role?.id) {
        console.error('Error fetching user role: Role not found');
        return 'e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4'; // Fallback to hardcoded user role ID
      }

      return role.id;

    } catch (error) {
      console.error(`Error searching roles with term:`, error);
      return 'e1b0d2c1-79b0-48b4-94fd-60a7bbf2b7c4'; // Fallback to hardcoded user role ID
    }
  }
};
