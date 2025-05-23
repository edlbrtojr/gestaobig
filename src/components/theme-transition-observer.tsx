"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeTransitionObserver() {
  const { theme, resolvedTheme } = useTheme();
  const [transitionActive, setTransitionActive] = useState(false);
  
  // Apply transition class when theme changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    
    // Start transition
    setTransitionActive(true);
    document.documentElement.classList.add("theme-transition");
    
    // Remove transition class after a short duration
    const timeoutId = window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
      setTransitionActive(false);
    }, 150); // Shorter duration to match CSS
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [theme, resolvedTheme]);
  
  return null;
} 