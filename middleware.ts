import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow ALL static assets, API routes, and Next.js internals
  if (
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.startsWith("/auth/") ||
    request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  // For root page and other protected pages, let the client handle auth
  // No server-side redirects to prevent loops
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.\\..|_next).*)", // all pages except static files
    "/", // homepage
    "/(api|trpc)(.*)", // API routes
  ],
};
