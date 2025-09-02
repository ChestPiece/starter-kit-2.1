"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  User,
  Building,
  Paintbrush,
  MessageCircle,
  Link as LinkIcon,
  Ban,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ProfileSettings } from "@/components/module/settings/profile-settings";
import { OrganizationSettings } from "@/components/module/settings/organization-settings";
import { AppearanceSettings } from "@/components/module/settings/appearance-settings";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams } from "next/navigation";

export default function SettingsDialog() {
  const [activeSection, setActiveSection] = useState("Profile");
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const { settings } = useAuth();

  // Navigation data
  const data = {
    nav: [
      { name: "Profile", icon: User },
      { name: "Organization", icon: Building },
      { name: "Appearance", icon: Paintbrush },
    ],
  };

  useEffect(() => {
    setActiveSection("Profile");
  }, [tab]);

  // Render different setting sections
  const renderSettingsContent = () => {
    switch (activeSection) {
      case "Profile":
        return <ProfileSettings />;
      case "Organization":
        return settings ? <OrganizationSettings settings={settings} /> : null;
      case "Appearance":
        return settings ? <AppearanceSettings settings={settings} /> : null;

      default:
        return null;
    }
  };

  return (
    <div className="pt-6">
      <div className="">
        <SidebarProvider className="items-start min-h-auto">
          <Sidebar collapsible="none" className="hidden md:flex ">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === activeSection}
                          onClick={() => setActiveSection(item.name)}
                          className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                        >
                          <Link href={"#"}>
                            {item.icon && (
                              <item.icon
                                className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                size={22}
                                aria-hidden="true"
                              />
                            )}
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex flex-col w-full">
            <ScrollArea className="h-[calc(100vh-110px)] overflow-y-auto">
              <div className="flex flex-col gap-4 pl-4 pr-0 pt-0 pb-0 ">
                {renderSettingsContent()}
              </div>
            </ScrollArea>
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}
