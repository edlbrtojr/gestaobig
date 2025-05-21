"use client";

import * as React from "react";
import { Waypoints, Home, BarChart3, FileText, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { cn } from "@/lib/utils";

// App navigation data
const navItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "O Tear",
    url: "/graph",
    icon: Waypoints,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Documentação",
    url: "/documentation",
    icon: FileText,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
];

export function NavItems() {
  const { state } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        // Check for exact match (for home) or if the current path starts with the nav item URL (for nested routes)
        const isActive = 
          item.url === "/" 
            ? pathname === "/" 
            : pathname === item.url || pathname.startsWith(`${item.url}/`);
            
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
            >
              <a
                href={item.url}
                className={cn(
                  "flex items-center min-w-0",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <div className={cn(
                    "flex-shrink-0 w-5 h-5", 
                    state === "collapsed" && "mx-auto"
                  )}>
                    <item.icon className="w-full h-full" />
                  </div>
                  <span className="truncate">{item.title}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 group-data-[state=collapsed]:w-16"
      {...props}
    >
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center w-full gap-2">
          {/* Expanded state */}
          <div className="hidden group-data-[state=expanded]:flex items-center w-full gap-2">
            <div className="relative h-15 w-25">
              <Image
                src="/images/logo-fieac-azul.png"
                alt="FIEAC Logo"
                className="dark:hidden"
                fill
                style={{ objectFit: "contain", objectPosition: "left" }}
                priority
              />
              <Image
                src="/images/logo-fieac-branco.png"
                alt="FIEAC Logo"
                className="hidden dark:block"
                fill
                style={{ objectFit: "contain", objectPosition: "left" }}
                priority
              />
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Waypoints className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-lg">FRIGG</span>
            </div>
          </div>

          {/* Collapsed state */}
          <div className="flex group-data-[state=expanded]:hidden flex-col items-center justify-center w-full gap-2">
            <div className="relative h-6 w-16">
              <Image
                src="/images/logo-fieac-azul.png"
                alt="FIEAC Logo"
                className="dark:hidden"
                fill
                style={{ objectFit: "contain", objectPosition: "center" }}
                priority
              />
              <Image
                src="/images/logo-fieac-branco.png"
                alt="FIEAC Logo"
                className="hidden dark:block"
                fill
                style={{ objectFit: "contain", objectPosition: "center" }}
                priority
              />
            </div>
            <div className="w-full h-px bg-border" />
            <div className="flex items-center gap-2 size-5">
              <Waypoints className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs uppercase tracking-wider text-muted-foreground hidden group-data-[state=expanded]:block">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavItems />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto p-2 border-t border-sidebar-border">
        <div className="hidden group-data-[state=expanded]:block text-center">
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} FIEAC
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
