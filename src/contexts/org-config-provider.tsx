"use client";

import { createContext, useContext, ReactNode, useState } from 'react';
import { OrganizationConfig } from '@/app/api/config/route';

// Configuração padrão
const defaultConfig: OrganizationConfig = {
  name: "Federação das Indústrias do Estado do Acre",
  shortName: "FIEAC",
  logoUrl: "/images/logo-fieac-azul.png",
  logoSmallUrl: "/images/logo-fieac-icon.png",
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
    darkLogo: "/images/logo-Sitema%20fieac-branco.png",
  }
};

// Criar contexto com valor padrão
const OrgConfigContext = createContext<{
  config: OrganizationConfig | null;
  isLoading: boolean;
  error: Error | null;
  refreshConfig: () => Promise<void>;
  saveConfig: (newConfig: OrganizationConfig) => Promise<boolean>;
}>({
  config: defaultConfig,
  isLoading: false,
  error: null,
  refreshConfig: async () => {},
  saveConfig: async () => false,
});

// Hook para usar a configuração da organização
export function useOrgConfig() {
  const [config, setConfig] = useState<OrganizationConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Função para atualizar a configuração
  const refreshConfig = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para salvar a configuração
  const saveConfig = async (newConfig: OrganizationConfig): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error('Failed to save config');
      setConfig(newConfig);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    config,
    isLoading,
    error,
    refreshConfig,
    saveConfig,
  };
}

// Hook para usar o contexto de configuração da organização
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

// Provedor de configuração da organização
export function OrgConfigProvider({ children }: OrgConfigProviderProps) {
  const orgConfig = useOrgConfig();
  
  return (
    <OrgConfigContext.Provider value={orgConfig}>
      {children}
    </OrgConfigContext.Provider>
  );
} 