"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { OrganizationConfig } from "@/app/api/config/route";

// Default configuration
const defaultConfig: OrganizationConfig = {
  name: "Sistema FIEAC",
  shortName: "FIEAC",
  logoUrl: "/uploads/4072219a-04e7-4c79-9428-dc6e5169f574.png",
  logoSmallUrl: "/uploads/8af51858-0543-424d-8d59-ba57c1ede5a1.png",
  faviconUrl: "/favicon.ico",
  primaryColor: "#004a93",
  secondaryColor: "#f4791f",
  tertiaryColor: "#e5e5e5",
  footerText: "© 2023 FIEAC - Todos os direitos reservados",
  contactEmail: "contato@fieac.org.br",
  contactPhone: "(68) 3212-4200",
  address: "Rua Rui Barbosa, 735 - Centro, Rio Branco - AC, 69900-084",
  theme: {
    defaultMode: "light",
    enableSystem: true,
    lightLogo: "/uploads/4072219a-04e7-4c79-9428-dc6e5169f574.png",
    darkLogo: "/uploads/8af51858-0543-424d-8d59-ba57c1ede5a1.png",
  },
};

// Create context
type OrgConfigContextType = {
  config: OrganizationConfig;
  isLoading: boolean;
  error: Error | null;
  refreshConfig: () => Promise<void>;
};

const OrgConfigContext = createContext<OrgConfigContextType>({
  config: defaultConfig,
  isLoading: true,
  error: null,
  refreshConfig: async () => {},
});

// Hook for using the org config context
export const useOrgConfig = () => useContext(OrgConfigContext);

// Provider component
interface OrgConfigProviderProps {
  children: ReactNode;
  initialConfig?: OrganizationConfig;
}

export function OrgConfigProvider({
  children,
  initialConfig,
}: OrgConfigProviderProps) {
  const [config, setConfig] = useState<OrganizationConfig>(initialConfig || defaultConfig);
  const [isLoading, setIsLoading] = useState<boolean>(!initialConfig);
  const [error, setError] = useState<Error | null>(null);

  // Apply CSS variables based on config
  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;
    root.style.setProperty("--primary", config.primaryColor);
    root.style.setProperty("--secondary", config.secondaryColor);
    root.style.setProperty("--tertiary", config.tertiaryColor);

    // Update favicon if available
    if (config.faviconUrl) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = config.faviconUrl;
      } else {
        const newLink = document.createElement("link");
        newLink.rel = "icon";
        newLink.href = config.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [config]);

  // Fetch config from API
  const fetchConfig = async () => {
    if (initialConfig) return; // Skip fetch if initialConfig was provided

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error("Failed to fetch organization configuration");
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error("Error fetching organization config:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, []);

  // Function to refresh config
  const refreshConfig = async () => {
    await fetchConfig();
  };

  return (
    <OrgConfigContext.Provider value={{ config, isLoading, error, refreshConfig }}>
      {children}
    </OrgConfigContext.Provider>
  );
} 