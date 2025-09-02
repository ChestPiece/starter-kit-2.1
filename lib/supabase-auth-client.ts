import { createAdminClient } from './supabase/admin'
import { getSupabaseClient } from './supabase/client'

// Get the singleton browser client for auth operations
export const supabaseClient = getSupabaseClient()

// Export the browser client as 'supabase' for compatibility
export const supabase = supabaseClient

// Export admin client for server-side operations
export const supabaseAdmin = createAdminClient()

// Export the createClient function from the client module for backward compatibility
export { getSupabaseClient as createClient } from './supabase/client'
