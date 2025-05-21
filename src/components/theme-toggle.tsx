"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    // Prevent rapid theme changes during transition
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }

    // Allow theme changes again after transition completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 350); // Matches transition duration
  };

  // Get the icon based on current theme
  const getThemeIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-3.5 w-3.5" />;
    } else if (theme === "dark") {
      return <Moon className="h-3.5 w-3.5" />;
    } else {
      return <Sun className="h-3.5 w-3.5" />;
    }
  };

  // Get the aria label based on the next theme in cycle
  const getAriaLabel = () => {
    if (theme === "light") return "Switch to dark theme";
    if (theme === "dark") return "Switch to system theme";
    return "Switch to light theme";
  };

  // Get the animation key to ensure proper animation transitions
  const getAnimationKey = () => {
    if (theme === "system") return "system-icon";
    if (theme === "dark") return "dark-icon";
    return "light-icon";
  };

  if (!mounted) {
    return <div className="w-7 h-7" aria-hidden="true" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`relative rounded-full w-7 h-7 flex items-center justify-center overflow-hidden p-0 ${
        isTransitioning ? "pointer-events-none" : ""
      }`}
      onClick={cycleTheme}
      aria-label={getAriaLabel()}
      data-theme-toggle-button
      data-current-theme={theme}
      data-resolved-theme={resolvedTheme}
      title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme${
        theme === "system"
          ? ` (${
              resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)
            })`
          : ""
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={getAnimationKey()}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {getThemeIcon()}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
