import { DashboardConfig } from "@/components/dashboard/dashboard-config";
import { executeQuery, isDatabaseAvailable } from "./neo4j";

/**
 * Salva a configuração do dashboard no banco de dados ou localStorage
 */
export async function saveDashboardConfigToDb(config: DashboardConfig): Promise<void> {
  // Sempre salve no localStorage como backup
  localStorage.setItem("dashboardConfig", JSON.stringify(config));
  
  // Verifica se o banco de dados está disponível
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    console.log("Banco de dados não disponível, usando apenas localStorage");
    return;
  }
  
  const query = `
    MERGE (d:Dashboard {id: $id})
    SET d.name = $name, 
        d.widgets = $widgets,
        d.updatedAt = datetime()
    RETURN d
  `;

  const params = {
    id: config.id,
    name: config.name,
    widgets: JSON.stringify(config.widgets)
  };

  try {
    await executeQuery(query, params);
    console.log("Configuração salva no banco de dados com sucesso");
  } catch (error) {
    console.error("Erro ao salvar configuração do dashboard no banco de dados:", error);
    // Não lançar erro, pois já salvamos no localStorage
  }
}

/**
 * Obtém a configuração do dashboard do banco de dados ou localStorage
 */
export async function getDashboardConfigFromDb(id: string = "default"): Promise<DashboardConfig | null> {
  // Verifica se o banco de dados está disponível
  const dbAvailable = await isDatabaseAvailable();
  
  // Se não estiver disponível, tente recuperar do localStorage
  if (!dbAvailable) {
    console.log("Banco de dados não disponível, usando localStorage");
    const savedConfig = localStorage.getItem("dashboardConfig");
    
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.error("Falha ao analisar configuração do localStorage:", error);
        return null;
      }
    }
    return null;
  }
  
  // Se o banco de dados estiver disponível, tente recuperar de lá
  const query = `
    MATCH (d:Dashboard {id: $id})
    RETURN d
  `;

  try {
    const result = await executeQuery(query, { id });
    
    if (result.records.length === 0) {
      // Se não encontrar no banco, tente no localStorage
      const savedConfig = localStorage.getItem("dashboardConfig");
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          // Salve no banco para futuras referências
          await saveDashboardConfigToDb(parsedConfig);
          return parsedConfig;
        } catch (error) {
          return null;
        }
      }
      return null;
    }

    const record = result.records[0];
    const dbDashboard = record.get('d').properties;

    const config = {
      id: dbDashboard.id,
      name: dbDashboard.name,
      widgets: JSON.parse(dbDashboard.widgets)
    };
    
    // Atualizar o localStorage com a versão do banco
    localStorage.setItem("dashboardConfig", JSON.stringify(config));
    
    return config;
  } catch (error) {
    console.error("Erro ao carregar configuração do dashboard do banco de dados:", error);
    
    // Tente recuperar do localStorage como fallback
    const savedConfig = localStorage.getItem("dashboardConfig");
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Lista todas as configurações de dashboard disponíveis
 */
export async function listDashboardConfigs(): Promise<DashboardConfig[]> {
  // Verifica se o banco de dados está disponível
  const dbAvailable = await isDatabaseAvailable();
  
  // Se não estiver disponível, retorne apenas a configuração do localStorage (se existir)
  if (!dbAvailable) {
    const savedConfig = localStorage.getItem("dashboardConfig");
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return [config];
      } catch (error) {
        return [];
      }
    }
    return [];
  }
  
  const query = `
    MATCH (d:Dashboard)
    RETURN d
    ORDER BY d.updatedAt DESC
  `;

  try {
    const result = await executeQuery(query);
    
    if (!result || !result.records) {
      return [];
    }
    
    return result.records.map((record: any) => {
      const dbDashboard = record.get('d').properties;
      
      return {
        id: dbDashboard.id,
        name: dbDashboard.name,
        widgets: JSON.parse(dbDashboard.widgets)
      };
    });
  } catch (error) {
    console.error("Erro ao listar configurações de dashboard:", error);
    
    // Tente recuperar do localStorage como fallback
    const savedConfig = localStorage.getItem("dashboardConfig");
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        return [config];
      } catch (error) {
        return [];
      }
    }
    return [];
  }
} 