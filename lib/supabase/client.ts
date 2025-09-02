import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid multiple GoTrue clients
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('createClient should only be called on the client side')
  }

  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance only if one doesn't exist
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseInstance
}

// Function to get the singleton instance
export function getSupabaseClient() {
  return createClient()
}
