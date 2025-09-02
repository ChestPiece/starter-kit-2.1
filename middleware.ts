import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define auth pages that don't require authentication
  const authPages = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify']
  const invitePages = request.nextUrl.pathname.startsWith('/auth/accept-invite')
  
  // Handle unauthenticated users - redirect to login (except for auth pages)
  if (!user && !authPages.includes(request.nextUrl.pathname) && !invitePages) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Handle authenticated users accessing auth pages - redirect appropriately
  if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup')) {
    // Check if user's email is verified
    if (user.email_confirmed_at) {
      // Verified user trying to access login/signup -> redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    } else {
      // Unverified user trying to access login/signup -> redirect to verify page
      const url = request.nextUrl.clone()
      url.pathname = '/auth/verify'
      return NextResponse.redirect(url)
    }
  }

  // Handle verified users accessing verify page - redirect to home
  if (user && request.nextUrl.pathname === '/auth/verify' && user.email_confirmed_at) {
    // Only redirect if there are no query parameters (to allow callback handling)
    if (!request.nextUrl.search) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Protect main application routes - require verified users
  if (user && !user.email_confirmed_at && !authPages.includes(request.nextUrl.pathname) && !invitePages) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/verify'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)",
  ],
};
