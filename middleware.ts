import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow ALL static assets, API routes, and Next.js internals without auth checking
  if (
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  // Create response for auth checks
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client for auth checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't need auth
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  
  // Handle authentication redirects
  if (!user && !isAuthRoute) {
    // No user, redirect to login
    const redirectUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    // User is signed in and trying to access auth page, redirect to dashboard
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // For all other cases, continue with the response
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
