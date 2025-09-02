import { type NextRequest } from "next/server";
import { updateSession } from "./updateSession";
export async function middleware(request: NextRequest) {
  // Handle Supabase auth session
  const response = await updateSession(request);
  return response;
}

export const config = {
  matcher: ["/((?!.\\..|_next).)", "/", "/(api|trpc)(.)"],
};