"use client";

import { OrganizationConfig } from "@/app/api/config/route";
import { siteConfig } from "@/config/site";

interface ThemeCSSVariablesProps {
  orgConfig: OrganizationConfig | null | typeof siteConfig;
}

export function ThemeCSSVariables({ orgConfig }: ThemeCSSVariablesProps) {
  return (
    <style jsx global>{`
      :root {
        --primary: ${orgConfig?.primaryColor || "#004a93"};
        --secondary: ${orgConfig?.secondaryColor || "#f4791f"};
        --tertiary: ${orgConfig?.tertiaryColor || "#e5e5e5"};
      }
    `}</style>
  );
} 