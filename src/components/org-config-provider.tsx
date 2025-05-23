"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useOrgConfig } from '@/lib/hooks/use-org-config';
import { OrganizationConfig } from '@/app/api/config/route';

// Create context with default value
const OrgConfigContext = createContext<{
  config: OrganizationConfig;
  isLoading: boolean;
  error: Error | null;
  refreshConfig: () => Promise<void>;
  saveConfig: (newConfig: OrganizationConfig) => Promise<boolean>;
} | null>(null);

// Hook to use the organization config
export function useOrganizationConfig() {
  const context = useContext(OrgConfigContext);
  
  if (!context) {
    throw new Error('useOrganizationConfig must be used within an OrgConfigProvider');
  }
  
  return context;
}

interface OrgConfigProviderProps {
  children: ReactNode;
}

export function OrgConfigProvider({ children }: OrgConfigProviderProps) {
  const { config, isLoading, error, refreshConfig, saveConfig } = useOrgConfig();
  
  return (
    <OrgConfigContext.Provider value={{ 
      config, 
      isLoading, 
      error,
      refreshConfig,
      saveConfig
    }}>
      {children}
    </OrgConfigContext.Provider>
  );
} 