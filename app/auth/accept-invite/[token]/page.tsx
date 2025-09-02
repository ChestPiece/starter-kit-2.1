"use client";
import { useId, useEffect } from "react";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/button";
import { Settings, settingsService } from "@/modules/settings";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Login() {
  const { token } = useParams();
  const id = useId();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const router = useRouter();
  const { acceptInvite } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    const getSettings = async () => {
      const settings = await settingsService.getSettingsById();
      setSettings(settings);
    };
    getSettings();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await acceptInvite(token as string, password);
      // AuthContext will handle the redirect via auth state listener
      window.location.href = "/";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during accept invite"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-sidebar hover:bg-sidebar-hover p-8 rounded-lg shadow">
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-full border border-sidebar-border relative"
            aria-hidden="true"
          >
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
                style={{
                  width:
                    settings?.logo_setting === "horizontal" ? "60%" : "30%",
                }}
                unoptimized
                className={cn(
                  `w-[${
                    settings?.logo_setting === "horizontal" ? "60%" : "30%"
                  }] h-full object-cover rounded-md transition-opacity duration-300`,
                  isImageLoading ? "opacity-0" : "opacity-100"
                )}
                onLoadingComplete={() => setIsImageLoading(false)}
                priority
              />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Accept Invite
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your password to accept the invite.
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

          <Button
            type="submit"
            className="w-full dark:hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
