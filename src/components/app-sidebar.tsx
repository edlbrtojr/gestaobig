"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Waypoints, 
  Settings, 
  LayoutDashboard, 
  Home, 
  LogOut, 
  ChevronsUpDown,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarFooter, SidebarContent, SidebarHeader, SidebarRail, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  text: string;
  active?: boolean;
}

function SidebarNavItem({
  href,
  icon: Icon,
  text,
  active,
  className,
  ...props
}: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
      data-sidebar="menu-button"
      data-active={active}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      <span>{text}</span>
    </Link>
  );
}

function UserNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isMobile, state } = useSidebar();

  if (!isAuthenticated || !user) return null;

  // Extrair as iniciais do nome para o fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = user.name ? getInitials(user.name) : 'U';
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 w-full transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
              isCollapsed && "justify-center px-0"
            )}>
              <Avatar className="h-8 w-8 rounded-full bg-primary border-0 ring-0 shadow-none">
                <AvatarImage src={user.image || ""} alt={user.name || "Usuário"} className="border-0" />
                <AvatarFallback className="rounded-full border-0">{initials}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name || "Usuário"}</span>
                    <span className="truncate text-xs">{user.email || ""}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full bg-primary border-0 ring-0 shadow-none">
                  <AvatarImage src={user.image || ""} alt={user.name || "Usuário"} className="border-0" />
                  <AvatarFallback className="rounded-full border-0">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name || "Usuário"}</span>
                  <span className="truncate text-xs">{user.email || ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Minha Conta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [logoError, setLogoError] = React.useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  
  // Default values when no config is available
  const currentYear = new Date().getFullYear();
  
  // Get the logos from organization config or use error handlers
  const lightLogo = siteConfig.theme.lightLogo;
  const darkLogo = siteConfig.theme.darkLogo;
  const orgName = siteConfig.shortName || "Organization";
  const footerText = siteConfig.footerText || `© ${currentYear}`;
  
  const handleLogoError = () => {
    setLogoError(true);
    toast.error("Failed to load organization logo");
  };
  
  const pathname = usePathname();
  
  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r"
      {...props}
    >
      <SidebarHeader className="border-b px-2 py-2">
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-md px-2"
          data-sidebar="logo-container"
        >
          {!logoError ? (
            <div className="relative h-8 w-full max-w-[180px] min-w-[70px]">
              <Image
                src={lightLogo}
                alt={`${orgName} Logo`}
                className="dark:hidden object-contain object-left"
                fill
                priority
                onError={handleLogoError}
              />
              <Image
                src={darkLogo}
                alt={`${orgName} Logo`}
                className="hidden dark:block object-contain object-left"
                fill
                priority
                onError={handleLogoError}
              />
            </div>
          ) : (
            <span className="font-semibold text-xl truncate">{orgName}</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <nav className="grid gap-1">
          <SidebarNavItem
            href="/"
            icon={Home}
            text="Home"
            active={pathname === "/"}
          />
          <SidebarNavItem
            href="/graph"
            icon={Waypoints}
            text="O Tear"
            active={pathname === "/graph"}
          />
          {isAuthenticated && (
            <>
              <SidebarNavItem
                href="/dashboard"
                icon={LayoutDashboard}
                text="Dashboard"
                active={pathname === "/dashboard"}
              />
              <SidebarNavItem
                href="/settings"
                icon={Settings}
                text="Configurações"
                active={pathname.startsWith("/settings")}
              />
            </>
          )}
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        {isAuthenticated ? (
          <UserNav />
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-xs text-muted-foreground">
              {footerText}
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
