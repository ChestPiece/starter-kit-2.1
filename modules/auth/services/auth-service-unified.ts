/**
 * Unified Auth Service
 * Uses BaseService for consistent error handling and client management
 * Replaces the existing auth-service.ts with enhanced functionality
 */

import { baseService, type ServiceResponse, type ClientEnvironment } from '@/lib/BaseService';
import { usersServiceUnified } from '../../users/services/users-service-unified';
import { emailService } from '@/lib/email-service';
import crypto from 'crypto';

// Auth types
export interface AuthSignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role_id?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata?: any;
  app_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
}

export interface PasswordResetRequest {
  email: string;
  type: 'user' | 'developer';
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  type: 'user' | 'developer';
}

export interface InviteUserData {
  email: string;
  role_id?: string;
  metadata?: any;
}

/**
 * Unified Auth Service Class
 */
export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Helper function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Sign up a new user
   */
  async signUp(
    signupData: AuthSignupData,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<AuthResponse>> {
    try {
      const client = baseService.getClient(options?.environment || 'client');
      
      const { data, error } = await client.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/auth/callback?type=signup&next=/auth/verify`,
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            role_id: signupData.role_id || "d9a0935b-9fe1-4550-8f7e-67639fd0c6f0"
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_SIGNUP_ERROR',
            message: error.message,
            details: error,
            timestamp: new Date().toISOString(),
          }
        };
      }

      if (data?.user) {
        // Update user metadata
        try {
          await client.auth.updateUser({
            data: {
              first_name: signupData.firstName,
              last_name: signupData.lastName,
              role_id: signupData.role_id || "d9a0935b-9fe1-4550-8f7e-67639fd0c6f0"
            }
          });
        } catch (metadataError) {
          console.error('Error updating user metadata:', metadataError);
        }
      }

      return {
        success: true,
        data: data as AuthResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_SIGNUP_ERROR',
          message: error?.message || 'Sign up failed',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Sign in a user
   */
  async signIn(
    email: string,
    password: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<AuthResponse>> {
    try {
      const client = baseService.getClient(options?.environment || 'client');
      
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_SIGNIN_ERROR',
            message: error.message,
            details: error,
            timestamp: new Date().toISOString(),
          }
        };
      }

      return {
        success: true,
        data: data as AuthResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_SIGNIN_ERROR',
          message: error?.message || 'Sign in failed',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Sign out a user
   */
  async signOut(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    try {
      const client = baseService.getClient(options?.environment || 'client');
      
      const { error } = await client.auth.signOut();

      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_SIGNOUT_ERROR',
            message: error.message,
            details: error,
            timestamp: new Date().toISOString(),
          }
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_SIGNOUT_ERROR',
          message: error?.message || 'Sign out failed',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Send user invites
   */
  async sendInvites(
    inviteData: InviteUserData[],
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<AuthUser[]>> {
    try {
      const client = baseService.getAdminClient();
      const results: AuthUser[] = [];

      for (const invite of inviteData) {
        const { data, error } = await client.auth.admin.createUser({
          email: invite.email,
          email_confirm: false,
          user_metadata: invite.metadata || {},
        });

        if (error) {
          throw new Error(`Failed to create user ${invite.email}: ${error.message}`);
        }

        if (data?.user) {
          // Send invite email
          try {
            await emailService.sendInviteEmail(
              invite.email,
              `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/auth/accept-invite/${data.user.id}`
            );
          } catch (emailError) {
            console.error('Error sending invite email:', emailError);
          }

          // Wait for auth user to be fully created before inserting into users table
          await this.delay(2000);

          try {
            // Create user profile
            await usersServiceUnified.createUser({
              id: data.user.id,
              email: data.user.email!,
              role_id: invite.role_id || "d9a0935b-9fe1-4550-8f7e-67639fd0c6f0",
              first_name: null,
              last_name: null,
              is_active: true,
            }, { environment: 'admin' });
          } catch (profileError) {
            console.error('Error creating user profile:', profileError);
          }

          results.push(data.user);
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_INVITE_ERROR',
          message: error?.message || 'Failed to send invites',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Accept an invite
   */
  async acceptInvite(
    token: string,
    password: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<AuthResponse>> {
    try {
      const client = baseService.getAdminClient();
      
      const { data: sessionData, error: sessionError } = await client.auth.admin.updateUserById(token, {
        password: password,
        email_confirm: true
      });

      if (sessionError) {
        return {
          success: false,
          error: {
            code: 'AUTH_INVITE_INVALID',
            message: 'Invalid or expired invite token',
            details: sessionError,
            timestamp: new Date().toISOString(),
          }
        };
      }

      if (!sessionData?.user) {
        return {
          success: false,
          error: {
            code: 'AUTH_INVITE_NO_USER',
            message: 'No user found for this token',
            details: null,
            timestamp: new Date().toISOString(),
          }
        };
      }

      return {
        success: true,
        data: sessionData as AuthResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_INVITE_ERROR',
          message: error?.message || 'Failed to accept invite',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Delete a user (auth and profile)
   */
  async deleteUser(
    id: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    try {
      // Delete user from Supabase Auth (requires admin privileges)
      const client = baseService.getAdminClient();
      const { error: authError } = await client.auth.admin.deleteUser(id);
      
      if (authError) {
        return {
          success: false,
          error: {
            code: 'AUTH_DELETE_ERROR',
            message: `Failed to delete user from Supabase Auth: ${authError.message}`,
            details: authError,
            timestamp: new Date().toISOString(),
          }
        };
      }

      // Delete user from database via users service
      const deleteResult = await usersServiceUnified.deleteUser(id, { environment: 'admin' });
      
      if (!deleteResult.success) {
        return deleteResult;
      }

      // Sign out the current user if they deleted themselves
      await this.signOut(options);

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_DELETE_ERROR',
          message: error?.message || 'Failed to delete user',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    resetData: PasswordResetRequest,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    try {
      // Find user by email
      let userId: string | null = null;
      
      if (resetData.type === "user") {
        const userResult = await baseService.read('user_profile', {
          select: 'id',
          filters: { email: resetData.email },
          environment: 'admin'
        });

        if (!userResult.success || !userResult.data || userResult.data.length === 0) {
          // Don't reveal if user exists for security
          return {
            success: true,
          };
        }

        userId = userResult.data[0].id;
      } else {
        return {
          success: false,
          error: {
            code: 'AUTH_RESET_TYPE_ERROR',
            message: 'Password reset type not supported',
            details: null,
            timestamp: new Date().toISOString(),
          }
        };
      }

      if (!userId) {
        return {
          success: true,
        };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      // Store token in password_resets table
      const insertResult = await baseService.create('password_resets', {
        user_id: userId,
        email: resetData.email,
        token,
        expires_at: expiresAt.toISOString(),
      }, { environment: 'admin' });

      if (!insertResult.success) {
        throw new Error('Failed to store reset token');
      }

      // Send email with reset link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
      const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;
      
      await emailService.sendEmail({
        to: resetData.email,
        subject: "Reset your password",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p><p>If you did not request this, ignore this email.</p>`
      });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_RESET_REQUEST_ERROR',
          message: 'Something went wrong, so please try again later.',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(
    resetData: PasswordResetData,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    try {
      // Find token in password_resets table
      const tokenResult = await baseService.read('password_resets', {
        select: 'id, user_id, expires_at, used_at',
        filters: { token: resetData.token },
        environment: 'admin'
      });

      if (!tokenResult.success || !tokenResult.data || tokenResult.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'AUTH_RESET_INVALID_TOKEN',
            message: 'Invalid or expired token',
            details: null,
            timestamp: new Date().toISOString(),
          }
        };
      }

      const tokenData = tokenResult.data[0];

      if (tokenData.used_at) {
        return {
          success: false,
          error: {
            code: 'AUTH_RESET_TOKEN_USED',
            message: 'Token already used',
            details: null,
            timestamp: new Date().toISOString(),
          }
        };
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return {
          success: false,
          error: {
            code: 'AUTH_RESET_TOKEN_EXPIRED',
            message: 'Token expired',
            details: null,
            timestamp: new Date().toISOString(),
          }
        };
      }

      // Update password using Supabase admin
      if (resetData.type !== "user") {
        return {
          success: false,
          error: {
            code: 'AUTH_RESET_TYPE_ERROR',
            message: 'Only user type supported',
            details: null,
            timestamp: new Date().toISOString(),
          }
        };
      }

      const client = baseService.getAdminClient();
      const { error: updateError } = await client.auth.admin.updateUserById(tokenData.user_id, { 
        password: resetData.newPassword 
      });

      if (updateError) {
        return {
          success: false,
          error: {
            code: 'AUTH_RESET_UPDATE_ERROR',
            message: updateError.message,
            details: updateError,
            timestamp: new Date().toISOString(),
          }
        };
      }

      // Mark token as used
      await baseService.update('password_resets', tokenData.id, {
        used_at: new Date().toISOString()
      }, { environment: 'admin' });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_RESET_ERROR',
          message: error?.message || 'Failed to reset password',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(
    userId: string,
    newPassword: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    try {
      const client = baseService.getAdminClient();
      const { data, error } = await client.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) {
        return {
          success: false,
          error: {
            code: 'AUTH_PASSWORD_UPDATE_ERROR',
            message: error.message,
            details: error,
            timestamp: new Date().toISOString(),
          }
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_PASSWORD_UPDATE_ERROR',
          message: error?.message || 'Failed to update password',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<AuthSession | null>> {
    try {
      const session = await baseService.getSession(options?.environment);
      return {
        success: true,
        data: session as AuthSession | null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_SESSION_ERROR',
          message: error?.message || 'Failed to get session',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<AuthUser | null>> {
    try {
      const user = await baseService.getCurrentUser(options?.environment);
      return {
        success: true,
        data: user as AuthUser | null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_USER_ERROR',
          message: error?.message || 'Failed to get user',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<boolean>> {
    try {
      const isAuth = await baseService.isAuthenticated(options?.environment);
      return {
        success: true,
        data: isAuth,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'AUTH_CHECK_ERROR',
          message: error?.message || 'Failed to check authentication',
          details: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
  }
}

// Export singleton instance
export const authServiceUnified = AuthService.getInstance();

// Export legacy functions for backward compatibility
export const authService = {
  signUp: (data: AuthSignupData) => authServiceUnified.signUp(data),
  signIn: (email: string, password: string) => authServiceUnified.signIn(email, password),
  signOut: () => authServiceUnified.signOut(),
  sendInvites: (emails: string[]) => authServiceUnified.sendInvites(emails.map(email => ({ email }))),
  acceptInvite: (token: string, password: string) => authServiceUnified.acceptInvite(token, password),
  deleteUser: (id: string) => authServiceUnified.deleteUser(id),
};
