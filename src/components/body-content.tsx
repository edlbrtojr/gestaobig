"use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeTransitionObserver } from "@/components/theme-transition-observer";
import { ThemeCSSVariables } from "@/components/theme-css-variables";
import { DynamicFavicon } from "@/components/dynamic-favicon";
import { siteConfig } from "@/config/site";

interface BodyContentProps {
  children: ReactNode;
}

export function BodyContent({ children }: BodyContentProps) {
  return (
    <>
      <DynamicFavicon />
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full overflow-hidden bg-background relative">
          <AppSidebar className="z-50" />

          <SidebarInset className="flex flex-col flex-1 w-full">
            <SiteHeader />
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
              <div className="w-full max-w-full">{children}</div>
            </main>
          </SidebarInset>
        </div>
        <ThemeTransitionObserver />
      </SidebarProvider>
      <ThemeCSSVariables orgConfig={siteConfig} />
    </>
  );
} 