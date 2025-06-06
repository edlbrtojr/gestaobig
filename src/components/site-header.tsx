"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import ThemeToggle from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "./theme-provider";
import { siteConfig } from "@/config/site";

interface SiteHeaderProps {
  breadcrumbs?: React.ReactNode;
}

export function SiteHeader({ breadcrumbs }: SiteHeaderProps) {
  const { theme } = useTheme();
  const pathname = usePathname();

  // Function to generate breadcrumbs based on pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    // If we're on the home page, don't show breadcrumbs
    if (paths.length === 0) return null;

    const breadcrumbItems = paths.map((path, index) => {
      const href = `/${paths.slice(0, index + 1).join('/')}`;
      const isLast = index === paths.length - 1;
      const label = getBreadcrumbLabel(path);

      return (
        <React.Fragment key={path}>
          <BreadcrumbItem>
            {isLast ? (
              <BreadcrumbPage>{label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && <BreadcrumbSeparator />}
        </React.Fragment>
      );
    });

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {breadcrumbItems}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  // Function to get human-readable labels for breadcrumbs
  const getBreadcrumbLabel = (path: string): string => {
    const labels: { [key: string]: string } = {
      graph: 'O Tear',
      dashboard: 'Dashboard',
      settings: 'Configurações',
      organization: 'Organização',
      admin: 'Administração',
      aplicativo: 'Aplicativo',
      database: 'Banco de Dados',
      appearance: 'Aparência',
    };

    return labels[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Get the appropriate logos
  const lightLogo = siteConfig.theme.lightLogo;
  const darkLogo = siteConfig.theme.darkLogo;

  return (
    <header className="sticky top-0 z-40 w-full h-10 border-b border-border/40 bg-background">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Sidebar Trigger - visible on all screen sizes */}
          <SidebarTrigger className="text-muted-foreground" />

          {/* Mobile Logo */}
          <div className="md:hidden">
            <div className="relative h-8 w-32">
              <Image
                src={lightLogo}
                alt="Organization Logo"
                className="dark:hidden"
                fill
                style={{ objectFit: "contain", objectPosition: "left" }}
                priority
              />
              <Image
                src={darkLogo}
                alt="Organization Logo"
                className="hidden dark:block"
                fill
                style={{ objectFit: "contain", objectPosition: "left" }}
                priority
              />
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex">
            {breadcrumbs || generateBreadcrumbs()}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
