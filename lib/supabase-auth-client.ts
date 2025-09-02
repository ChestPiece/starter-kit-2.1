import { createAdminClient } from './supabase/admin'
import { getSupabaseClient } from './supabase/client'

// Get the singleton browser client for auth operations (only on client side)
export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient should only be called on the client side')
  }
  return getSupabaseClient()
}

// Export the browser client as 'supabase' for compatibility (only on client side)
export function getSupabase() {
  return getSupabaseBrowserClient()
}

// Export admin client for server-side operations
export const supabaseAdmin = createAdminClient()

// Export the createClient function from the client module for backward compatibility
export { getSupabaseClient as createClient } from './supabase/client'
