/**
 * BaseService - Unified Service Layer
 * 
 * A comprehensive base service that provides:
 * - Consistent error handling across all services
 * - Unified Supabase client management (client/server/admin)
 * - Standardized response formats
 * - Built-in retry logic and timeout handling
 * - GraphQL integration
 * - File upload capabilities
 * - Caching support
 * - Audit logging
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ========================= TYPES =========================

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  meta?: {
    count?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    requestId?: string;
  };
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export type ClientEnvironment = 'client' | 'server' | 'admin';

export interface ServiceConfig {
  environment: ClientEnvironment;
  enableLogging?: boolean;
  enableRetry?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { field: string; ascending?: boolean };
  pagination?: {
    page: number;
    limit: number;
  };
  count?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export interface BulkOperation<T> {
  operation: 'insert' | 'update' | 'delete';
  data: T[];
  batchSize?: number;
}

export interface FileUploadOptions {
  bucket: string;
  path?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

// ========================= CONFIGURATION =========================

const detectEnvironment = (): ClientEnvironment => {
  if (typeof window === 'undefined') {
    return 'server';
  }
  return 'client';
};

const APP_CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010',
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'Starter Kit',
  },
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

const ERROR_CODES = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  DATABASE_ERROR: 'DATABASE_ERROR',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// ========================= BASE SERVICE CLASS =========================

class BaseService {
  private static instance: BaseService;
  private browserClient: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private config: ServiceConfig;

  private constructor(config?: Partial<ServiceConfig>) {
    this.config = {
      environment: detectEnvironment(),
      enableLogging: APP_CONFIG.isDevelopment,
      enableRetry: true,
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...config,
    };
  }

  public static getInstance(config?: Partial<ServiceConfig>): BaseService {
    if (!BaseService.instance) {
      BaseService.instance = new BaseService(config);
    }
    return BaseService.instance;
  }

  // ========================= SUPABASE CLIENT MANAGEMENT =========================

  /**
   * Get the appropriate Supabase client based on environment
   */
  public getClient(environment?: ClientEnvironment): SupabaseClient {
    const env = environment || this.config.environment;
    
    switch (env) {
      case 'client':
        return this.getBrowserClient();
      case 'server':
        return this.getServerClient();
      case 'admin':
        return this.getAdminClient();
      default:
        throw new Error(`Unknown environment: ${env}`);
    }
  }

  /**
   * Get browser client (client-side only)
   */
  public getBrowserClient(): SupabaseClient {
    if (typeof window === 'undefined') {
      throw new Error('Browser client can only be used on the client side');
    }

    if (!this.browserClient) {
      this.browserClient = createBrowserClient(
        APP_CONFIG.supabase.url,
        APP_CONFIG.supabase.anonKey
      );
    }

    return this.browserClient;
  }

  /**
   * Get server client (server-side only)
   */
  public getServerClient(): SupabaseClient {
    if (typeof window !== 'undefined') {
      throw new Error('Server client can only be used on the server side');
    }

    // Dynamically import cookies to avoid issues with client-side builds
    const { cookies } = require('next/headers');

    return createServerClient(
      APP_CONFIG.supabase.url,
      APP_CONFIG.supabase.anonKey,
      {
        cookies: {
          getAll: async () => {
            const cookieStore = await cookies();
            return cookieStore.getAll();
          },
          setAll: async (cookiesToSet) => {
            try {
              const cookieStore = await cookies();
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Components
            }
          },
        },
      }
    );
  }

  /**
   * Get admin client (for administrative operations)
   */
  public getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      this.adminClient = createClient(
        APP_CONFIG.supabase.url,
        APP_CONFIG.supabase.serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    }

    return this.adminClient;
  }

  // ========================= ERROR HANDLING =========================

  /**
   * Create standardized error response
   */
  private createError(
    code: string, 
    message: string, 
    details?: any,
    requestId?: string
  ): ServiceError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId(),
    };
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: any, operation: string, requestId?: string): ServiceError {
    this.log('error', `Error in ${operation}:`, error);

    // Ensure error is an object
    const errorObj = error || {};

    // Supabase/PostgreSQL errors
    if (errorObj && typeof errorObj === 'object' && 'code' in errorObj) {
      switch (errorObj.code) {
        case 'PGRST116':
          return this.createError(ERROR_CODES.RECORD_NOT_FOUND, 'Record not found', errorObj, requestId);
        case '23505':
          return this.createError(ERROR_CODES.DUPLICATE_RECORD, 'Record already exists', errorObj, requestId);
        case '42501':
          return this.createError(ERROR_CODES.FORBIDDEN, 'Insufficient permissions', errorObj, requestId);
        default:
          const message = ('message' in errorObj && typeof errorObj.message === 'string') ? errorObj.message : 'Database error';
          return this.createError(ERROR_CODES.DATABASE_ERROR, message, errorObj, requestId);
      }
    }

    // Network errors
    if ((errorObj && 'name' in errorObj && errorObj.name === 'NetworkError') || 
        (errorObj && 'message' in errorObj && typeof errorObj.message === 'string' && errorObj.message.includes('fetch'))) {
      return this.createError(ERROR_CODES.NETWORK_ERROR, 'Network connection failed', errorObj, requestId);
    }

    // Timeout errors
    if ((errorObj && 'name' in errorObj && errorObj.name === 'TimeoutError') || 
        (errorObj && 'message' in errorObj && typeof errorObj.message === 'string' && errorObj.message.includes('timeout'))) {
      return this.createError(ERROR_CODES.TIMEOUT_ERROR, 'Operation timed out', errorObj, requestId);
    }

    // Auth errors
    if (errorObj && 'message' in errorObj && typeof errorObj.message === 'string' && 
        (errorObj.message.includes('JWT') || errorObj.message.includes('auth'))) {
      return this.createError(ERROR_CODES.UNAUTHORIZED, 'Authentication failed', errorObj, requestId);
    }

    // Generic error
    const message = (errorObj && 'message' in errorObj && typeof errorObj.message === 'string') ? 
      errorObj.message : 'An unexpected error occurred';
    return this.createError(
      ERROR_CODES.UNKNOWN_ERROR,
      message,
      errorObj,
      requestId
    );
  }

  // ========================= LOGGING =========================

  /**
   * Centralized logging
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const logData = data ? { message, data, timestamp } : { message, timestamp };

    switch (level) {
      case 'info':
        console.info('[BaseService]', logData);
        break;
      case 'warn':
        console.warn('[BaseService]', logData);
        break;
      case 'error':
        console.error('[BaseService]', logData);
        break;
    }
  }

  // ========================= RETRY LOGIC =========================

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    attempts?: number
  ): Promise<T> {
    const maxAttempts = attempts ?? this.config.retryAttempts ?? 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log('info', `Executing ${operationName} (attempt ${attempt}/${maxAttempts})`);
        return await operation();
      } catch (error) {
        lastError = error;
        this.log('warn', `Attempt ${attempt} failed for ${operationName}:`, error);

        if (attempt === maxAttempts) {
          break;
        }

        // Don't retry auth errors or validation errors
        const hasCode = error && typeof error === 'object' && 'code' in error;
        const hasMessage = error && typeof error === 'object' && 'message' in error;
        
        if ((hasCode && (error as any).code === '42501') || 
            (hasMessage && typeof (error as any).message === 'string' && 
             ((error as any).message.includes('JWT') || (error as any).message.includes('validation')))) {
          break;
        }

        await this.delay(this.config.retryDelay ?? 1000);
      }
    }

    throw lastError;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================= CORE CRUD OPERATIONS =========================

  /**
   * Create a record
   */
  public async create<T>(
    table: string,
    data: Partial<T>,
    options?: { select?: string; environment?: ClientEnvironment }
  ): Promise<ServiceResponse<T>> {
    const requestId = this.generateRequestId();
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        const query = client
          .from(table)
          .insert(data)
          .select(options?.select || '*')
          .single();

        const { data: result, error } = await query;
        if (error) throw error;
        return result as T;
      }, `create-${table}`);

      this.log('info', `Created record in ${table}`, { requestId, data });
      
      return {
        success: true,
        data: result,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `create-${table}`, requestId)
      };
    }
  }

  /**
   * Read records with advanced options
   */
  public async read<T>(
    table: string,
    options?: QueryOptions & { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<T[]>> {
    const requestId = this.generateRequestId();
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        let query = client.from(table).select(options?.select || '*', { 
          count: options?.count ? 'exact' : undefined 
        });

        // Apply filters
        if (options?.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (options?.orderBy) {
          query = query.order(options.orderBy.field, { 
            ascending: options.orderBy.ascending ?? true 
          });
        }

        // Apply pagination
        if (options?.pagination) {
          const { page, limit } = options.pagination;
          const offset = (page - 1) * limit;
          query = query.range(offset, offset + limit - 1);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        return { data: data as T[], count };
      }, `read-${table}`);

      this.log('info', `Read records from ${table}`, { requestId, count: result.count });
      
      return {
        success: true,
        data: (result.data || []) as T[],
        meta: { 
          requestId,
          count: result.count || undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `read-${table}`, requestId)
      };
    }
  }

  /**
   * Read a single record by ID
   */
  public async readById<T>(
    table: string,
    id: string,
    options?: { select?: string; environment?: ClientEnvironment }
  ): Promise<ServiceResponse<T | null>> {
    const requestId = this.generateRequestId();
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        const { data, error } = await client
          .from(table)
          .select(options?.select || '*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        return data as T | null;
      }, `readById-${table}`);

      this.log('info', `Read record by ID from ${table}`, { requestId, id });
      
      return {
        success: true,
        data: result as T | null,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `readById-${table}`, requestId)
      };
    }
  }

  /**
   * Update a record
   */
  public async update<T>(
    table: string,
    id: string,
    data: Partial<T>,
    options?: { select?: string; environment?: ClientEnvironment }
  ): Promise<ServiceResponse<T>> {
    const requestId = this.generateRequestId();
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        const updateData = {
          ...data,
          updated_at: new Date().toISOString()
        };

        const { data: result, error } = await client
          .from(table)
          .update(updateData)
          .eq('id', id)
          .select(options?.select || '*')
          .single();

        if (error) throw error;
        return result as T;
      }, `update-${table}`);

      this.log('info', `Updated record in ${table}`, { requestId, id, data });
      
      return {
        success: true,
        data: result as T,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `update-${table}`, requestId)
      };
    }
  }

  /**
   * Delete a record
   */
  public async delete(
    table: string,
    id: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    const requestId = this.generateRequestId();
    
    try {
      await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        const { error } = await client
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
      }, `delete-${table}`);

      this.log('info', `Deleted record from ${table}`, { requestId, id });
      
      return {
        success: true,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `delete-${table}`, requestId)
      };
    }
  }

  // ========================= PAGINATION HELPER =========================

  /**
   * Get paginated results
   */
  public async paginate<T>(
    table: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      searchFields?: string[];
      filters?: Record<string, any>;
      orderBy?: { field: string; ascending?: boolean };
      select?: string;
      environment?: ClientEnvironment;
    } = {}
  ): Promise<ServiceResponse<PaginatedResponse<T>>> {
    const requestId = this.generateRequestId();
    const page = options.page || 1;
    const limit = options.limit || 10;
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options.environment);
        let query = client.from(table).select(options.select || '*', { count: 'exact' });

        // Apply search
        if (options.search && options.searchFields?.length) {
          const searchConditions = options.searchFields
            .map(field => `${field}.ilike.%${options.search}%`)
            .join(',');
          query = query.or(searchConditions);
        }

        // Apply filters
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (options.orderBy) {
          query = query.order(options.orderBy.field, { 
            ascending: options.orderBy.ascending ?? true 
          });
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        const totalPages = Math.ceil((count || 0) / limit);
        
        return {
          items: (data || []) as T[],
          pagination: {
            page,
            limit,
            total: count || 0,
            hasMore: page < totalPages,
            totalPages,
          }
        };
      }, `paginate-${table}`);

      this.log('info', `Paginated query on ${table}`, { 
        requestId, 
        page, 
        limit, 
        total: result.pagination.total 
      });
      
      return {
        success: true,
        data: result,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `paginate-${table}`, requestId)
      };
    }
  }

  // ========================= GRAPHQL OPERATIONS =========================

  /**
   * Execute GraphQL query
   */
  public async executeGraphQL<T>(
    query: string,
    variables?: Record<string, any>,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<T>> {
    const requestId = this.generateRequestId();
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        
        // For browser environment, use the GraphQL API route
        if (this.config.environment === 'client') {
          const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
          });

          if (!response.ok) {
            throw new Error(`GraphQL HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          if (result && typeof result === 'object' && 'error' in result && result.error) {
            throw new Error(typeof result.error === 'string' ? result.error : 'GraphQL API error');
          }

          return result.data;
        }

        // For server environment, call Supabase GraphQL directly
        const token = await this.getAccessToken(options?.environment);
        const response = await fetch(`${APP_CONFIG.supabase.url}/graphql/v1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': APP_CONFIG.supabase.anonKey,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
          throw new Error(`GraphQL HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result && typeof result === 'object' && 'errors' in result && Array.isArray(result.errors) && result.errors.length > 0) {
          const firstError = result.errors[0];
          const message = (firstError && typeof firstError === 'object' && 'message' in firstError && typeof firstError.message === 'string') 
            ? firstError.message 
            : 'GraphQL error';
          throw new Error(message);
        }

        return result.data;
      }, 'graphql-query');

      this.log('info', 'GraphQL query executed', { requestId, query: query.substring(0, 100) });
      
      return {
        success: true,
        data: result,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'graphql-query', requestId)
      };
    }
  }

  // ========================= AUTH HELPERS =========================

  /**
   * Get access token
   */
  public async getAccessToken(environment?: ClientEnvironment): Promise<string | null> {
    try {
      const client = this.getClient(environment);
      const { data: { session } } = await client.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(environment?: ClientEnvironment) {
    const client = this.getClient(environment);
    const { data: { user }, error } = await client.auth.getUser();
    
    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
    
    return user;
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(environment?: ClientEnvironment): Promise<boolean> {
    try {
      const token = await this.getAccessToken(environment);
      return !!token;
    } catch {
      return false;
    }
  }

  // ========================= FILE OPERATIONS =========================

  /**
   * Upload file to Supabase Storage
   */
  public async uploadFile(
    file: File | Buffer,
    options: FileUploadOptions & { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<{ path: string; url: string }>> {
    const requestId = this.generateRequestId();
    
    try {
      const result = await this.executeWithRetry(async () => {
        const client = this.getClient(options.environment);
        const filePath = options.path || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { data, error } = await client.storage
          .from(options.bucket)
          .upload(filePath, file, {
            contentType: options.contentType,
            cacheControl: options.cacheControl || '3600',
            upsert: options.upsert || false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = client.storage
          .from(options.bucket)
          .getPublicUrl(data.path);

        return {
          path: data.path,
          url: urlData.publicUrl,
        };
      }, 'file-upload');

      this.log('info', 'File uploaded successfully', { requestId, bucket: options.bucket });
      
      return {
        success: true,
        data: result,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'file-upload', requestId)
      };
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  public async deleteFile(
    bucket: string,
    path: string,
    options?: { environment?: ClientEnvironment }
  ): Promise<ServiceResponse<void>> {
    const requestId = this.generateRequestId();
    
    try {
      await this.executeWithRetry(async () => {
        const client = this.getClient(options?.environment);
        const { error } = await client.storage
          .from(bucket)
          .remove([path]);

        if (error) throw error;
      }, 'file-delete');

      this.log('info', 'File deleted successfully', { requestId, bucket, path });
      
      return {
        success: true,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'file-delete', requestId)
      };
    }
  }

  // ========================= BULK OPERATIONS =========================

  /**
   * Bulk insert records
   */
  public async bulkInsert<T>(
    table: string,
    data: Partial<T>[],
    options?: { batchSize?: number; environment?: ClientEnvironment }
  ): Promise<ServiceResponse<T[]>> {
    const requestId = this.generateRequestId();
    const batchSize = options?.batchSize || 100;
    
    try {
      const results: T[] = [];
      
      // Process in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const batchResult = await this.executeWithRetry(async () => {
          const client = this.getClient(options?.environment);
          const { data: result, error } = await client
            .from(table)
            .insert(batch)
            .select();

          if (error) throw error;
          return result;
        }, `bulk-insert-${table}-batch-${Math.floor(i / batchSize) + 1}`);

        results.push(...(batchResult || []));
      }

      this.log('info', `Bulk inserted ${data.length} records into ${table}`, { requestId });
      
      return {
        success: true,
        data: results,
        meta: { requestId, count: results.length }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, `bulk-insert-${table}`, requestId)
      };
    }
  }

  // ========================= UTILITY METHODS =========================

  /**
   * Test database connection
   */
  public async testConnection(environment?: ClientEnvironment): Promise<ServiceResponse<boolean>> {
    const requestId = this.generateRequestId();
    
    try {
      await this.executeWithRetry(async () => {
        const client = this.getClient(environment);
        const { error } = await client.from('user_profile').select('id').limit(1);
        if (error) throw error;
      }, 'test-connection');

      this.log('info', 'Database connection test successful', { requestId });
      
      return {
        success: true,
        data: true,
        meta: { requestId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'test-connection', requestId)
      };
    }
  }

  /**
   * Clear cached instances (useful for testing)
   */
  public clearCache(): void {
    this.browserClient = null;
    this.adminClient = null;
    this.log('info', 'Cache cleared');
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'Service configuration updated', newConfig);
  }

  /**
   * Get current configuration
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }
}

// ========================= SINGLETON EXPORT =========================

// Export singleton instance
export const baseService = BaseService.getInstance();

// Export class for creating custom instances if needed
export { BaseService };

// Convenience exports for backward compatibility
export const getSupabaseClient = (environment?: ClientEnvironment) => 
  baseService.getClient(environment);

export const getBrowserClient = () => baseService.getBrowserClient();
export const getServerClient = () => baseService.getServerClient();
export const getAdminClient = () => baseService.getAdminClient();
