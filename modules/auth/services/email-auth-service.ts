/**
 * Email Authentication Service
 * 
 * This service centralizes all email-related authentication operations
 * with consistent error handling and response structures.
 * 
 * It uses a functional approach with direct function exports.
 */

import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Standard service response type
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Standardized error handler
 */
function handleError(error: any, operation: string): ServiceResponse<any> {
  return {
    success: false,
    error: {
      code: error?.code || "EMAIL_AUTH_ERROR",
      message: error?.message || `An unexpected error occurred during ${operation}`,
      details: error
    }
  };
}

/**
 * Send signup confirmation email
 * 
 * @param email - The email address to send confirmation to
 * @param metadata - Optional metadata including first and last name
 */
export async function sendEmailConfirmation(
  email: string,
  metadata?: { firstName?: string | null; lastName?: string | null }
): Promise<ServiceResponse<boolean>> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"
        }/api/auth/callback?type=signup&next=/auth/verify`,
      },
    });

    if (error) {
      return handleError(error, "email-confirmation");
    }
    
    return { 
      success: true,
      data: true
    };
  } catch (error) {
    return handleError(error, "email-confirmation");
  }
}

/**
 * Send password reset email
 * 
 * @param email - The email address to send reset link to
 */
export async function sendPasswordReset(
  email: string
): Promise<ServiceResponse<boolean>> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"
      }/auth/reset-password`,
    });

    if (error) {
      return handleError(error, "password-reset-email");
    }
    
    return { 
      success: true,
      data: true
    };
  } catch (error) {
    return handleError(error, "password-reset-email");
  }
}

/**
 * Update password after reset
 * 
 * @param newPassword - The new password to set
 */
export async function updatePassword(
  newPassword: string
): Promise<ServiceResponse<boolean>> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return handleError(error, "update-password");
    }
    
    return { 
      success: true,
      data: true
    };
  } catch (error) {
    return handleError(error, "update-password");
  }
}

/**
 * Verify email from session
 */
export async function verifyEmail(): Promise<ServiceResponse<any>> {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return handleError(error, "verify-email");
    }
    
    if (!session) {
      return {
        success: false,
        error: {
          code: "NO_SESSION",
          message: "No active session found"
        }
      };
    }

    return { 
      success: true,
      data: { user: session.user }
    };
  } catch (error) {
    return handleError(error, "verify-email");
  }
}

/**
 * Check if user email is verified
 */
export async function isEmailVerified(): Promise<ServiceResponse<{ isVerified: boolean, user: any }>> {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return handleError(error, "check-email-verification");
    }

    return {
      success: true,
      data: {
        isVerified: Boolean(user?.email_confirmed_at),
        user,
      }
    };
  } catch (error) {
    return handleError(error, "check-email-verification");
  }
}

// Export individual functions directly
export const emailAuthServiceFunctions = {
  sendEmailConfirmation,
  sendPasswordReset,
  updatePassword,
  verifyEmail,
  isEmailVerified,
};

// Legacy compatibility export
export const emailAuthService = {
  sendEmailConfirmation: async (
    email: string,
    metadata?: { firstName?: string | null; lastName?: string | null }
  ) => {
    const result = await sendEmailConfirmation(email, metadata);
    if (!result.success) throw result.error;
    return { success: true };
  },
  
  sendPasswordReset: async (email: string) => {
    const result = await sendPasswordReset(email);
    if (!result.success) throw result.error;
    return { success: true };
  },
  
  updatePassword: async (newPassword: string) => {
    const result = await updatePassword(newPassword);
    if (!result.success) throw result.error;
    return { success: true };
  },
  
  verifyEmail: async () => {
    const result = await verifyEmail();
    if (!result.success) throw result.error;
    return { success: true, user: result.data.user };
  },
  
  isEmailVerified: async () => {
    const result = await isEmailVerified();
    if (!result.success) throw result.error;
    return result.data;
  },
};