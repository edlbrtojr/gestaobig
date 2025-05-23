import { useState, useEffect, useCallback } from 'react';
import { OrganizationConfig } from '@/app/api/config/route';

const DEFAULT_CONFIG: OrganizationConfig = {
  name: "Federação das Indústrias do Estado do Acre",
  shortName: "FIEAC",
  logoUrl: "/images/logo-fieac-azul.png",
  logoSmallUrl: "/images/logo-small.png",
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
    lightLogo: "/images/logo-fieac-azul.png",
    darkLogo: "/images/logo-fieac-branco.png",
  }
};

export function useOrgConfig() {
  const [config, setConfig] = useState<OrganizationConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error('Failed to fetch organization configuration');
      }
      
      const configData = await res.json();
      setConfig(configData);
      setError(null);
      
      // Apply CSS variables for theme colors
      updateCssVariables(configData);
      updateFavicon(configData.faviconUrl);
    } catch (err) {
      console.error('Error fetching organization config:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to update the favicon
  const updateFavicon = useCallback((faviconUrl: string) => {
    if (typeof window === 'undefined' || !faviconUrl) return;
    
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    }
  }, []);

  // Function to update CSS variables
  const updateCssVariables = useCallback((config: OrganizationConfig) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    root.style.setProperty("--primary", config.primaryColor);
    root.style.setProperty("--secondary", config.secondaryColor);
    root.style.setProperty("--tertiary", config.tertiaryColor);
  }, []);

  // Update CSS variables when config changes
  useEffect(() => {
    updateCssVariables(config);
  }, [config, updateCssVariables]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Function to save organization config
  const saveConfig = useCallback(async (newConfig: OrganizationConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save organization configuration');
      }

      // Update local state with new config
      setConfig(newConfig);
      
      // Update visual elements
      updateCssVariables(newConfig);
      updateFavicon(newConfig.faviconUrl);

      return true;
    } catch (err) {
      console.error('Error saving organization config:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return false;
    }
  }, [updateCssVariables, updateFavicon]);

  return {
    config,
    isLoading,
    error,
    refreshConfig: fetchConfig,
    saveConfig,
  };
} 