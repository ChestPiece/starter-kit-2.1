import { supabase } from '@/lib/supabase-auth-client';
import { DELETE_USER, GET_USERS, GET_USERS_BY_ID, GET_USERS_COUNT, GET_USERS_PAGINATION, INSERT_USER, UPDATE_USER } from "./users-graphql";
import { executeGraphQLBackend } from "@/lib/graphql-server";

export const usersService = {
  /**
   * Insert a user
   */
  insertUser: async (data: any) => {
    await executeGraphQLBackend(INSERT_USER, {
      objects: [
        {
          id: data.id,
          email: data.email,
          role_id: data.role_id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          is_active: true,
          profile: data.profile || null,
        }
      ]
    })
  },
  /**
   * Create a user - wrapper for insertUser
   */
  createUser: async (data: any) => {
    return await usersService.insertUser(data);
  },
  /**
   * Get all users
   */
  getUsers: async () => {
    const response = await executeGraphQLBackend(GET_USERS);
    return response.user_profileCollection.edges.map((edge: any) => edge.node);
  },
  getUsersPagination: async (search: string, limit: number, offset: number) => {
    const response = await executeGraphQLBackend(GET_USERS_PAGINATION, { search, limit, offset });
    const countResponse = await executeGraphQLBackend(GET_USERS_COUNT, { search });
    return {
      users: response.user_profileCollection.edges.map((edge: any) => edge.node),
      totalCount: countResponse.user_profileCollection.edges.length
    };
  },
  /**
   * Update a user
   */
  updateUser: async (data: any): Promise<void> => {
    try {
      const response = await executeGraphQLBackend(UPDATE_USER, {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        role_id: data.role_id,
        profile: data.profile,
        is_active: data.is_active
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  },
  /**
   * Delete a user from both GraphQL database and Supabase Auth
   */
  deleteUser: async (id: string): Promise<void> => {
    try {
      // Delete user from GraphQL database
      await executeGraphQLBackend(DELETE_USER, { id });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  /**
   * Get a user by id
   */
  getUserById: async (id: string) => {
    try {
      const response = await executeGraphQLBackend(GET_USERS_BY_ID, { id });
      return response.user_profileCollection.edges[0].node;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }
}; 