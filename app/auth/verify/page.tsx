"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { emailAuthService } from "@/modules/auth";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase/client";

type VerificationState = "checking" | "pending" | "verified" | "error";

export default function Verify() {
  const [state, setState] = useState<VerificationState>("checking");
  const [message, setMessage] = useState("Checking verification status...");
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const verified = searchParams.get("verified");
        const error = searchParams.get("error");
        const manualLogin = searchParams.get("manualLogin");

        // Handle URL parameters from callback
        if (verified === "true") {
          setState("verified");
          setMessage("Your email has been verified successfully!");

          // If manual login is required, clear any auth session
          if (manualLogin === "required") {
            // Force sign out to ensure user must log in manually
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
            console.log(
              "User signed out after verification to require manual login"
            );
          }

          setCountdown(5);
          // Clear stored email since verification is complete
          localStorage.removeItem("signup_email");
          return;
        }

        if (error) {
          setState("error");
          switch (error) {
            case "verification_failed":
              setMessage(
                "Email verification failed. Please try again or request a new verification email."
              );
              break;
            case "invalid_link":
              setMessage(
                "Invalid verification link. Please request a new verification email."
              );
              break;
            default:
              setMessage(
                "An error occurred during verification. Please try again."
              );
          }
          return;
        }

        // Check current session and verification status
        const supabase = getSupabaseClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setState("error");
          setMessage(
            "An error occurred while checking your verification status."
          );
          return;
        }

        if (session?.user) {
          setUserEmail(session.user.email || null);

          if (session.user.email_confirmed_at) {
            setState("verified");
            setMessage("Your email has been verified successfully!");
            setCountdown(5);
          } else {
            setState("pending");
            setMessage("Please check your email for the verification link.");
          }
        } else {
          // No session but still show resend option
          setState("pending");
          setMessage("Please check your email for the verification link.");
          // Try to get email from localStorage if available
          const savedEmail = localStorage.getItem("signup_email");
          if (savedEmail) {
            setUserEmail(savedEmail);
          }
        }
      } catch (error) {
        console.error("Error checking verification:", error);
        setState("error");
        setMessage("An error occurred during verification.");
      }
    };

    checkVerificationStatus();

    // Also set email from localStorage if not already set
    if (!userEmail) {
      const savedEmail = localStorage.getItem("signup_email");
      if (savedEmail) {
        setUserEmail(savedEmail);
      }
    }

    // Listen for auth state changes
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setState("verified");
        setMessage("Your email has been verified successfully!");
        setCountdown(5);
        localStorage.removeItem("signup_email"); // Clean up

        // Sign out user to force manual login after verification
        await supabase.auth.signOut();
        console.log(
          "User signed out after auth state change to require manual login"
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, userEmail]);

  // Countdown effect for verified state - redirect immediately to login page
  useEffect(() => {
    // If verification is successful, redirect to login immediately
    if (state === "verified") {
      router.push("/auth/login?verified=true");
      return;
    }

    // Keep the countdown for backward compatibility
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push("/auth/login");
    }
  }, [countdown, router, state]);

  const handleResendConfirmation = async () => {
    // Try to get email from state or localStorage
    const emailToUse = userEmail || localStorage.getItem("signup_email");
    const firstName = localStorage.getItem("signup_firstName");
    const lastName = localStorage.getItem("signup_lastName");

    if (!emailToUse) {
      toast.error("No email address found. Please try signing up again.");
      return;
    }

    setIsResending(true);
    try {
      const result = await emailAuthService.sendEmailConfirmation(emailToUse, {
        firstName,
        lastName,
      });

      // With our refactored service, the result should be { success: true } if successful
      if (result && result.success) {
        toast.success("Confirmation email sent! Please check your inbox.");
        setMessage(
          "A new confirmation email has been sent. Please check your inbox."
        );
      } else {
        // This shouldn't happen with current implementation (it throws on error)
        // but adding as a safeguard
        toast.error("Failed to resend confirmation email. Please try again.");
      }
    } catch (error) {
      console.error("Error resending confirmation:", error);
      toast.error("Failed to resend confirmation email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const getMessageColor = () => {
    switch (state) {
      case "verified":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // Redirect immediately in the verified state
  if (state === "verified") {
    return (
      <div className="max-w-md w-full space-y-8 p-8 bg-sidebar rounded-lg shadow border border-sidebar-border">
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              Your email has been successfully verified! Redirecting to login
              page...
            </p>
          </div>
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            Continue to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-sidebar rounded-lg shadow border border-sidebar-border">
      {(state === "pending" || state === "error") && (
        <div className="text-center space-y-4">
          {userEmail && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-black dark:text-blue-300">
                We sent a verification email to:
              </p>
              <p className="font-medium text-black dark:text-blue-200">
                {userEmail}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-500">Didn't receive the email?</p>
            <Button
              onClick={handleResendConfirmation}
              disabled={isResending}
              variant="outline"
              className="w-full bg-pink-700 hover:bg-pink-600 text-white"
            >
              {isResending ? "Sending..." : "Resend Confirmation Email"}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-black hover:text-primary/80 underline"
        >
          Return to login
        </Link>
      </div>
    </div>
  );
}
