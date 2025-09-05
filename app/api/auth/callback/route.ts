import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { usersService } from '@/modules/users'
import { baseService } from '@/lib/BaseService'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestId = `auth_cb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/login'  // Default to login page instead of verify
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Improved structured logging
  console.log(`[AUTH_CALLBACK:${requestId}] Auth callback received`, { 
    code: code ? `${code.substring(0, 6)}...${code.substring(code.length - 4)}` : 'none',
    type,
    next,
    userAgent: request.headers.get('user-agent')?.substring(0, 50),
    referer: request.headers.get('referer'),
    hasError: !!error,
    timestamp: new Date().toISOString(),
    requestId
  })
  
  // Log errors if present
  if (error) {
    console.error(`[AUTH_CALLBACK:${requestId}] Auth callback error:`, {
      error,
      errorDescription,
      timestamp: new Date().toISOString()
    })
  }

  if (code) {
    try {
      const supabase = await createClient()
      console.log(`[AUTH_CALLBACK:${requestId}] Exchanging code for session`)
      const startTime = performance.now()
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      const duration = Math.round(performance.now() - startTime)
      
      if (error) {
        console.error(`[AUTH_CALLBACK:${requestId}] Error exchanging code for session:`, {
          error: error.message,
          errorCode: error.status,
          name: error.name,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        })
        return NextResponse.redirect(`${origin}${next}?error=verification_failed&code=${error.status || 'unknown'}`)
      }
      
      console.log(`[AUTH_CALLBACK:${requestId}] Successfully exchanged code for session`, {
        hasSession: !!session,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })

      if (session) {
        const user = session.user
        console.log(`[AUTH_CALLBACK:${requestId}] User verified successfully:`, {
          email: user.email,
          confirmedAt: user.email_confirmed_at,
          userId: user.id,
          hasUserMetadata: !!user.user_metadata,
          timestamp: new Date().toISOString()
        });
        
        // Check if this is an email confirmation and user is verified
        if (user.email_confirmed_at) {
          console.log(`[AUTH_CALLBACK:${requestId}] User is verified, checking if profile exists`);
          
          // Ensure user exists in our database
          try {
            let userProfile = null;
            try {
              console.log(`[AUTH_CALLBACK:${requestId}] Fetching user profile for ${user.id}`);
              const startTime = performance.now();
              const getUserResult = await usersService.getUserById(user.id);
              const duration = Math.round(performance.now() - startTime);
              
              if (getUserResult.success && getUserResult.data) {
                userProfile = getUserResult.data;
                console.log(`[AUTH_CALLBACK:${requestId}] Found existing user profile`, {
                  userId: user.id,
                  email: userProfile.email,
                  isActive: userProfile.is_active,
                  roleId: userProfile.role_id,
                  duration: `${duration}ms`,
                  timestamp: new Date().toISOString()
                });
              }
            } catch (error) {
              console.log(`[AUTH_CALLBACK:${requestId}] User not found in database, will create profile...`, {
                userId: user.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
              });
            }

            // If user doesn't exist in our database, create them
            if (!userProfile && user.email) {
              try {
                console.log(`[AUTH_CALLBACK:${requestId}] Creating user profile in database`);
                // First, try to retrieve user metadata from localStorage if it's a signup
                let firstName = user.user_metadata?.first_name || null;
                let lastName = user.user_metadata?.last_name || null;
                const roleId = user.user_metadata?.role_id || "d9a0935b-9fe1-4550-8f7e-67639fd0c6f0"; // Get from metadata or default

                // Create payload with data we have
                const payload = {
                  id: user.id,
                  email: user.email,
                  role_id: roleId,
                  first_name: firstName,
                  last_name: lastName,
                  is_active: true,
                }
                
                console.log(`[AUTH_CALLBACK:${requestId}] Creating user profile with payload:`, {
                  id: payload.id,
                  email: payload.email,
                  role_id: payload.role_id,
                  first_name: payload.first_name,
                  last_name: payload.last_name,
                  timestamp: new Date().toISOString()
                });
                
                // Use baseService directly to have more control over the operation
                const startTime = performance.now();
                const baseResult = await baseService.create('user_profile', payload, { 
                  environment: 'server'
                });
                const duration = Math.round(performance.now() - startTime);
                
                if (baseResult.success) {
                  console.log(`[AUTH_CALLBACK:${requestId}] User profile created successfully`, {
                    userId: user.id,
                    email: user.email,
                    duration: `${duration}ms`,
                    requestId: baseResult.meta?.requestId,
                    timestamp: new Date().toISOString()
                  });
                } else {
                  console.error(`[AUTH_CALLBACK:${requestId}] Failed to create user profile with baseService`, {
                    userId: user.id,
                    error: baseResult.error,
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString()
                  });
                  
                  // Fall back to the usersServiceClient method
                  console.log(`[AUTH_CALLBACK:${requestId}] Trying alternate user creation method`);
                  const altStartTime = performance.now();
                  const insertResult = await usersService.createUser(payload);
                  const altDuration = Math.round(performance.now() - altStartTime);
                  
                  if (insertResult.success) {
                    console.log(`[AUTH_CALLBACK:${requestId}] User profile created successfully with alternate method`, {
                      userId: user.id,
                      email: user.email,
                      duration: `${altDuration}ms`,
                      timestamp: new Date().toISOString()
                    });
                  } else {
                    console.error(`[AUTH_CALLBACK:${requestId}] Failed to create user profile with alternate method`, {
                      userId: user.id,
                      error: insertResult.error,
                      duration: `${altDuration}ms`,
                      timestamp: new Date().toISOString()
                    });
                  }
                }
              } catch (createError) {
                console.error(`[AUTH_CALLBACK:${requestId}] Exception during user profile creation:`, {
                  error: createError instanceof Error ? createError.message : 'Unknown error',
                  stack: createError instanceof Error ? createError.stack : undefined,
                  userId: user.id,
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              console.log(`[AUTH_CALLBACK:${requestId}] User profile already exists for ${user.email}`);
            }
          } catch (profileError) {
            console.error(`[AUTH_CALLBACK:${requestId}] Error handling user profile:`, {
              error: profileError instanceof Error ? profileError.message : 'Unknown error',
              stack: profileError instanceof Error ? profileError.stack : undefined,
              userId: user.id,
              timestamp: new Date().toISOString()
            });
            // Don't fail the verification for profile errors
          }
          
          // Clear signup email from any stored location
          console.log(`[AUTH_CALLBACK:${requestId}] Verification complete, redirecting to ${next} with verified=true`);
          const response = NextResponse.redirect(`${origin}${next}?verified=true`)
          return response
        }
      }

      // If no session or other issues, redirect to verify page
      console.log(`[AUTH_CALLBACK:${requestId}] No valid session or unverified user, redirecting to ${next}`);
      return NextResponse.redirect(`${origin}${next}`)
      
    } catch (error) {
      console.error(`[AUTH_CALLBACK:${requestId}] Unexpected error in auth callback:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return NextResponse.redirect(`${origin}${next}?error=verification_failed&reason=unexpected`)
    }
  }

  // If no code, redirect to auth error
  return NextResponse.redirect(`${origin}${next}?error=invalid_link`)
}
