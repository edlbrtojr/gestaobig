"use client";

import { useOrganizationConfig } from "@/components/org-config-provider";

export function HeadWithFavicon() {
  const { config } = useOrganizationConfig();
  
  return (
    <head>
      <link rel="icon" href={config?.faviconUrl || "/favicon.ico"} sizes="any" />
    </head>
  );
} 