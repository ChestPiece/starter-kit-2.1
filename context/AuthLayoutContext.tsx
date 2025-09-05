"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { Settings } from "@/modules/settings";
import { settingsServiceClient } from "@/modules/settings";

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

  // Use a sessionStorage cache to prevent unnecessary settings fetches during navigation
  useEffect(() => {
    const getSettings = async () => {
      try {
        // First, check if we have settings in sessionStorage to prevent flashing during navigation
        if (typeof window !== "undefined") {
          const cachedSettings = sessionStorage.getItem("auth_layout_settings");
          if (cachedSettings) {
            try {
              const parsedSettings = JSON.parse(cachedSettings);
              setSettings(parsedSettings);
              setIsLoadingSettings(false);

              // Still fetch in background to ensure latest settings, but don't show loading state
              const backgroundFetch = async () => {
                const freshSettings =
                  await settingsServiceClient.getSettingsById();
                if (freshSettings.success && freshSettings.data) {
                  // Only update if settings have changed
                  if (JSON.stringify(freshSettings.data) !== cachedSettings) {
                    setSettings(freshSettings.data);
                    sessionStorage.setItem(
                      "auth_layout_settings",
                      JSON.stringify(freshSettings.data)
                    );
                  }
                }
              };
              backgroundFetch();
              return;
            } catch (e) {
              // Invalid cache, continue with normal fetch
              console.error("Error parsing cached settings:", e);
            }
          }
        }

        // No cache or invalid cache, do a normal fetch with loading state
        setIsLoadingSettings(true);
        const fetchedSettings = await settingsServiceClient.getSettingsById();
        if (fetchedSettings.success && fetchedSettings.data) {
          setSettings(fetchedSettings.data);
          // Cache the settings
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "auth_layout_settings",
              JSON.stringify(fetchedSettings.data)
            );
          }
        }
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

        // Cache fallback settings too
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "auth_layout_settings",
            JSON.stringify(fallbackSettings)
          );
        }

        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.warn("Using fallback settings due to fetch error:", error);
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
