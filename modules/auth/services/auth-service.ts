import { emailService } from "@/lib/email-service";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { rolesService } from "@/modules/roles";
import { usersService } from "@/modules/users";

export interface AuthSignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role_id?: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  signUp: async ({ email, password, firstName, lastName, role_id = "" }: AuthSignupData) => {
    // Use singleton client to avoid multiple GoTrueClient instances
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data?.user) {
      // Wait a moment for the auth user to be fully created before inserting into users table
      await delay(2000);
      try {
        // Get the default user role using GraphQL
        const roleId = await rolesService.getRoleByName();
        const payload = {
          id: data?.user?.id,
          email: data?.user?.email,
          role_id: role_id || roleId,
          first_name: firstName || null,
          last_name: lastName || null,
          is_active: true,
        }
        // Insert the user into the users table using GraphQL
        await usersService.insertUser(payload)
      } catch (profileError) {
        console.error('Error in profile creation:', profileError);
      }
    }

    return data;
  },

  signIn: async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;

    return data;
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  sendInvites: async (emails: string[]) => {
    const supabase = createAdminClient();
    for (const email of emails) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
      });
      if (error) throw error;

      emailService.sendInviteEmail(email, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/auth/accept-invite/${data?.user?.id}`)
      if (data?.user) {
        // Wait a moment for the auth user to be fully created before inserting into users table
        await delay(2000);
        try {
          // Get the default user role using GraphQL
          const roleId = await rolesService.getRoleByName();
          const payload = {
            id: data?.user?.id,
            email: data?.user?.email,
            role_id: roleId,
            first_name: null,
            last_name: null,
            is_active: true,
          }
          // Insert the user into the users table using GraphQL
          await usersService.insertUser(payload)
        } catch (profileError) {
          console.error('Error in profile creation:', profileError);
        }
      }
      return data;
    }
  },

  acceptInvite: async (token: string, password: string) => {
    try {
      // Exchange the token for a session
      const supabase = createAdminClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.updateUserById(token, {
        password: password,
        email_confirm:  true
      });
      if (sessionError) {
        throw new Error('Invalid or expired invite token');
      }

      if (!sessionData?.user) {
        throw new Error('No user found for this token');
      }
      return sessionData;
    } catch (error) {
      console.error('Error in acceptInvite:', error);
      throw error;
    }
  },
  deleteUser: async (id: string) => {
    try {
      // Delete user from Supabase Auth (requires admin privileges)
      const supabase = createAdminClient();
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        throw new Error(`Failed to delete user from Supabase Auth: ${authError.message}`);
      }

      // Delete user from database via users service
      await usersService.deleteUser(id);

      // Sign out the current user
      await authService.signOut();

      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

}; 