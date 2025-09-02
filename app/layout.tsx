import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import settingsService from "@/modules/settings/services/setting-service";
import { ThemeProviderWrapper } from "@/context/theme-provider-wrapper";
import PointerEventsFix from "@/utils/pointer-events";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} font-sans antialiased`}>
      <body>
        <AuthProvider>
          <ThemeProviderWrapper>
            {children}
            <Toaster position="top-center" duration={3000} richColors />
            <PointerEventsFix />
          </ThemeProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  try {
    // For metadata, we use default settings (without project_id)
    // Project-specific metadata will be handled at the page level
    // Note: getProjectId() will return null on server-side
    let settings;
    settings = await settingsService.getSettingsById();

    return {
      title: {
        template: `%s | ${settings?.site_name || process.env.THEME_SITE_NAME || "Kaizen Developers"}`,
        default:
          settings?.site_name ||
          process.env.THEME_SITE_NAME ||
          "Kaizen Developers",
      },
      description:
        settings?.site_description || "Manage your projects efficiently",
      icons: {
        icon:
          settings?.favicon_url || process.env.THEME_FAV_ICON || "/favicon.ico",
        apple:
          settings?.favicon_url || process.env.THEME_FAV_ICON || "/favicon.ico",
      },
      manifest: "/manifest.json",
      themeColor: settings?.primary_color || "#0070f3",
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
      title: {
        template: `%s | ${process.env.THEME_SITE_NAME || "Kaizen Developers"}`,
        default: process.env.THEME_SITE_NAME || "Kaizen Developers",
      },
      description: "Manage your projects efficiently",
      icons: {
        icon: process.env.THEME_FAV_ICON || "/favicon.ico",
        apple: process.env.THEME_FAV_ICON || "/favicon.ico",
      },
      manifest: "/manifest.json",
      themeColor: "#0070f3",
    };
  }
}
