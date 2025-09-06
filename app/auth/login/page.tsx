"use client";
import { useId, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { useAuthLayoutContext } from "@/context/AuthLayoutContext";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function Login() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  // Remove processingCode state since we're not showing loading UI
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const { signIn } = useAuth();
  const { settings } = useAuthLayoutContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle authentication code from URL if present
  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const next = searchParams.get("next");
    const verified = searchParams.get("verified");

    // Handle the case when redirected back from verify page or auth callback with verified=true
    if (verified === "true") {
      setVerificationSuccess(true);
      console.log("User verification was successful");

      // Clear any verification-related localStorage data
      localStorage.removeItem("signup_email");
      localStorage.removeItem("signup_firstName");
      localStorage.removeItem("signup_lastName");

      // Show success message and let user proceed with login
      return;
    }

    // For non-verified states, let the API route handle the code exchange
    if (code) {
      // Redirect to the API callback route instead of handling it client-side
      const callbackUrl = `/api/auth/callback?code=${code}${type ? `&type=${type}` : ""}${next ? `&next=${next}` : ""}`;
      console.log("Redirecting to auth callback API route");

      // Start the API verification process without showing any loading state
      const redirectSilently = async () => {
        try {
          // This is a silent redirect - the page will be refreshed by the callback route
          const result = await fetch(callbackUrl);
          // No need to handle the response as the callback route will handle redirects
        } catch (error) {
          console.error("Error during verification process:", error);
          // If there's an error, set verification success to false
          setVerificationSuccess(false);
        }
      };

      redirectSilently();
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password);

      // Check if user is verified before redirecting
      if (result && result.user) {
        const user = result.user;
        if (user.email_confirmed_at) {
          window.location.href = "/";
        } else {
          // User is not verified, redirect to verify page
          window.location.href = "/auth/verify";
        }
      } else {
        setError("Login failed");
      }
    } catch (error) {
      setIsLoading(false);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during login"
      );
    }
  };

  // Don't show loading state for verification code processing
  // We'll handle it silently in the background

  return (
    <div className="max-w-md w-full space-y-8 bg-sidebar hover:bg-sidebar-hover p-8 rounded-lg shadow">
      <div className="flex flex-col items-center gap-2">
        {(
          settings?.logo_setting === "horizontal"
            ? settings?.logo_horizontal_url
            : settings?.logo_url
        ) ? (
          <div
            className="flex shrink-0 items-center justify-center rounded-md  border-sidebar-border relative"
            aria-hidden="true"
          >
            <Image
              src={
                (settings?.logo_setting === "horizontal"
                  ? settings?.logo_horizontal_url
                  : settings?.logo_url) || generateNameAvatar("Whatsapp")
              }
              alt="logo"
              width={50}
              height={50}
              unoptimized
              className={cn(
                `w-[${
                  settings?.logo_setting === "horizontal" ? "60%" : "30%"
                }] h-full object-cover rounded-md transition-opacity duration-300`,
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              style={{
                width: settings?.logo_setting === "horizontal" ? "60%" : "30%",
              }}
              onLoad={() => setIsImageLoading(false)}
              priority
            />
          </div>
        ) : null}
        <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {verificationSuccess ? "Email Verified!" : "Welcome Back"}
        </h2>
        {verificationSuccess ? (
          <div className="text-green-600 dark:text-green-400 text-sm text-center mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mx-auto mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Your email has been successfully verified! You can now log in to
            your account.
          </div>
        ) : (
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials to login to your account.
          </p>
        )}
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${id}-email`} className="dark:text-gray-200">
              Email
            </Label>
            <Input
              id={`${id}-email`}
              placeholder="hi@yourcompany.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <div>
            <Label htmlFor={`${id}-password`} className="dark:text-gray-200">
              Password
            </Label>
            <PasswordInput
              id={`${id}-password`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${id}-remember`}
              className="dark:border-gray-600 cursor-pointer"
            />
            <Label
              htmlFor={`${id}-remember`}
              className="text-muted-foreground font-normal dark:text-gray-400 cursor-pointer"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-sm underline hover:no-underline text-primary cursor-pointer"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className={`w-full  bg-[#ec4899]  hover:bg-[#ec4899]/90 text-white p-2 rounded-md cursor-pointer`}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            prefetch={true}
            replace={true}
            className="text-primary hover:underline cursor-pointer"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
