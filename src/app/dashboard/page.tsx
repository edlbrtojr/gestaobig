"use client";

import { useState, useEffect } from "react";
import { DashboardConfig, DashboardWidgetConfig, DashboardConfig as DashboardConfigType } from "@/components/dashboard/dashboard-config";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getGraphSchema } from "@/lib/schema";
import { Pencil, Save, RefreshCw } from "lucide-react";
import { toast } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { saveDashboardConfigToDb, getDashboardConfigFromDb } from "@/lib/dashboard";
import { resetConnectionError } from "@/lib/neo4j";

// Configuração padrão do dashboard
const DEFAULT_DASHBOARD_CONFIG: DashboardConfigType = {
  id: "default",
  name: "Dashboard Neo4j",
  widgets: []
};

export default function DashboardPage() {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfigType>(DEFAULT_DASHBOARD_CONFIG);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableNodeTypes, setAvailableNodeTypes] = useState<string[]>([]);

  // Carregar configuração do dashboard do banco de dados ou localStorage na primeira renderização
  useEffect(() => {
    const loadDashboardConfig = async () => {
      try {
        // Tentar carregar do banco de dados primeiro (com fallback para localStorage)
        const dbConfig = await getDashboardConfigFromDb();
        
        if (dbConfig) {
          setDashboardConfig(dbConfig);
        } else {
          // Inicializar com exemplos padrão se não houver configuração salva
          await initializeDefaultDashboard();
        }
      } catch (error) {
        console.error("Falha ao carregar configuração do dashboard:", error);
        await initializeDefaultDashboard();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Carregar tipos de nós disponíveis do schema
    loadNodeTypes();
    
    // Carregar a configuração do dashboard
    loadDashboardConfig();
  }, []);

  // Carregar tipos de nós do schema
  const loadNodeTypes = async () => {
    try {
      const schema = await getGraphSchema();
      setAvailableNodeTypes(Object.keys(schema.nodeTypes));
    } catch (error) {
      console.error("Falha ao carregar schema:", error);
    }
  };

  // Inicializar com alguns widgets de exemplo
  const initializeDefaultDashboard = async () => {
    try {
      const schema = await getGraphSchema();
      const nodeTypes = Object.keys(schema.nodeTypes);
      
      if (nodeTypes.length === 0) return;

      // Criar widgets padrão baseados nos tipos de nós disponíveis
      const defaultWidgets: DashboardWidgetConfig[] = [];
      
      // Adicionar cards de resumo para os primeiros 3 tipos de nós (ou menos, se não houver tipos suficientes)
      nodeTypes.slice(0, Math.min(3, nodeTypes.length)).forEach((nodeType, index) => {
        defaultWidgets.push({
          id: `resumo-${index}`,
          type: "nodeSummary",
          title: `Resumo de ${schema.nodeTypes[nodeType].label || nodeType}`,
          size: "small",
          config: {
            nodeLabel: nodeType,
            limit: 5
          }
        });
      });
      
      // Adicionar gráfico de relacionamentos
      defaultWidgets.push({
        id: "relacionamentos",
        type: "relationshipChart",
        title: "Distribuição de Relacionamentos",
        size: "full",
        config: {
          height: 400
        }
      });
      
      // Adicionar distribuição de propriedades se houver pelo menos um tipo de nó
      if (nodeTypes.length > 0) {
        defaultWidgets.push({
          id: "distribuicao-propriedades",
          type: "propertyDistribution",
          title: `Propriedades de ${schema.nodeTypes[nodeTypes[0]].label || nodeTypes[0]}`,
          size: "medium",
          config: {
            nodeLabel: nodeTypes[0],
            chartType: "pie",
            height: 350
          }
        });
      }
      
      // Adicionar mini grafo
      defaultWidgets.push({
        id: "mini-grafo",
        type: "miniGraph",
        title: "Visão Geral do Grafo",
        size: "large",
        config: {
          maxNodes: 30,
          height: 350,
          filterOptions: {
            nodeLabels: nodeTypes.slice(0, Math.min(5, nodeTypes.length))
          }
        }
      });
      
      const defaultConfig = {
        ...DEFAULT_DASHBOARD_CONFIG,
        widgets: defaultWidgets
      };
      
      setDashboardConfig(defaultConfig);
      
      // Salvar no localStorage e no banco de dados
      await saveDashboardConfigToDb(defaultConfig);
      
    } catch (error) {
      console.error("Falha ao inicializar dashboard padrão:", error);
    }
  };

  // Salvar configuração do dashboard no localStorage e no banco de dados
  const saveDashboardConfig = async (config: DashboardConfigType) => {
    try {
      setIsSaving(true);
      setDashboardConfig(config);
      
      await saveDashboardConfigToDb(config);
      
      toast.success("Dashboard salvo", {
        description: "Seu layout de dashboard foi salvo com sucesso."
      });
    } catch (error) {
      console.error("Erro ao salvar dashboard:", error);
      toast.error("Erro ao salvar", {
        description: "Não foi possível salvar seu dashboard. Tente novamente mais tarde."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Adicionar um novo widget ao dashboard
  const addWidget = async (widget: DashboardWidgetConfig) => {
    const updatedConfig = {
      ...dashboardConfig,
      widgets: [...dashboardConfig.widgets, widget]
    };
    
    await saveDashboardConfig(updatedConfig);
  };

  // Remover um widget do dashboard
  const removeWidget = async (widgetId: string) => {
    const updatedConfig = {
      ...dashboardConfig,
      widgets: dashboardConfig.widgets.filter(widget => widget.id !== widgetId)
    };
    
    await saveDashboardConfig(updatedConfig);
  };

  // Manipular reordenação de widgets via drag and drop
  const handleReorderWidgets = async (newWidgets: DashboardWidgetConfig[]) => {
    const updatedConfig = {
      ...dashboardConfig,
      widgets: newWidgets
    };
    
    setDashboardConfig(updatedConfig);
    localStorage.setItem("dashboardConfig", JSON.stringify(updatedConfig));
    
    // Salvar no banco de dados, mas sem mostrar toast para não interromper a experiência do usuário
    try {
      await saveDashboardConfigToDb(updatedConfig);
    } catch (error) {
      console.error("Erro ao sincronizar reordenação:", error);
    }
  };

  // Atualizar configuração de widget
  const handleUpdateWidget = async (updatedWidget: DashboardWidgetConfig) => {
    const updatedWidgets = dashboardConfig.widgets.map(widget => 
      widget.id === updatedWidget.id ? updatedWidget : widget
    );
    
    const updatedConfig = {
      ...dashboardConfig,
      widgets: updatedWidgets
    };
    
    await saveDashboardConfig(updatedConfig);
    
    toast.success("Widget atualizado", {
      description: `${updatedWidget.title} foi atualizado com sucesso.`
    });
  };

  // Resetar para o dashboard padrão
  const resetDashboard = async () => {
    localStorage.removeItem("dashboardConfig");
    await initializeDefaultDashboard();
    
    toast.info("Dashboard redefinido", {
      description: "Seu dashboard foi redefinido para o padrão."
    });
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-4 px-4 w-full">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="edit-mode"
                checked={isEditing}
                onCheckedChange={setIsEditing}
              />
              <Label htmlFor="edit-mode" className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                Modo de Edição
              </Label>
            </div>
            
            {isEditing && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => saveDashboardConfig(dashboardConfig)}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar Dashboard"}
                </Button>
                
                <DashboardConfig
                  currentConfig={dashboardConfig}
                  onSave={saveDashboardConfig}
                  onAddWidget={addWidget}
                  onRemoveWidget={removeWidget}
                  onReset={resetDashboard}
                />
              </>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Carregando dashboard...</p>
          </div>
        ) : (
          <>
            <DashboardGrid 
              widgets={dashboardConfig.widgets}
              onRemoveWidget={removeWidget}
              isEditing={isEditing}
              onReorderWidgets={isEditing ? handleReorderWidgets : undefined}
              onUpdateWidget={isEditing ? handleUpdateWidget : undefined}
            />
          </>
        )}
      </div>
    </>
  );
}
