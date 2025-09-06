"use server";

/**
 * Auth Actions
 * 
 * Server-side actions for authentication operations.
 * Uses BaseService for database operations and admin client for auth operations.
 */

import { emailService } from "../email-service";
import { createAdminClient } from "../supabase/admin";
import { baseService } from "../BaseService";
import crypto from "crypto";

/**
 * Delete a user from Supabase auth
 * This must be run as a server action
 * 
 * @param userId - User ID to delete
 * @param type - Type of user ('user' or other)
 */
export async function deleteAuthUser(userId: string, type: string) {
  try {
    let error: any = null;
    let data: any = null;   
    // First check if user exists in auth
    if(type === 'user'){
      const supabase = createAdminClient();
      const { data: user, error: checkError } = await supabase.auth.admin.deleteUser(userId);
      error = checkError;
      data = user;
    } 
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // If user doesn't exist in auth, return success (already deleted)
    if (!data) {
      return { success: true, message: "User not found in auth, already deleted." };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting auth user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error deleting auth user" 
    };
  }
}

/**
 * Create a new user in Supabase auth
 * This must be run as a server action
 * 
 * @param email - User email
 * @param password - User password
 * @param metadata - User metadata
 * @param type - Type of user ('user' or other)
 */
export async function createAuthUser(email: string, password: string, metadata: object = {}, type: string) {
  try {
    let error: any = null;
    let data: any = null;
    if(type === 'user'){
      const supabase = createAdminClient();
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      error = userError;
      data = userData;
    } 
    if (error) {
      console.error("Error creating auth user:", error);
      return { success: false, error: error.message, user: null };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Unexpected error creating auth user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error creating auth user",
      user: null
    };
  }
} 

/**
 * Request a password reset: generates a token, stores it, and sends an email
 * 
 * @param email - User email
 * @param type - Type of user ('user' or other)
 */
export async function requestPasswordReset(email: string, type: string) {
  try {
    // 1. Find user by email
    let userId: string | null = null;
    if (type === "user") {
      // Define interface for user type
      interface UserProfile {
        id: string;
        email: string;
      }
      
      // Using BaseService to query user by email
      const result = await baseService.paginate<UserProfile>("user_profile", {
        search: email,
        searchFields: ["email"]
      }, {
        select: "id",
        environment: "admin"
      });
      
      if (!result.success || !result.data || result.data.data.length === 0) {
        throw new Error("User not found");
      }
      
      userId = result.data.data[0].id;
    } else if (type === "developer") {
      // Add developer logic if needed
      return { success: false, error: "Developer reset not implemented" };
    }
    
    if (!userId) throw new Error("User not found");

    // 2. Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // 3. Store token in password_resets table using BaseService
    const insertResult = await baseService.create(
      "password_resets",
      {
        user_id: userId,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      },
      { environment: "admin" }
    );
    
    if (!insertResult.success) {
      throw new Error(insertResult.error?.message || "Error storing reset token");
    }

    // 4. Send email with reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010";
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;
    await emailService.sendEmail({
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p><p>If you did not request this, ignore this email.</p>`
    });
    
    return { success: true };
  } catch (error) {
    return { 
      success: false,
      error: "Something went wrong, so please try again later."
    };
  }
}

/**
 * Reset password using a token
 * 
 * @param token - Reset token
 * @param newPassword - New password
 * @param type - Type of user ('user' or other)
 */
export async function resetPassword(token: string, newPassword: string, type: string) {
  try {
    // Define type for password reset record
    interface PasswordReset {
      id: string;
      user_id: string;
      expires_at: string;
      used_at: string | null;
      token: string;
    }

    // Using BaseService to query password_resets by token
    const tokenResult = await baseService.paginate<PasswordReset>("password_resets", {
      search: token,
      searchFields: ["token"]
    }, {
      select: "id, user_id, expires_at, used_at, token",
      environment: "admin"
    });
    
    if (!tokenResult.success || !tokenResult.data || tokenResult.data.data.length === 0) {
      throw new Error("Invalid or expired token");
    }
    
    const data = tokenResult.data.data[0];
    if (data.used_at) throw new Error("Token already used");
    if (new Date(data.expires_at) < new Date()) throw new Error("Token expired");

    // 2. Update password using Supabase admin
    if (type !== "user") throw new Error("Only user type supported");
    const supabase = createAdminClient();
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      data.user_id, 
      { password: newPassword }
    );
    
    if (updateError) throw new Error(updateError.message);

    // 3. Mark token as used using BaseService
    await baseService.update(
      "password_resets",
      data.id,
      { used_at: new Date().toISOString() },
      { environment: "admin" }
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 

/**
 * Update user password using admin API
 * This must be run as a server action
 * 
 * @param userId - User ID
 * @param newPassword - New password
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error updating password"
    };
  }
}