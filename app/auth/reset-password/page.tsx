"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/button";
import { useAuthLayoutContext } from "@/context/AuthLayoutContext";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { generateNameAvatar } from "@/utils/generateRandomAvatar";
import { toast } from "sonner";
import { emailAuthService } from "@/modules/auth";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { settings } = useAuthLayoutContext();
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!token) {
      toast.error("Invalid or missing token.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await emailAuthService.updatePassword(password);
      toast.success("Password reset successful. You may now log in.");
      setPassword("");
      setConfirm("");
      setPasswordMessage({
        type: "success",
        text: "Password reset successful. You may now log in.",
      });
      // Redirect to login page after success
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      console.error("Password update error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setPasswordMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
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
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your new password below.
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
        {passwordMessage && (
          <div
            className={cn(
              "p-3 rounded-md text-sm",
              passwordMessage.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {passwordMessage.text}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="password" className="dark:text-gray-200">
              New Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <div>
            <Label htmlFor="confirm" className="dark:text-gray-200">
              Confirm Password
            </Label>
            <PasswordInput
              id="confirm"
              placeholder="Confirm your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Back to{" "}
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
