"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function Login() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { signIn } = useAuth();
  const { settings } = useAuthLayoutContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password);

      // Check if user is verified before redirecting
      const user = result?.user;
      if (user && (user as any).email_confirmed_at) {
        window.location.href = "/";
      } else {
        // User is not verified, redirect to verify page
        window.location.href = "/auth/verify";
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
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Enter your credentials to login to your account.
        </p>
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
            className="text-primary hover:underline cursor-pointer"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
