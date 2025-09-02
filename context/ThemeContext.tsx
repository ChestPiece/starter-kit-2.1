"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: any;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (initialSettings?.appearance_theme) {
      return initialSettings.appearance_theme as Theme;
    }
    // if (typeof window !== "undefined") {
    //   const savedTheme = localStorage.getItem("theme") as Theme;
    //   return (
    //     savedTheme ||
    //     (window.matchMedia("(prefers-color-scheme: dark)").matches
    //       ? "dark"
    //       : "light")
    //   );
    // }
    return "light";
  });

  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    if (initialSettings?.primary_color) {
      return initialSettings.primary_color || "220 90% 56%";
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("primaryColor") || "220 90% 56%";
    }
    return "220 90% 56%";
  });

  const [secondaryColor, setSecondaryColorState] = useState<string>(() => {
    if (initialSettings?.secondary_color) {
      return initialSettings.secondary_color || "160 90% 44%";
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("secondaryColor") || "160 90% 44%";
    }
    return "160 90% 44%";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    const effectiveTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(effectiveTheme);

    // Save theme preference
    localStorage.setItem("theme", theme);

    // System theme listener
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      }
    };

    if (theme === "system") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    }

    return () => {
      if (theme === "system") {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      }
    };
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--secondary", secondaryColor);
    localStorage.setItem("primaryColor", primaryColor);
    localStorage.setItem("secondaryColor", secondaryColor);
  }, [primaryColor, secondaryColor]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      switch (prevTheme) {
        case "light":
          return "dark";
        case "dark":
          return "system";
        case "system":
        default:
          return "light";
      }
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  const setSecondaryColor = (color: string) => {
    setSecondaryColorState(color);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        primaryColor,
        secondaryColor,
        setPrimaryColor,
        setSecondaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
