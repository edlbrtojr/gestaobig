"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SideNavItemProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}

export function SideNavItem({ href, children, exact }: SideNavItemProps) {
  const pathname = usePathname();
  const isActive = exact 
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm font-medium ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
} 