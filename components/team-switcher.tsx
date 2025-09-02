"use client";

import * as React from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RiExpandUpDownLine, RiAddLine } from "@remixicon/react";
import { useRouter } from "next/navigation";

export function TeamSwitcher({
  teams,
  onTeamChange,
}: {
  teams: {
    name: string;
    logo: string;
  }[];
  onTeamChange?: (team: { name: string; logo: string }) => void;
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
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-3 [&>svg]:size-auto"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-primary text-sidebar-primary-foreground">
            {activeTeam && (
              <Image
                src={activeTeam.logo}
                width={36}
                height={36}
                alt={activeTeam.name}
                className="object-cover"
              />
            )}
          </div>
          <div className="grid flex-1 text-left text-base leading-tight">
            <span className="truncate font-medium">
              {activeTeam?.name ?? "Select a Team"}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
