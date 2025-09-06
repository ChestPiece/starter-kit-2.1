/**
 * Unified Settings Service
 * 
 * This service centralizes all settings-related database operations using BaseService
 * for consistent error handling, response structures, and client management.
 * 
 * It uses a functional approach with direct function exports.
 */

import { baseService, type ServiceResponse, type ClientEnvironment } from '@/lib/BaseService';

// Constants
const TABLE_NAME = 'settings';
const SETTINGS_ID = 1; // Settings uses a fixed ID

// Settings types
export interface Settings {
  id: string | number;
  site_name: string;
  logo_url: string;
  logo_horizontal_url: string;
  favicon_url: string;
  logo_setting: 'square' | 'horizontal';
  primary_color: string;
  secondary_color: string;
  appearance_theme: 'light' | 'dark' | 'system';
  site_description: string;
  contact_email: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateSettingsData {
  site_name?: string;
  logo_url?: string;
  logo_horizontal_url?: string;
  favicon_url?: string;
  logo_setting?: 'square' | 'horizontal';
  primary_color?: string;
  secondary_color?: string;
  appearance_theme?: 'light' | 'dark' | 'system';
  site_description?: string;
  contact_email?: string;
}

/**
 * Get default settings configuration
 */
function getDefaultSettings(): Settings {
  return {
    id: SETTINGS_ID,
    site_name: process.env.NEXT_PUBLIC_SITE_NAME || "Starter Kit",
    logo_url: process.env.NEXT_PUBLIC_SITE_LOGO || "/favicon.ico",
    logo_horizontal_url: process.env.NEXT_PUBLIC_SITE_LOGO || "/favicon.ico",
    favicon_url: process.env.NEXT_PUBLIC_SITE_LOGO || "/favicon.ico",
    logo_setting: "square",
    primary_color: "#3b82f6",
    secondary_color: "#1e40af",
    appearance_theme: "light",
    site_description: "Starter Kit Application",
    contact_email: "support@example.com",
  };
}

/**
 * Insert new settings (internal use)
 * 
 * @param insertData - Settings data to insert
 * @param options - Options including environment (client/server/admin)
 */
export async function insertSettings(
  insertData: Settings,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  return await baseService.create<Settings>(
    TABLE_NAME,
    insertData,
    { environment: options?.environment }
  );
}

/**
 * Get settings by ID (always returns settings for ID 1)
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function getSettingsById(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  try {
    // First try to get existing settings
    const result = await baseService.readById<Settings>(
      TABLE_NAME,
      SETTINGS_ID.toString(),
      { environment: options?.environment }
    );

    if (result.success && result.data) {
      return result;
    }

    // If no settings exist, try to create default settings
    const defaultSettings = getDefaultSettings();
    
    try {
      const createResult = await insertSettings(defaultSettings, options);
      if (createResult.success && createResult.data) {
        return createResult;
      }
    } catch (insertError: any) {
      // If it's an RLS policy error, just return the default settings
      if (insertError?.code === '42501' || 
          insertError?.message?.includes('row-level security policy')) {
        return {
          success: true,
          data: defaultSettings,
          meta: {
            requestId: `fallback_${Date.now()}`,
          }
        };
      }
    }

    // Return default settings as fallback
    return {
      success: true,
      data: defaultSettings,
      meta: {
        requestId: `fallback_${Date.now()}`,
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'SETTINGS_FETCH_ERROR',
        message: error?.message || 'Failed to fetch settings',
        details: error,
      }
    };
  }
}

/**
 * Update settings by ID
 * 
 * @param updateData - Settings data to update
 * @param options - Options including environment (client/server/admin)
 */
export async function updateSettingsById(
  updateData: UpdateSettingsData,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  // Remove undefined values
  const cleanedData: any = {};
  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanedData[key] = value;
    }
  });

  return await baseService.update<Settings>(
    TABLE_NAME,
    SETTINGS_ID.toString(),
    cleanedData,
    { environment: options?.environment }
  );
}

/**
 * Reset settings to default values
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function resetToDefaults(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  const defaultSettings = getDefaultSettings();
  const { id, ...updateData } = defaultSettings;
  
  return await updateSettingsById(updateData, options);
}

/**
 * Update theme settings
 * 
 * @param themeData - Theme data to update
 * @param options - Options including environment (client/server/admin)
 */
export async function updateTheme(
  themeData: {
    primary_color?: string;
    secondary_color?: string;
    appearance_theme?: 'light' | 'dark' | 'system';
  },
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  return await updateSettingsById(themeData, options);
}

/**
 * Update site branding
 * 
 * @param brandingData - Branding data to update
 * @param options - Options including environment (client/server/admin)
 */
export async function updateBranding(
  brandingData: {
    site_name?: string;
    logo_url?: string;
    logo_horizontal_url?: string;
    favicon_url?: string;
    logo_setting?: 'square' | 'horizontal';
    site_description?: string;
  },
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  return await updateSettingsById(brandingData, options);
}

/**
 * Update contact information
 * 
 * @param contactData - Contact data to update
 * @param options - Options including environment (client/server/admin)
 */
export async function updateContact(
  contactData: {
    contact_email?: string;
  },
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<Settings>> {
  return await updateSettingsById(contactData, options);
}

/**
 * Get current theme configuration
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function getThemeConfig(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<{
  primary_color: string;
  secondary_color: string;
  appearance_theme: string;
}>> {
  const result = await getSettingsById(options);
  
  if (!result.success || !result.data) {
    return result as ServiceResponse<any>;
  }

  return {
    success: true,
    data: {
      primary_color: result.data.primary_color,
      secondary_color: result.data.secondary_color,
      appearance_theme: result.data.appearance_theme,
    },
    meta: result.meta,
  };
}

/**
 * Check if settings are configured (not using defaults)
 * 
 * @param options - Options including environment (client/server/admin)
 */
export async function isConfigured(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<boolean>> {
  const result = await baseService.readById<Settings>(
    TABLE_NAME,
    SETTINGS_ID.toString(),
    { environment: options?.environment }
  );

  return {
    success: true,
    data: result.success && !!result.data,
    meta: result.meta,
  };
}

// Export all functions directly
export const settingsServiceUnified = {
  getSettingsById,
  updateSettingsById,
  insertSettings,
  resetToDefaults,
  updateTheme,
  updateBranding,
  updateContact,
  getThemeConfig,
  isConfigured
};

// Export legacy functions for backward compatibility
export const settingsService = {
  getSettingsById: (environment?: ClientEnvironment) => 
    getSettingsById({ environment }),
  updateSettingsById: (updateData: UpdateSettingsData, environment?: ClientEnvironment) => 
    updateSettingsById(updateData, { environment }),
  insertSettings: (insertData: Settings, environment?: ClientEnvironment) => 
    insertSettings(insertData, { environment }),
};

// Client service compatibility
export const settingsServiceClient = settingsService;