import { toast } from "sonner";

/**
 * Utility functions for managing user session state changes
 */
export class UserSessionManager {
  
  /**
   * Handle user logout with proper notifications
   */
  static async handleUserLogout(reason: string, redirectPath: string = '/auth/login') {
    console.log(`User logout triggered: ${reason}`);
    
    // Show notification to user
    toast.error("Your session has ended", {
      description: reason,
      duration: 5000,
    });

    // Small delay to ensure user sees the notification before redirect
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      }
    }, 1000);
  }

  /**
   * Handle real-time user updates
   */
  static handleUserUpdate(updatedUser: any, setUserProfile: (profile: any) => void) {
    console.log('Processing user profile update:', updatedUser);
    
    // Update user profile in application state
    setUserProfile(updatedUser);
    
    // Notify user of profile changes (optional)
    toast.info("Your profile has been updated", {
      duration: 3000,
    });
  }

  /**
   * Validate user session against database
   */
  static async validateUserSession(userId: string, getUserById: (id: string) => Promise<any>) {
    try {
      const user = await getUserById(userId);
      
      if (!user) {
        return {
          isValid: false,
          reason: 'User account no longer exists'
        };
      }

      if (!user.is_active) {
        return {
          isValid: false,
          reason: 'Your account has been deactivated'
        };
      }

      return {
        isValid: true,
        user
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        isValid: false,
        reason: 'Unable to verify your session'
      };
    }
  }
}

/**
 * Configuration for real-time subscriptions
 */
export const REALTIME_CONFIG = {
  // How often to perform periodic validation (in milliseconds)
  VALIDATION_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Supabase real-time channel naming
  getUserChannelName: (userId: string) => `user_changes_${userId}`,
  
  // Tables to monitor
  MONITORED_TABLES: {
    USERS: 'users'
  },
  
  // Events to listen for
  EVENTS: {
    ALL: '*',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    INSERT: 'INSERT'
  }
};
