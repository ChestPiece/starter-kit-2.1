"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { SidebarGroupContent, useSidebar } from "@/components/ui/sidebar";
import { RemixiconComponentType } from "@remixicon/react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { User } from "@/types/types";
import Link from "next/link";

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

export function NavMain({ items, user }: { items: NavSection[]; user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile, setOpen } = useSidebar();

  const handleNavigation = (url: string) => {
    router.push(url);

    if (isMobile) {
      setOpenMobile(false);
    } else {
      // setOpen(false);
    }
  };

  // Create a function to check if a route is active
  const isRouteActive = (url: string) => {
    // Exact match for home page
    if (url === "/" && pathname === "/") return true;
    // For other routes, check if pathname starts with the URL (for nested routes)
    return url !== "/" && pathname.startsWith(url);
  };

  return (
    <>
      {items.length > 0 ? (
        items.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="uppercase text-muted-foreground/60">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {section.items && section.items.length > 0 ? (
                  section.items.map((item) => {
                    if (item.items?.length) {
                      return (
                        <Collapsible
                          key={item.title}
                          asChild
                          defaultOpen={isRouteActive(item.url)}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                isActive={isRouteActive(item.url)}
                              >
                                {item.icon && (
                                  <item.icon
                                    className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                    size={22}
                                    aria-hidden="true"
                                  />
                                )}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isRouteActive(subItem.url)}
                                    >
                                      <Link href={subItem.url}>
                                        {subItem.icon && (
                                          <subItem.icon
                                            className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                            size={22}
                                            aria-hidden="true"
                                          />
                                        )}
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                          isActive={isRouteActive(item.url)}
                        >
                          <Link href={item.url}>
                            {item.icon && (
                              <item.icon
                                className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                size={22}
                                aria-hidden="true"
                              />
                            )}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <SidebarMenuItem>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No items found
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))
      ) : (
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No menu items found
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
