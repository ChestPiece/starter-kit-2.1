"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { useAuthLayoutContext } from "@/context/AuthLayoutContext";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { emailAuthService } from "@/modules/auth";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const router = useRouter();
  const { settings } = useAuthLayoutContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await emailAuthService.sendPasswordReset(email);
      toast.success(
        "If your email exists in our system, a reset link has been sent."
      );
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error("Something went wrong, so please try again later.");
      setError("Something went wrong, so please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

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
                  : settings?.logo_url) ||
                process.env.NEXT_PUBLIC_SITE_LOGO ||
                "/favicon.ico"
              }
              alt="logo"
              width={50}
              height={50}
              unoptimized
              style={{
                width: settings?.logo_setting === "horizontal" ? "60%" : "30%",
              }}
              className={cn(
                `w-[${settings?.logo_setting === "horizontal" ? "60%" : "30%"}] h-full object-cover rounded-md transition-opacity duration-300`,
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              onLoadingComplete={() => setIsImageLoading(false)}
              priority
            />
          </div>
        ) : null}
        <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Forgot Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your email to receive a password reset link.
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="text-green-600 dark:text-green-400 text-sm text-center">
            {message}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="dark:text-gray-200">
              Email
            </Label>
            <Input
              id="email"
              placeholder="hi@yourcompany.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-[#ec4899] hover:bg-[#ec4899]/90 text-white p-2 rounded-md cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-primary hover:underline cursor-pointer"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
