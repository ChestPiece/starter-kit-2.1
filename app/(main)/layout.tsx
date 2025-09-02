"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import SideBarLayout from "@/components/main-layout/app-sidebar";
import CheckUserRole from "@/components/auth/check-user-role";
import { useAuth } from "@/context/AuthContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <CheckUserRole>
      <SideBarLayout settings={settings || undefined}>
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="px-4 md:px-6 lg:px-8">{children}</div>
        </ScrollArea>
      </SideBarLayout>
    </CheckUserRole>
  );
}
