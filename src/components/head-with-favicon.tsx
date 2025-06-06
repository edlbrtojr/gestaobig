"use client";

import { useOrganizationConfig } from "@/contexts/org-config-provider";
import { siteConfig as defaultConfig } from "@/config/site";

export function HeadWithFavicon() {
  // Tenta usar o hook do contexto com fallback para configuração padrão
  let config;
  try {
    const { config: orgConfig } = useOrganizationConfig();
    config = orgConfig;
  } catch (error) {
    console.warn("OrgConfigProvider não encontrado, usando configuração padrão");
    config = defaultConfig;
  }
  
  return (
    <head>
      <link rel="icon" href={config?.faviconUrl || "/favicon.ico"} sizes="any" />
    </head>
  );
} 