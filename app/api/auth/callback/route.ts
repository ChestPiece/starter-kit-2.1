import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { usersServiceClient } from '@/modules/users'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/verify'
  const type = searchParams.get('type')

  console.log('Auth callback received:', { code: code?.substring(0, 8) + '...', type, next })

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(`${origin}${next}?error=verification_failed`)
      }

      if (session) {
        const user = session.user
        console.log('User verified successfully:', user.email, 'Confirmed at:', user.email_confirmed_at)
        
        // Check if this is an email confirmation and user is verified
        if (type === 'signup' && user.email_confirmed_at) {
          // Ensure user exists in our database
          try {
            let userProfile = null;
            try {
              userProfile = await usersServiceClient.getUserById(user.id);
            } catch (error) {
              console.log('User not found in database, creating profile...');
            }

            // If user doesn't exist in our database, create them
            if (!userProfile && user.email) {
              const payload = {
                id: user.id,
                email: user.email,
                role_id: user.user_metadata?.role_id || "d9a0935b-9fe1-4550-8f7e-67639fd0c6f0", // Get from metadata or default
                first_name: user.user_metadata?.first_name || null,
                last_name: user.user_metadata?.last_name || null,
                is_active: true,
              }
              await usersServiceClient.insertUser(payload);
              console.log('User profile created successfully for:', user.email);
            } else {
              console.log('User profile already exists for:', user.email);
            }
          } catch (profileError) {
            console.error('Error handling user profile:', profileError);
            // Don't fail the verification for profile errors
          }
          
          // Clear signup email from any stored location
          const response = NextResponse.redirect(`${origin}${next}?verified=true`)
          return response
        }
      }

      // If no session or other issues, redirect to verify page
      return NextResponse.redirect(`${origin}${next}`)
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${origin}${next}?error=verification_failed`)
    }
  }

  // If no code, redirect to auth error
  return NextResponse.redirect(`${origin}${next}?error=invalid_link`)
}
