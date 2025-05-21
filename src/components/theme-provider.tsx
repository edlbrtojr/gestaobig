"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function useTheme() {
  return useContext(ThemeProviderContext);
}

export default function ThemeProvider({
  children,
  defaultTheme = "system",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  // Ensure correct initial theme before hydration
  useEffect(() => {
    // Read the theme from localStorage if available
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }

    setMounted(true);
  }, []);

  // Apply theme changes to DOM
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    let newResolvedTheme: "dark" | "light" = "light";

    // Store theme preference
    localStorage.setItem("theme", theme);

    // Start smooth transition
    if (!disableTransitionOnChange) {
      document.documentElement.classList.add("theme-transition");

      // Remove the transition class after the transition is complete
      const transitionTimeout = setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 350); // slightly longer than CSS transition duration

      return () => clearTimeout(transitionTimeout);
    }

    // Remove existing theme classes first
    root.classList.remove("light", "dark");
    root.removeAttribute("data-theme");

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      newResolvedTheme = systemTheme;

      // Set both class and data-theme attribute for better compatibility
      root.classList.add(systemTheme);
      root.setAttribute("data-theme", systemTheme);
    } else {
      newResolvedTheme = theme as "dark" | "light";

      // Set both class and data-theme attribute for the selected theme
      root.classList.add(theme);
      root.setAttribute("data-theme", theme);
    }

    // Update resolved theme
    setResolvedTheme(newResolvedTheme);
  }, [theme, enableSystem, attribute, mounted, disableTransitionOnChange]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
