/**
 * Unified Auth Service
 * 
 * This service centralizes all authentication operations with consistent error handling
 * and response structures. It uses a functional approach with direct function exports.
 * 
 * Note: Auth operations use Supabase Auth directly as they're not database operations,
 * but we still provide a consistent interface and error handling.
 */

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

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
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

/**
 * Standardized error handler
 */
function handleError(error: any, operation: string): ServiceResponse<any> {
  return {
    success: false,
    error: {
      code: error?.code || "AUTH_ERROR",
      message: error?.message || `An unexpected error occurred during ${operation}`,
      details: error
    }
  };
}

/* ============================================================
   Auth Service Functions
============================================================ */

/**
 * Sign up a new user
 * 
 * @param signupData - User signup data including email and password
 */
export async function signUp(
  signupData: AuthSignupData
): Promise<ServiceResponse<AuthResponse>> {
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
      return handleError(error, "signup");
    }

    return {
      success: true,
      data: data as AuthResponse
    };
  } catch (error) {
    return handleError(error, "signup");
  }
}

/**
 * Sign in with email and password
 * 
 * @param email - User email
 * @param password - User password
 */
export async function signIn(
  email: string, 
  password: string
): Promise<ServiceResponse<AuthResponse>> {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return handleError(error, "sign-in");
    }

    return {
      success: true,
      data: data as AuthResponse
    };
  } catch (error) {
    return handleError(error, "sign-in");
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ServiceResponse<boolean>> {
  try {
    const client = getClient('client');
    const { error } = await client.auth.signOut();

    if (error) {
      return handleError(error, "sign-out");
    }

    return {
      success: true,
      data: true
    };
  } catch (error) {
    return handleError(error, "sign-out");
  }
}

/**
 * Send password reset email
 * 
 * @param email - Email address to send reset link to
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<ServiceResponse<boolean>> {
  try {
    const client = getClient('client');
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"}/auth/reset-password`,
    });

    if (error) {
      return handleError(error, "password-reset");
    }

    return {
      success: true,
      data: true
    };
  } catch (error) {
    return handleError(error, "password-reset");
  }
}

/**
 * Reset password with token
 * 
 * @param newPassword - New password to set
 */
export async function resetPassword(
  newPassword: string
): Promise<ServiceResponse<boolean>> {
  try {
    const client = getClient('client');
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return handleError(error, "password-update");
    }

    return {
      success: true,
      data: true
    };
  } catch (error) {
    return handleError(error, "password-update");
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<ServiceResponse<any>> {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.getSession();

    if (error) {
      return handleError(error, "get-session");
    }

    return {
      success: true,
      data: data.session
    };
  } catch (error) {
    return handleError(error, "get-session");
  }
}

/**
 * Get current user
 */
export async function getUser(): Promise<ServiceResponse<any>> {
  try {
    const client = getClient('client');
    const { data, error } = await client.auth.getUser();

    if (error) {
      return handleError(error, "get-user");
    }

    return {
      success: true,
      data: data.user
    };
  } catch (error) {
    return handleError(error, "get-user");
  }
}

/* ============================================================
   Service exports
============================================================ */

// Export all functions directly
export const authServiceUnified = {
  signIn,
  signUp,
  signOut,
  sendPasswordResetEmail,
  resetPassword,
  getSession,
  getUser,
};

// Legacy compatibility export
export const authService = {
  signIn: async (email: string, password: string) => {
    const result = await signIn(email, password);
    return result.success ? result.data : null;
  },
  signUp: async (signupData: AuthSignupData) => {
    const result = await signUp(signupData);
    return result.success ? result.data : null;
  },
  signOut: async () => {
    const result = await signOut();
    return result.success;
  },
  sendPasswordResetEmail: async (email: string) => {
    const result = await sendPasswordResetEmail(email);
    return result.success;
  },
  resetPassword: async (newPassword: string) => {
    const result = await resetPassword(newPassword);
    return result.success;
  },
  getSession: async () => {
    const result = await getSession();
    return result.success ? result.data : null;
  },
  getUser: async () => {
    const result = await getUser();
    return result.success ? result.data : null;
  },
};