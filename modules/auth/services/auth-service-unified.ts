import { getSupabaseClient } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ============================================================
   Types
============================================================ */

export interface AuthSignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role_id?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string;
    user_metadata?: any;
    app_metadata?: any;
    created_at?: string;
    updated_at?: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: any;
  } | null;
}

export interface PasswordResetRequest {
  email: string;
  type: "user" | "developer";
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  type: "user" | "developer";
}

export interface InviteUserData {
  email: string;
  role_id?: string;
  metadata?: any;
}

/* ============================================================
   Helper functions
============================================================ */

/**
 * Get appropriate Supabase client
 */
function getClient(type: 'client' | 'server' | 'admin' = 'client'): SupabaseClient {
  if (type === 'admin') {
    return supabaseAdmin;
  }
  return getSupabaseClient();
}

/* ============================================================
   Auth Service Functions
============================================================ */

/**
 * Sign up a new user
 */
export async function signUp(signupData: AuthSignupData): Promise<AuthResponse | null> {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"}/api/auth/callback?type=signup&next=/auth/verify`,
        data: {
          first_name: signupData.firstName,
          last_name: signupData.lastName,
          role_id: signupData.role_id || "d9a0935b-9fe1-4550-8f7e-67639fd0c6f0",
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error);
      return null;
    }

    return data as AuthResponse;
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse | null> {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return null;
    }

    return data as AuthResponse;
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<boolean> {
  try {
    const client = getClient('client');
    const { error } = await client.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<boolean> {
  try {
    const client = getClient('client');
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    return false;
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(newPassword: string): Promise<boolean> {
  try {
    const client = getClient('client');
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during password update:', error);
    return false;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
}

/**
 * Admin: Create invite
 */
// export async function createInvite(email: string, role_id?: string): Promise<{ success: boolean; userId?: string }> {
//   try {
//     const admin = getClient('admin');
    
//     // Create a new user without password
//     const { data, error } = await admin.auth.admin.createUser({
//       email,
//       email_confirm: false,
//     });

//     if (error) {
//       console.error('Create invite error:', error);
//       return { success: false };
//     }

//     return { 
//       success: true, 
//       userId: data.user.id
//     };
//   } catch (error) {
//     console.error('Unexpected error creating invite:', error);
//     return { success: false };
//   }
// }

/* ============================================================
   Unified service exports
============================================================ */

// Collect all functions for the unified service
export const authServiceUnified = {
  signIn,
  signUp,
  signOut,
  sendPasswordResetEmail,
  resetPassword,
  getSession,
  getUser,
  //createInvite,
};

// Legacy compatibility export
export const authService = {
  signIn,
  signUp,
  signOut,
  sendPasswordResetEmail,
  resetPassword,
  getSession,
  getUser,
};