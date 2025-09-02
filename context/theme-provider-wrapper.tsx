"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const { settings } = useAuth();

  return <ThemeProvider initialSettings={settings}>{children}</ThemeProvider>;
}
