import { useState, useEffect, useCallback } from 'react';
import { OrganizationConfig } from '@/app/api/config/route';
import { toast } from '@/lib/utils';

// Default configuration for when API calls fail
const defaultConfig: OrganizationConfig = {
  name: "",
  shortName: "",
  logoUrl: "",
  logoSmallUrl: "",
  faviconUrl: "",
  primaryColor: "#004a93",
  secondaryColor: "#f4791f",
  tertiaryColor: "#e5e5e5",
  footerText: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  theme: {
    defaultMode: "light",
    enableSystem: true,
    lightLogo: "",
    darkLogo: "",
  }
};

export function useOrgConfig() {
  const [config, setConfig] = useState<OrganizationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      // First try the Neo4j API endpoint
      let configData: OrganizationConfig | null = null;
      let fetchSuccess = false;
      
      try {
        const orgRes = await fetch('/api/organization', { cache: 'no-store' });
        if (orgRes.ok) {
          configData = await orgRes.json();
          fetchSuccess = true;
          console.log("Loaded configuration from Neo4j organization API");
        }
      } catch (orgError) {
        console.warn("Error fetching from organization API:", orgError);
        // Continue to try the config API
      }
      
      // If Neo4j fetch failed, try the config API
      if (!fetchSuccess) {
        try {
          const configRes = await fetch('/api/config', { cache: 'no-store' });
          if (configRes.ok) {
            configData = await configRes.json();
            fetchSuccess = true;
            console.log("Loaded configuration from config API");
          }
        } catch (configError) {
          console.warn("Error fetching from config API:", configError);
        }
      }
      
      // If both fetches failed, use default config
      if (!fetchSuccess || !configData) {
        console.warn("Using default configuration");
        configData = defaultConfig;
      }
      
      // Validate configuration data
      if (typeof configData !== 'object') {
        throw new Error('Invalid configuration data received');
      }
      
      setConfig(configData);
      setError(null);
      
      // Apply CSS variables for theme colors
      updateCssVariables(configData);
      updateFavicon(configData.faviconUrl);
    } catch (err) {
      console.error('Error fetching organization config:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast.error(`Configuration error: ${errorMessage}`);
      
      // Even on error, use default config to avoid breaking the UI
      setConfig(defaultConfig);
      updateCssVariables(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to update the favicon
  const updateFavicon = useCallback((faviconUrl: string | undefined) => {
    if (typeof window === 'undefined' || !faviconUrl) return;
    
    try {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = faviconUrl;
      }
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  }, []);

  // Function to update CSS variables
  const updateCssVariables = useCallback((config: OrganizationConfig) => {
    if (typeof window === 'undefined') return;
    
    try {
      const root = document.documentElement;
      
      if (config.primaryColor) {
        root.style.setProperty("--primary", config.primaryColor);
      }
      
      if (config.secondaryColor) {
        root.style.setProperty("--secondary", config.secondaryColor);
      }
      
      if (config.tertiaryColor) {
        root.style.setProperty("--tertiary", config.tertiaryColor);
      }
    } catch (error) {
      console.error('Error updating CSS variables:', error);
    }
  }, []);

  // Update CSS variables when config changes
  useEffect(() => {
    if (config) {
      updateCssVariables(config);
    }
  }, [config, updateCssVariables]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Function to save organization config
  const saveConfig = useCallback(async (newConfig: OrganizationConfig) => {
    try {
      // First try to save to the organization API
      let saveSuccess = false;
      
      try {
        const orgRes = await fetch('/api/organization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organization: {
            ...newConfig,
            label: '_inAppOrgConfig'
          }}),
        });

        if (orgRes.ok) {
          saveSuccess = true;
          console.log("Saved configuration to Neo4j organization API");
        }
      } catch (orgError) {
        console.warn("Error saving to organization API:", orgError);
      }
      
      // Always try to save to the config API as well
      try {
        const configRes = await fetch('/api/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newConfig),
        });

        if (configRes.ok) {
          saveSuccess = true;
          console.log("Saved configuration to config API");
        }
      } catch (configError) {
        console.warn("Error saving to config API:", configError);
      }
      
      if (!saveSuccess) {
        throw new Error("Failed to save configuration to any API endpoint");
      }

      // Update local state with new config
      setConfig(newConfig);
      
      // Update visual elements
      updateCssVariables(newConfig);
      if (newConfig.faviconUrl) {
        updateFavicon(newConfig.faviconUrl);
      }

      toast.success('Configuration saved successfully');
      return true;
    } catch (err) {
      console.error('Error saving organization config:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(err instanceof Error ? err : new Error(errorMessage));
      toast.error(`Failed to save configuration: ${errorMessage}`);
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