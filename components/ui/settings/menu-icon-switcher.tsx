"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import Image from "next/image"
// import { Settings } from "@/modules/settings/models/setting"
import { Settings } from "@/modules/settings"
export function LogoTypeToggle({
  settings,
  value,
  onChange,
}: {
  settings: Settings
  value: "square" | "horizontal"
  onChange: (value: "square" | "horizontal") => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 mb-1">Logo Type</p>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => val && onChange(val as "square" | "horizontal")}
        className="grid sm:grid-cols-1 sm:flex gap-4 w-full"
      >
        {/* Square Logo */}
        <ToggleGroupItem
          value="square"
          className="w-75 h-20 border rounded-xl items-center justify-center p-3 text-xs transition-all data-[state=on]:border-blue-500 data-[state=on]:ring-2 data-[state=on]:ring-blue-300"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-primary text-sidebar-primary-foreground">
            <Image
              src={settings.logo_url || ""}
              width={settings.logo_setting === "square" ? 36 : 100}
              height={settings.logo_setting === "square" ? 36 : 100}
              alt={settings.site_name ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "Square Logo"}
              className="object-cover"
            />
          </div>
          <div className="grid flex-1 text-left text-base leading-tight">
            <span className="truncate font-medium">
              {settings.site_name ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "Square Logo"}
            </span>
          </div>
        </ToggleGroupItem>

        {/* Horizontal Logo */}
        <ToggleGroupItem
          value="horizontal"
          className="w-50 h-20 border rounded-xl flex items-center justify-center p-3 text-xs transition-all data-[state=on]:border-blue-500 data-[state=on]:ring-2 data-[state=on]:ring-blue-300"
        >
          <div className="flex w-25 h-12 aspect-square items-center justify-center overflow-hidden bg-primary text-sidebar-primary-foreground">
            <Image
              src={settings.logo_url || ""}
              width={100}
              height={100}
              className="w-full h-full object-cover"
              alt={settings.site_name ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "Horizontal Logo"}
            />
          </div>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
