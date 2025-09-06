"use client";

import * as React from "react";
import { useEffect, useState } from "react";

import { NavMain } from "@/components/main-layout/nav-main";
import { NavUser } from "@/components/main-layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getNavData } from "@/components/main-layout/menu-items";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "./header";
import { SearchForm } from "../search-form";
import { TeamSwitcher } from "../ui/settings/app-side-bar-logo";
import { Settings } from "@/modules/settings";
import { UserRoles } from "@/types/types";
import { RemixiconComponentType } from "@remixicon/react";
import { LucideIcon } from "lucide-react";

type IconType = LucideIcon | RemixiconComponentType;

interface NavSubItem {
  title: string;
  url: string;
  icon?: IconType;
  isActive?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon?: IconType;
  isActive?: boolean;
  items?: NavSubItem[];
}

interface NavSection {
  title: string;
  url: string;
  items: NavItem[];
}

function formatPathname(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SideBarLayout({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings?: Settings;
}) {
  const { userProfile } = useAuth();
  const [navItems, setNavItems] = useState<NavSection[]>([]);
  const [filteredNavItems, setFilteredNavItems] = useState<NavSection[]>([]);
  const pathname = usePathname();
  const title = formatPathname(pathname);

  const data: {
    teams: Array<{
      name: string;
      logo: string;
      logo_horizontal?: string;
      logo_setting: string;
    }>;
  } = {
    teams: [
      {
        name:
          settings?.site_name ||
          process.env.NEXT_PUBLIC_SITE_NAME ||
          "Starter Kit.",
        logo:
          settings?.logo_url ||
          process.env.NEXT_PUBLIC_LOGO_URL ||
          "https://res.cloudinary.com/dlzlfasou/image/upload/v1741345507/logo-01_kp2j8x.png",
        logo_horizontal: settings?.logo_horizontal_url,
        logo_setting:
          settings?.logo_setting ||
          process.env.NEXT_PUBLIC_LOGO_SETTING ||
          "square",
      },
    ],
  };

  // Get navigation data based on user's role
  useEffect(() => {
    if (userProfile) {
      const navData = getNavData({ roles: userProfile?.roles?.name });
      setNavItems(navData.navMain as NavSection[]);
      setFilteredNavItems(navData.navMain as NavSection[]); // Initialize filtered items
    }
  }, [userProfile]);

  // Handle search functionality
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // If search is empty, show all items
      setFilteredNavItems([...navItems]);
      return;
    }

    // Filter navigation items based on search term
    const filtered = navItems
      .map((section) => {
        // First check if the section title matches
        const sectionMatches = section.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        // Then filter the items within the section
        const filteredItems = section.items.filter((item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Return the section if either the section title matches or there are matching items
        if (sectionMatches || filteredItems.length > 0) {
          return {
            ...section,
            items: filteredItems,
          };
        }

        return null;
      })
      .filter(Boolean) as NavSection[];

    setFilteredNavItems(filtered);
  };

  if (!userProfile) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <TeamSwitcher teams={data.teams} settings={settings} />
            <hr className="border-t border-border mx-2 -mt-px" />
            <SearchForm
              className="mt-3"
              userRole={userProfile?.roles?.name}
              onSearch={handleSearch}
              navItems={navItems}
            />
          </SidebarHeader>
          <SidebarContent>
            <NavMain
              items={filteredNavItems}
              user={{
                ...userProfile,
                roles: { name: userProfile?.roles?.name || "" },
              }}
            />
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={userProfile || null} />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="overflow-hidden ">
          <div className="px-4 md:px-6 lg:px-8">
            <Header title={title} url={pathname} />
          </div>
          <main>{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
