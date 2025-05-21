"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waypoints, Menu } from "lucide-react";

import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "./theme-provider";

interface SiteHeaderProps {
  breadcrumbs?: React.ReactNode;
}

export function SiteHeader({ breadcrumbs }: SiteHeaderProps) {
  const { theme } = useTheme();
  const pathname = usePathname();

  // Default breadcrumbs if none provided
  const defaultBreadcrumbs = (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {pathname === "/graph" && (
          <BreadcrumbItem>
            <BreadcrumbPage>O Tear</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );

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
          </div>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex">
            {breadcrumbs || defaultBreadcrumbs}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatars/user.png" alt="User" />
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">FIEAC</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    usuario@fieac.org.br
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/perfil" className="w-full">
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/configuracoes" className="w-full">
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
