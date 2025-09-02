import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Utility to clear authentication session and local storage
 * Use this when user is deleted from database but still has Supabase session
 */
export const clearAuthSession = async () => {
  try {
    const supabase = getSupabaseClient();
    
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear any local storage items related to auth
    localStorage.removeItem('signup_email');
    localStorage.removeItem('sb-supabase-auth-token');
    
    // Clear session storage
    sessionStorage.clear();
    
    console.log('Auth session cleared successfully');
    
    // Force page reload to ensure clean state
    window.location.href = '/auth/login';
    
  } catch (error) {
    console.error('Error clearing auth session:', error);
    // Force reload anyway
    window.location.href = '/auth/login';
  }
};

/**
 * Force logout and redirect - use in emergencies
 */
export const forceLogoutAndRedirect = () => {
  // Clear all storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
  
  // Force redirect
  window.location.href = '/auth/login';
};
