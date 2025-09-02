"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { Settings, settingsService } from "@/modules/settings";

// Create a context for auth-specific data
interface AuthLayoutContextType {
  settings: Settings | null;
  isLoadingSettings: boolean;
}

const AuthLayoutContext = createContext<AuthLayoutContextType | undefined>(
  undefined
);

export const useAuthLayoutContext = () => {
  const context = useContext(AuthLayoutContext);
  if (!context) {
    throw new Error(
      "useAuthLayoutContext must be used within AuthLayoutProvider"
    );
  }
  return context;
};

export const AuthLayoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const getSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const fetchedSettings = await settingsService.getSettingsById();
        setSettings(fetchedSettings);
      } catch (error) {
        // Provide fallback settings instead of logging error
        const fallbackSettings: Settings = {
          id: "fallback",
          site_name: process.env.NEXT_PUBLIC_SITE_NAME || "Starter Kit",
          logo_url: process.env.NEXT_PUBLIC_SITE_LOGO || "/favicon.ico",
          logo_horizontal_url:
            process.env.NEXT_PUBLIC_SITE_LOGO || "/favicon.ico",
          favicon_url: process.env.NEXT_PUBLIC_SITE_LOGO || "/favicon.ico",
          logo_setting: "square",
          primary_color: "#3b82f6",
          secondary_color: "#1e40af",
          appearance_theme: "light",
          site_description: "Starter Kit Application",
          contact_email: "support@example.com",
        };
        setSettings(fallbackSettings);

        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "Using fallback settings due to GraphQL fetch error:",
            error
          );
        }
      } finally {
        setIsLoadingSettings(false);
      }
    };

    getSettings();
  }, []);

  const value = {
    settings,
    isLoadingSettings,
  };

  return (
    <AuthLayoutContext.Provider value={value}>
      {children}
    </AuthLayoutContext.Provider>
  );
};
