"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganizationConfig } from "@/components/org-config-provider";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { config } = useOrganizationConfig();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle between light and dark only
  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // Memoized icon based on current theme
  const ThemeIcon = React.useMemo(() => {
    return theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />;
  }, [theme]);

  // Memoized aria label
  const ariaLabel = React.useMemo(() => {
    return theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  }, [theme]);

  // Memoized animation key
  const animationKey = React.useMemo(() => {
    return theme === "dark" ? "dark-icon" : "light-icon";
  }, [theme]);

  // Don't show toggle if system preference is not enabled
  if (!mounted || (config && !config.theme.enableSystem)) {
    return null;
  }

  // Determine current theme, defaulting to light if undefined
  const actualTheme = theme || "light";
  const currentTheme = actualTheme === "system" ? (resolvedTheme || "light") : actualTheme;
  const themeDisplayName = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative rounded-full w-7 h-7 flex items-center justify-center overflow-hidden p-0"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      data-theme-toggle-button
      data-current-theme={currentTheme}
      title={`Current: ${themeDisplayName} theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={animationKey}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {ThemeIcon}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
