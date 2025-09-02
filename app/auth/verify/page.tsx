"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { emailAuthService } from "@/modules/auth";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function Verify() {
  const [message, setMessage] = useState("Verifying your email...");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkVerification = async () => {
      try {
        // Only check session if we're on the client side
        if (typeof window === "undefined") return;

        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setMessage("An error occurred during verification.");
          return;
        }

        if (session?.user) {
          if (session.user.email_confirmed_at) {
            setMessage("Your email has been verified successfully!");
            setVerified(true);
            // Redirect to home after 3 seconds
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
          } else {
            setMessage("Please check your email for the verification link.");
            setUserEmail(session.user.email || null);
          }
        } else {
          setMessage("Please check your email for the verification link.");
        }
      } catch (error) {
        console.error("Error checking verification:", error);
        setMessage("An error occurred during verification.");
      }
    };

    checkVerification();

    // Listen for auth state changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setMessage("Your email has been verified successfully!");
        setVerified(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleResendConfirmation = async () => {
    if (!userEmail) {
      toast.error("No email address found. Please try signing up again.");
      return;
    }

    setIsLoading(true);
    try {
      await emailAuthService.sendEmailConfirmation(userEmail);
      toast.success("Confirmation email sent! Please check your inbox.");
      setMessage(
        "A new confirmation email has been sent. Please check your inbox."
      );
    } catch (error) {
      console.error("Error resending confirmation:", error);
      toast.error("Failed to resend confirmation email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-sidebar rounded-lg shadow border border-sidebar-border">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Email Verification
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">{message}</p>
      </div>

      {!verified && userEmail && (
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">Didn't receive the email?</p>
          <Button
            onClick={handleResendConfirmation}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Sending..." : "Resend Confirmation Email"}
          </Button>
        </div>
      )}

      <div className="text-center">
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:text-primary/80"
        >
          Return to login
        </Link>
      </div>
    </div>
  );
}
