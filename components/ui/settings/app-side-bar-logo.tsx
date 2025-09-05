"use client";

import * as React from "react";
import Image from "next/image";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { Settings } from "@/modules/settings";

// Function to handle image loading errors
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  console.log("Image failed to load, using fallback");
  // Use the environment variable for logo if available, otherwise use our fallback
  const fallbackLogo =
    process.env.NEXT_PUBLIC_SITE_LOGO ||
    process.env.NEXT_PUBLIC_LOGO_URL ||
    "/fallback-logo.svg";
  e.currentTarget.src = fallbackLogo;
  e.currentTarget.onerror = null; // Prevent infinite fallback loop
};

export function TeamSwitcher({
  teams,
  onTeamChange,
  settings,
}: {
  teams: {
    name: string;
    logo: string;
    logo_horizontal?: string;
    logo_setting: string;
  }[];
  onTeamChange?: (team: { name: string; logo: string }) => void;
  settings?: Settings;
}) {
  const router = useRouter();
  const [activeTeam, setActiveTeam] = React.useState(teams[0] ?? null);
  if (!teams.length) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => router.push("/")}
          size="lg"
          className="data-[state=open]:bg-sidebar-accent cursor-pointer data-[state=open]:text-sidebar-accent-foreground gap-3 [&>svg]:size-auto"
        >
          {/* Square Logo + Organization Name */}
          {settings &&
            settings.logo_setting === "square" &&
            settings.logo_url && (
              <>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 text-sidebar-primary-foreground">
                  <Image
                    src={settings.logo_url}
                    width={32}
                    height={32}
                    alt={
                      settings.site_name ??
                      process.env.NEXT_PUBLIC_SITE_NAME ??
                      ""
                    }
                    className="object-cover w-full h-full"
                    onError={handleImageError}
                  />
                </div>
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="truncate font-medium">
                    {settings?.site_name ?? process.env.NEXT_PUBLIC_SITE_NAME}
                  </span>
                </div>
              </>
            )}

          {/* Horizontal Logo Only */}
          {settings &&
            settings.logo_setting === "horizontal" &&
            settings.logo_horizontal_url && (
              <div className="flex w-full h-8 items-center justify-center overflow-hidden">
                <Image
                  src={settings.logo_horizontal_url}
                  width={120}
                  height={32}
                  alt={
                    settings.site_name ??
                    process.env.NEXT_PUBLIC_SITE_NAME ??
                    ""
                  }
                  className="object-contain w-full h-full"
                  onError={handleImageError}
                />
              </div>
            )}

          {/* Fallback: Show organization name if no logo */}
          {settings && !settings.logo_url && !settings.logo_horizontal_url && (
            <div className="grid flex-1 text-left text-base leading-tight">
              <span className="truncate font-medium">
                {settings?.site_name ?? process.env.NEXT_PUBLIC_SITE_NAME}
              </span>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
