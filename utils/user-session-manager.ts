import { toast } from "sonner";

/**
 * Utility functions for managing user session state changes
 */
export class UserSessionManager {
  
  /**
   * Handle user logout with proper notifications and enhanced logging
   */
  static async handleUserLogout(reason: string, redirectPath: string = '/auth/login') {
    const logoutId = `logout_${Date.now().toString(36)}`;
    console.log(`[UserLogout:${logoutId}] User logout triggered:`, {
      reason,
      redirectPath,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 100) : 'server-side'
    });
    
    try {
      // Show notification to user
      toast.error("Your session has ended", {
        description: reason,
        duration: 5000,
      });
      
      // Log session information before clearing
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          // Check if any session data exists without logging sensitive data
          const hasAuthData = !!window.localStorage.getItem('sb-supabase-auth-token');
          console.log(`[UserLogout:${logoutId}] Session state before logout:`, {
            hasAuthData,
            hasLocalStorage: true,
            pathname: window.location.pathname,
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.error(`[UserLogout:${logoutId}] Error checking local storage:`, e);
        }
      }

      // Small delay to ensure user sees the notification before redirect
      console.log(`[UserLogout:${logoutId}] Scheduling redirect to ${redirectPath} in 1000ms`);
      
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          console.log(`[UserLogout:${logoutId}] Executing redirect to ${redirectPath}`);
          window.location.href = redirectPath;
        }
      }, 1000);
    } catch (error) {
      // Fallback in case of any errors during logout process
      console.error(`[UserLogout:${logoutId}] Error during logout:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      // Force redirect even if there was an error
      if (typeof window !== 'undefined') {
        console.log(`[UserLogout:${logoutId}] Forcing redirect after error`);
        window.location.href = redirectPath;
      }
    }
  }

  /**
   * Handle real-time user updates with improved logging
   */
  static handleUserUpdate(updatedUser: any, setUserProfile: (profile: any) => void) {
    const updateId = `update_${Date.now().toString(36)}`;
    
    console.log(`[UserUpdate:${updateId}] Processing user profile update:`, {
      userId: updatedUser?.id,
      hasFirstName: !!updatedUser?.first_name,
      hasLastName: !!updatedUser?.last_name,
      isActive: updatedUser?.is_active,
      roleId: updatedUser?.role_id,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Update user profile in application state
      setUserProfile(updatedUser);
      
      // Notify user of profile changes
      toast.info("Your profile has been updated", {
        duration: 3000,
      });
      
      console.log(`[UserUpdate:${updateId}] User profile updated successfully in state`);
    } catch (error) {
      console.error(`[UserUpdate:${updateId}] Error updating user profile in state:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate user session against database with enhanced error handling
   */
  static async validateUserSession(userId: string, getUserById: (id: string) => Promise<any>) {
    const validationId = `vreq_${Date.now().toString(36)}`;
    console.log(`[SessionValidation:${validationId}] Starting validation for user ${userId}`);
    
    try {
      const startTime = performance.now();
      const userResult = await getUserById(userId);
      const duration = Math.round(performance.now() - startTime);
      
      // Check if the result is a ServiceResponse (follows BaseService pattern)
      if (userResult && typeof userResult === 'object' && 'success' in userResult) {
        // Handle BaseService response format
        if (!userResult.success) {
          console.error(`[SessionValidation:${validationId}] Service error during validation:`, {
            error: userResult.error,
            userId,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
          return {
            isValid: false,
            reason: 'Session validation failed: service error',
            errorCode: userResult.error?.code || 'UNKNOWN_ERROR'
          };
        }
        
        // Check if user exists
        const userData = userResult.data;
        if (!userData) {
          console.log(`[SessionValidation:${validationId}] User not found:`, {
            userId,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
          return {
            isValid: false,
            reason: 'Your account no longer exists',
            errorCode: 'USER_NOT_FOUND'
          };
        }
        
        // Check if user is active
        if (!userData.is_active) {
          console.log(`[SessionValidation:${validationId}] User account deactivated:`, {
            userId,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
          return {
            isValid: false,
            reason: 'Your account has been deactivated',
            errorCode: 'USER_DEACTIVATED'
          };
        }
        
        // Validation successful
        console.log(`[SessionValidation:${validationId}] Validation successful:`, {
          userId,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        return {
          isValid: true,
          user: userData
        };
      } else {
        // Handle direct user object response (legacy format)
        const user = userResult;
        
        if (!user) {
          console.log(`[SessionValidation:${validationId}] User not found (legacy format):`, {
            userId,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
          return {
            isValid: false,
            reason: 'User account no longer exists',
            errorCode: 'USER_NOT_FOUND'
          };
        }

        if (!user.is_active) {
          console.log(`[SessionValidation:${validationId}] User account deactivated (legacy format):`, {
            userId,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
          });
          return {
            isValid: false,
            reason: 'Your account has been deactivated',
            errorCode: 'USER_DEACTIVATED'
          };
        }
        
        console.log(`[SessionValidation:${validationId}] Validation successful (legacy format):`, {
          userId,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
        return {
          isValid: true,
          user
        };
      }
    } catch (error) {
      console.error(`[SessionValidation:${validationId}] Error during validation:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        timestamp: new Date().toISOString()
      });
      
      return {
        isValid: false,
        reason: 'Unable to verify your session',
        errorCode: 'VALIDATION_ERROR'
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

