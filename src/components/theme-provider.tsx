"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  [key: string]: any;
};

export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light"
      enableSystem
      forcedTheme={props.forcedTheme}
      storageKey="theme-preference"
      disableTransitionOnChange={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";
