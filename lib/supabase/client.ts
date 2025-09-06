import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to avoid multiple GoTrue clients
let supabaseInstance: SupabaseClient | null = null

// Track initialization state to improve performance
let isInitializing = false
let initializationPromise: Promise<SupabaseClient> | null = null

export function createClient(forceNew = false): SupabaseClient {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('createClient should only be called on the client side')
  }

  // Return existing instance if available unless forced to create new
  if (supabaseInstance && !forceNew) {
    return supabaseInstance
  }

  // If already initializing, return the initialization promise to avoid duplicate initializations
  if (isInitializing && initializationPromise && !forceNew) {
    return initializationPromise as unknown as SupabaseClient
  }

  // Set initializing flag
  isInitializing = true

  // Create the initialization promise
  initializationPromise = new Promise<SupabaseClient>((resolve) => {
    // Create new instance
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Disable automatic session detection from URL
          storageKey: 'supabase.auth.token', // Set explicit storage key
          flowType: 'pkce', // Use PKCE flow for better security
        },
        global: {
          headers: {
            'x-client-info': `nextjs-with-supabase-auth/${process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'}`
          }
        },
        realtime: {
          timeout: 20000 // Increase timeout for better connection stability
        }
      }
    )

    // Store the instance
    supabaseInstance = client
    
    // Reset initialization state
    isInitializing = false
    
    // Resolve the promise
    resolve(client)
  })

  // Return the client instance
  return supabaseInstance!
}

// Function to get the singleton instance
export function getSupabaseClient() {
  return createClient()
}
