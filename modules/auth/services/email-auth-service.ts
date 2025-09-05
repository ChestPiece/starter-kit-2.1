import { getSupabaseClient } from "@/lib/supabase/client";

export const emailAuthService = {
  // Send signup confirmation email
  sendEmailConfirmation: async (
    email: string,
    metadata?: { firstName?: string | null; lastName?: string | null }
  ) => {
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

    if (error) throw error;
    return { success: true };
  },

  // Send password reset email
  sendPasswordReset: async (email: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"
      }/auth/reset-password`,
    });

    if (error) throw error;
    return { success: true };
  },

  // Update password after reset
  updatePassword: async (newPassword: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true };
  },

  // Verify email from session
  verifyEmail: async () => {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) throw new Error("No active session");

    return { success: true, user: session.user };
  },

  // Check if user email is verified
  isEmailVerified: async () => {
    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    return {
      isVerified: Boolean(user?.email_confirmed_at),
      user,
    };
  },
};
