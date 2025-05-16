"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Determine the actual theme accounting for system preference
  const [actualTheme, setActualTheme] = useState<"dark" | "light">(
    theme === "dark" ? "dark" : "light"
  );

  // Update actual theme based on system preference when in system mode
  useEffect(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setActualTheme(systemTheme);

      // Listen for changes in system theme
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setActualTheme(theme as "dark" | "light");
    }
  }, [theme]);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === "system") {
      // If in system mode, set to opposite of current system theme
      setTheme(actualTheme === "dark" ? "light" : "dark");
    } else {
      // Toggle between light and dark
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  if (!mounted) {
    return <div className="w-10 h-10"></div>;
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        w-10 h-10 flex items-center justify-center rounded-md border 
        border-[var(--card-border)] bg-[var(--card-background)] text-[var(--foreground)]
        hover:bg-[var(--muted-background)] transition-all
        ${actualTheme === "dark" ? "shadow-inner" : ""}
      `}
      aria-label={`Switch to ${
        actualTheme === "dark" ? "light" : "dark"
      } theme`}
      title={`Current: ${
        theme === "system"
          ? "System"
          : theme.charAt(0).toUpperCase() + theme.slice(1)
      } theme`}
    >
      {actualTheme === "dark" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-[var(--primary)]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 text-[var(--primary)]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      )}
    </button>
  );
}
