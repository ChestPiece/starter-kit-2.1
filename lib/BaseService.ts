// src/services/base-service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseClient } from "@/lib/supabase/client";


/* ============================================================
   Types
============================================================ */

export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: ServiceError;
  meta?: Record<string, any>;
};

export type ServiceError = {
  code: string;
  message: string;
  details?: any;
  requestId?: string;
};

export type ClientEnvironment = "client" | "server" | "admin";

export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  searchFields?: string[];
  orderBy?: {
    field: string;
    ascending?: boolean;
  };
};

/* ============================================================
   Core Helpers
============================================================ */

/**
 * Get appropriate Supabase client by environment
 */
export function getClient(environment: ClientEnvironment = "server"): SupabaseClient {
  switch (environment) {
    case "client":
      return getSupabaseClient();
    case "admin":
      return supabaseAdmin;
    case "server":
    default:
      // For server-side, use admin client which works on both server and client
      return supabaseAdmin;
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Standardized error handler
 */
export function handleError(error: any, operation: string, requestId?: string): ServiceError {
  return {
    code: error?.code || "SERVICE_ERROR",
    message: error?.message || "An unexpected error occurred",
    details: error,
    requestId,
  };
}

/**
 * Standardized response
 */
export function response<T>(
  success: boolean,
  data?: T,
  error?: ServiceError,
  meta?: Record<string, any>
): ServiceResponse<T> {
  return { success, data, error, meta };
}

/**
 * Retry wrapper with exponential backoff
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryAttempts = 2
): Promise<T> {
  let attempt = 0;
  let lastError: any;

  while (attempt <= retryAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt++;
      if (attempt > retryAttempts) break;

      const backoff = Math.pow(2, attempt) * 100;
      console.warn(`[WARN] Retrying ${operationName} (attempt ${attempt})`, error);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}

/* ============================================================
   Storage Helpers
============================================================ */

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; environment?: ClientEnvironment }
): Promise<ServiceResponse<{ path: string; fullPath: string }>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data, error } = await client.storage.from(bucket).upload(path, file, {
        upsert: options?.upsert || false,
      });
      if (error) throw error;
      return { path: path, fullPath: `${bucket}/${path}` };
    }, "uploadFile");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false, 
      { path: '', fullPath: '' },
      handleError(error, "uploadFile", requestId)
    );
  }
}

export async function deleteFile(
  bucket: string,
  paths: string[],
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<{ path: string }[]>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data, error } = await client.storage.from(bucket).remove(paths);
      if (error) throw error;
      // Transform the result to match expected return type
      return paths.map(path => ({ path }));
    }, "deleteFile");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false, 
      paths.map(path => ({ path })),
      handleError(error, "deleteFile", requestId)
    );
  }
}

export function getFileUrl(
  bucket: string,
  path: string,
  options?: { environment?: ClientEnvironment }
): string {
  const client = getClient(options?.environment);
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ============================================================
   Database Helpers
============================================================ */

/**
 * Create a new record
 */
export async function create<T>(
  table: string,
  data: Record<string, any>,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<T>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data: createdData, error } = await client.from(table).insert(data).select().single();
      if (error) throw error;
      return createdData as T;
    }, "create");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    // Provide a default value for the generic type to satisfy TypeScript
    return response(
      false,
      {} as T, // Empty object cast to T to satisfy the generic constraint
      handleError(error, `create-${table}`, requestId)
    );
  }
}

/**
 * Read a record by ID
 */
export async function readById<T>(
  table: string,
  id: string,
  options?: { select?: string; environment?: ClientEnvironment }
): Promise<ServiceResponse<T>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data, error } = await client
        .from(table)
        .select(options?.select || "*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Record not found
          throw {
            code: "RECORD_NOT_FOUND",
            message: `No record found in ${table} with ID ${id}`,
          };
        }
        throw error;
      }
      return data as T;
    }, "readById");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false,
      {} as T,
      handleError(error, `readById-${table}`, requestId)
    );
  }
}

/**
 * Read all records
 */
export async function readAll<T>(
  table: string,
  options?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    environment?: ClientEnvironment;
  }
): Promise<ServiceResponse<T[]>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      let query = client.from(table).select(options?.select || "*");

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending !== false,
        });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    }, "readAll");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false,
      [] as T[],
      handleError(error, `readAll-${table}`, requestId)
    );
  }
}

/**
 * Update a record
 */
export async function update<T>(
  table: string,
  id: string,
  data: Record<string, any>,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<T>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data: updatedData, error } = await client
        .from(table)
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedData as T;
    }, "update");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false,
      {} as T,
      handleError(error, `update-${table}`, requestId)
    );
  }
}

/**
 * Delete a record
 */
export async function remove<T>(
  table: string,
  id: string,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<T>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data, error } = await client
        .from(table)
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as T;
    }, "remove");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false,
      {} as T,
      handleError(error, `remove-${table}`, requestId)
    );
  }
}

/**
 * Pagination with search, ordering, etc.
 */
export async function paginate<T>(
  table: string,
  params: PaginationParams = {},
  options?: {
    select?: string;
    environment?: ClientEnvironment;
  }
): Promise<ServiceResponse<{ data: T[]; total: number; page: number; pageSize: number }>> {
  const requestId = generateRequestId();
  const page = params.page || 1;
  const pageSize = params.limit || 10;
  const offset = params.offset || (page - 1) * pageSize;

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      
      // Start building query
      let query = client.from(table).select(options?.select || "*", { count: "exact" });
      
      // Add search if provided
      if (params.search && params.searchFields?.length) {
        // Create OR conditions for each search field
        const searchConditions = params.searchFields.map(field => 
          `${field}.ilike.%${params.search}%`
        );
        
        query = query.or(searchConditions.join(','));
      }
      
      // Add ordering
      if (params.orderBy) {
        query = query.order(params.orderBy.field, { 
          ascending: params.orderBy.ascending !== false 
        });
      }
      
      // Add pagination
      query = query.range(offset, offset + pageSize - 1);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data as T[],
        total: count || 0,
        page,
        pageSize,
      };
    }, "paginate");

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(
      false,
      { data: [] as T[], total: 0, page: 1, pageSize: 10 },
      handleError(error, `paginate-${table}`, requestId)
    );
  }
}

/**
 * Batch operations
 */
export async function bulkInsert<T>(
  table: string,
  records: any[],
  options?: { batchSize?: number; environment?: ClientEnvironment }
): Promise<ServiceResponse<T[]>> {
  const requestId = generateRequestId();
  const batchSize = options?.batchSize || 1000;
  const results: T[] = [];

  try {
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const batchResult = await executeWithRetry(async () => {
        const client = getClient(options?.environment);
        const { data: result, error } = await client.from(table).insert(batch).select();
        if (error) throw error;
        return result as T[];
      }, "bulkInsert");

      results.push(...batchResult);
    }

    return response(true, results, undefined, { requestId });
  } catch (error) {
    return response(false, [] as T[], handleError(error, "bulkInsert", requestId));
  }
}

/**
 * Call RPC function
 */
export async function callFunction<T>(
  functionName: string,
  params?: Record<string, any>,
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<T>> {
  const requestId = generateRequestId();

  try {
    const result = await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { data, error } = await client.rpc(functionName, params);
      if (error) throw error;
      return data as T;
    }, `rpc-${functionName}`);

    return response(true, result, undefined, { requestId });
  } catch (error) {
    return response(false, {} as T, handleError(error, `rpc-${functionName}`, requestId));
  }
}

/**
 * Test database connection
 */
export async function testConnection(
  options?: { environment?: ClientEnvironment }
): Promise<ServiceResponse<boolean>> {
  const requestId = generateRequestId();
  
  try {
    await executeWithRetry(async () => {
      const client = getClient(options?.environment);
      const { error } = await client.from('_test_connection').select('*').limit(1);
      
      // We expect a 'relation does not exist' error, which means the connection works
      if (error && !error.message.includes('relation "_test_connection" does not exist')) {
        throw error;
      }
      
      return true;
    }, "testConnection");

    return response(true, true, undefined, { requestId });
  } catch (error) {
    return response(false, false, handleError(error, "testConnection", requestId));
  }
}

/* ============================================================
   Service Export
============================================================ */

// Export all functions as a unified service object
export const baseService = {
  // CRUD Operations
  create,
  readById,
  readAll,
  update,
  delete: remove, // Renamed because 'delete' is a reserved keyword
  paginate,
  
  // File Operations
  uploadFile,
  deleteFile,
  getFileUrl,
  
  // Batch Operations
  bulkInsert,
  
  // Database Functions
  callFunction,
  testConnection,
  
  // Helper Functions
  getClient,
  generateRequestId,
  handleError,
  response,
  executeWithRetry
};