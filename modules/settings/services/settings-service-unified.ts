/**
 * Unified Settings Service
 * Uses BaseService for consistent error handling and client management
 * Replaces both setting-service.ts and setting-service-client.ts
 */

import { baseService, type ServiceResponse, type ClientEnvironment } from '@/lib/BaseService';

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
 * Unified Settings Service Class
 */
export class SettingsService {
  private static instance: SettingsService;
  private readonly tableName = 'settings';
  private readonly settingsId = 1; // Settings uses a fixed ID

  private constructor() {}

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Get default settings configuration
   */
  private getDefaultSettings(): Settings {
    return {
      id: this.settingsId,
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
   * Get settings by ID (always returns settings for ID 1)
   */
  async getSettingsById(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<Settings>> {
    try {
      // First try to get existing settings
      const result = await baseService.readById<Settings>(
        this.tableName,
        this.settingsId.toString(),
        {
          environment: options?.environment,
        }
      );

      if (result.success && result.data) {
        return result as ServiceResponse<Settings>;
      }

      // If no settings exist, try to create default settings
      const defaultSettings = this.getDefaultSettings();
      
      try {
        const createResult = await this.insertSettings(defaultSettings, options);
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
          timestamp: new Date().toISOString(),
          requestId: `error_${Date.now()}`,
        }
      };
    }
  }

  /**
   * Update settings by ID
   */
  async updateSettingsById(
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

    const result = await baseService.update<Settings>(
      this.tableName,
      this.settingsId.toString(),
      cleanedData,
      {
        environment: options?.environment,
      }
    );

    if (!result.success) {
      return result;
    }

    return result;
  }

  /**
   * Insert new settings (internal use)
   */
  async insertSettings(
    insertData: Settings,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<Settings>> {
    return await baseService.create<Settings>(
      this.tableName,
      insertData,
      {
        environment: options?.environment,
      }
    );
  }

  /**
   * Reset settings to default values
   */
  async resetToDefaults(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<Settings>> {
    const defaultSettings = this.getDefaultSettings();
    const { id, ...updateData } = defaultSettings;
    
    return await this.updateSettingsById(updateData, options);
  }

  /**
   * Update theme settings
   */
  async updateTheme(
    themeData: {
      primary_color?: string;
      secondary_color?: string;
      appearance_theme?: 'light' | 'dark' | 'system';
    },
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<Settings>> {
    return await this.updateSettingsById(themeData, options);
  }

  /**
   * Update site branding
   */
  async updateBranding(
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
    return await this.updateSettingsById(brandingData, options);
  }

  /**
   * Update contact information
   */
  async updateContact(
    contactData: {
      contact_email?: string;
    },
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<Settings>> {
    return await this.updateSettingsById(contactData, options);
  }

  /**
   * Get current theme configuration
   */
  async getThemeConfig(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<{
    primary_color: string;
    secondary_color: string;
    appearance_theme: string;
  }>> {
    const result = await this.getSettingsById(options);
    
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
   */
  async isConfigured(
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<boolean>> {
    const result = await baseService.readById<Settings>(
      this.tableName,
      this.settingsId.toString(),
      {
        environment: options?.environment,
      }
    );

    return {
      success: true,
      data: result.success && !!result.data,
      meta: result.meta,
    };
  }
}

// Export singleton instance
export const settingsServiceUnified = SettingsService.getInstance();

// Export legacy functions for backward compatibility
export const settingsService = {
  getSettingsById: (environment?: ClientEnvironment) => 
    settingsServiceUnified.getSettingsById({ environment }),
  updateSettingsById: (updateData: UpdateSettingsData, environment?: ClientEnvironment) => 
    settingsServiceUnified.updateSettingsById(updateData, { environment }),
  insertSettings: (insertData: Settings, environment?: ClientEnvironment) => 
    settingsServiceUnified.insertSettings(insertData, { environment }),
};

// Client service compatibility
export const settingsServiceClient = settingsService;
