"use client";

import { OrganizationConfig } from "@/app/api/config/route";

interface ThemeCSSVariablesProps {
  orgConfig: OrganizationConfig | null;
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