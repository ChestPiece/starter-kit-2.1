import { getSupabaseClient } from "@/lib/supabase/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const emailAuthService = {
  // Send email confirmation using Supabase's built-in functionality
  sendEmailConfirmation: async (email: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/auth/callback?type=signup&next=/auth/verify`
        }
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending email confirmation:', error);
      throw error;
    }
  },

  // Send password reset email using Supabase's built-in functionality
  sendPasswordReset: async (email: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/auth/reset-password`
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  },

  // Update password using Supabase's built-in functionality
  updatePassword: async (newPassword: string) => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

  // Verify email using session
  verifyEmail: async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!session) {
        throw new Error('No active session');
      }

      // If we have a session, the email is verified
      return { success: true, user: session.user };
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  // Check if email is verified
  isEmailVerified: async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return {
        isVerified: user?.email_confirmed_at ? true : false,
        user: user
      };
    } catch (error) {
      console.error('Error checking email verification:', error);
      return { isVerified: false, user: null };
    }
  }
};
