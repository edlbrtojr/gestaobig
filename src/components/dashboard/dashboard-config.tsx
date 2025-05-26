"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getGraphSchema } from "@/lib/schema";
import { Plus, X, Save, Settings, PlusCircle } from "lucide-react";
import { GraphSchema } from "@/lib/schema";
import { getNumericPropertyNames, getCategoricalPropertyNames } from "@/lib/property-discovery";

export interface DashboardWidgetConfig {
  id: string;
  type: "nodeSummary" | "propertyDistribution" | "relationshipChart" | "miniGraph" | "advancedChart";
  title: string;
  size: "small" | "medium" | "large" | "full";
  config: {
    nodeLabel?: string;
    property?: string;
    chartType?: "pie" | "bar" | "line" | "donut" | "area" | "radar";
    showLegend?: boolean;
    colorScheme?: "default" | "blues" | "greens" | "oranges" | "purples" | "category10";
    filterOptions?: {
      nodeLabels?: string[];
      relationshipTypes?: string[];
      propertyFilters?: any[];
    };
    maxNodes?: number;
    limit?: number;
    height?: number;
    // Advanced chart options
    sourceNodeLabel?: string;
    targetNodeLabel?: string;
    relationshipType?: string;
    propertyToAggregate?: string;
    aggregationMethod?: "sum" | "avg" | "count" | "min" | "max";
    groupByProperty?: string;
    sortDirection?: "asc" | "desc";
    topResults?: number;
  };
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidgetConfig[];
}

interface DashboardConfigProps {
  currentConfig: DashboardConfig;
  onSave: (config: DashboardConfig) => void;
  onAddWidget: (widget: DashboardWidgetConfig) => void;
  onRemoveWidget: (widgetId: string) => void;
  onReset: () => void;
}

export function DashboardConfig({
  currentConfig,
  onSave,
  onAddWidget,
  onRemoveWidget,
  onReset,
}: DashboardConfigProps) {
  const [config, setConfig] = useState<DashboardConfig>(currentConfig);
  const [schema, setSchema] = useState<GraphSchema>({ nodeTypes: {}, relationshipTypes: {} });
  const [newWidget, setNewWidget] = useState<Partial<DashboardWidgetConfig>>({
    type: "nodeSummary",
    title: "",
    size: "medium",
    config: {
      nodeLabel: "",
    },
  });
  const [open, setOpen] = useState(false);
  
  // Add these state variables at the component top level instead of inside renderWidgetConfigForm
  const [sourceProperties, setSourceProperties] = useState<string[]>([]);
  const [categoryProperties, setCategoryProperties] = useState<string[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);

  // Load properties when source node label or target node label changes
  useEffect(() => {
    const loadProperties = async () => {
      if (!newWidget.config?.sourceNodeLabel) return;
      
      setLoadingProperties(true);
      try {
        // Load numeric properties for aggregation
        const numericProps = await getNumericPropertyNames(newWidget.config.sourceNodeLabel);
        setSourceProperties(numericProps);
        
        // If we have a target node label, load its categorical properties
        if (newWidget.config?.targetNodeLabel) {
          const catProps = await getCategoricalPropertyNames(newWidget.config.targetNodeLabel);
          setCategoryProperties(catProps);
        }
      } catch (error) {
        console.error("Error loading properties:", error);
      } finally {
        setLoadingProperties(false);
      }
    };
    
    if (newWidget.type === "advancedChart") {
      loadProperties();
    }
  }, [newWidget.config?.sourceNodeLabel, newWidget.config?.targetNodeLabel, newWidget.type]);

  // Carregar o schema do grafo
  useEffect(() => {
    const loadSchema = async () => {
      const loadedSchema = await getGraphSchema();
      setSchema(loadedSchema);

      // Se o novo widget não tem um nodeLabel definido, selecione o primeiro
      if (
        newWidget.type === "nodeSummary" &&
        (!newWidget.config?.nodeLabel || newWidget.config.nodeLabel === "") &&
        Object.keys(loadedSchema.nodeTypes).length > 0
      ) {
        setNewWidget((prev) => ({
          ...prev,
          config: {
            ...prev.config,
            nodeLabel: Object.keys(loadedSchema.nodeTypes)[0],
          },
        }));
      }
    };

    loadSchema();
  }, [open]);

  // Atualizar configuração local quando as props mudarem
  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const handleSave = () => {
    onSave(config);
  };

  const handleAddWidget = () => {
    if (!newWidget.title || !newWidget.type) return;

    const widget: DashboardWidgetConfig = {
      id: Date.now().toString(),
      type: newWidget.type as any,
      title: newWidget.title,
      size: newWidget.size || "medium",
      config: newWidget.config || {},
    };

    onAddWidget(widget);
    setOpen(false);

    // Resetar o formulário do novo widget
    setNewWidget({
      type: "nodeSummary",
      title: "",
      size: "medium",
      config: {
        nodeLabel: Object.keys(schema.nodeTypes)[0] || "",
      },
    });
  };

  const renderWidgetConfigForm = () => {
    switch (newWidget.type) {
      case "nodeSummary":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nodeLabel">Tipo de Nó</Label>
              <Select
                value={newWidget.config?.nodeLabel || ""}
                onValueChange={(value) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, nodeLabel: value },
                    title: prev.title || `Resumo de ${value}`,
                  }))
                }
              >
                <SelectTrigger id="nodeLabel">
                  <SelectValue placeholder="Selecione o tipo de nó" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(schema.nodeTypes).map(([key, nodeType]) => (
                    <SelectItem key={key} value={key}>
                      {nodeType.label || key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limite</Label>
              <Input
                id="limit"
                type="number"
                value={newWidget.config?.limit || "5"}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      limit: parseInt(e.target.value) || 5,
                    },
                  }))
                }
              />
            </div>
          </div>
        );

      case "propertyDistribution":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nodeLabel">Tipo de Nó</Label>
              <Select
                value={newWidget.config?.nodeLabel || ""}
                onValueChange={(value) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, nodeLabel: value },
                    title: prev.title || `Propriedades de ${value}`,
                  }))
                }
              >
                <SelectTrigger id="nodeLabel">
                  <SelectValue placeholder="Selecione o tipo de nó" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(schema.nodeTypes).map(([key, nodeType]) => (
                    <SelectItem key={key} value={key}>
                      {nodeType.label || key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chartType">Tipo de Gráfico</Label>
              <Select
                value={newWidget.config?.chartType || "pie"}
                onValueChange={(value: "pie" | "bar" | "line" | "donut" | "area" | "radar") =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, chartType: value },
                  }))
                }
              >
                <SelectTrigger id="chartType">
                  <SelectValue placeholder="Selecione o tipo de gráfico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pie">Gráfico de Pizza</SelectItem>
                  <SelectItem value="bar">Gráfico de Barras</SelectItem>
                  <SelectItem value="line">Gráfico de Linha</SelectItem>
                  <SelectItem value="donut">Gráfico de Rosca</SelectItem>
                  <SelectItem value="area">Gráfico de Área</SelectItem>
                  <SelectItem value="radar">Gráfico Radar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorScheme">Esquema de Cores</Label>
              <Select
                value={newWidget.config?.colorScheme || "default"}
                onValueChange={(value: "default" | "blues" | "greens" | "oranges" | "purples" | "category10") =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, colorScheme: value },
                  }))
                }
              >
                <SelectTrigger id="colorScheme">
                  <SelectValue placeholder="Esquema de cores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="blues">Azuis</SelectItem>
                  <SelectItem value="greens">Verdes</SelectItem>
                  <SelectItem value="oranges">Laranjas</SelectItem>
                  <SelectItem value="purples">Roxos</SelectItem>
                  <SelectItem value="category10">Categoria 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="showLegend"
                checked={!!newWidget.config?.showLegend}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, showLegend: e.target.checked },
                  }))
                }
              />
              <Label htmlFor="showLegend">Mostrar Legenda</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={newWidget.config?.height || "300"}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      height: parseInt(e.target.value) || 300,
                    },
                  }))
                }
              />
            </div>
          </div>
        );

      case "relationshipChart":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={newWidget.config?.height || "400"}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      height: parseInt(e.target.value) || 400,
                    },
                  }))
                }
              />
            </div>
          </div>
        );

      case "miniGraph":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nodeLabels">Tipos de Nós a Incluir</Label>
              <div className="space-x-2">
                {Object.entries(schema.nodeTypes).map(([key, nodeType]) => {
                  const isSelected = newWidget.config?.filterOptions?.nodeLabels?.includes(key);
                  return (
                    <Badge
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setNewWidget((prev) => {
                          const currentLabels = prev.config?.filterOptions?.nodeLabels || [];
                          const newLabels = isSelected
                            ? currentLabels.filter((label) => label !== key)
                            : [...currentLabels, key];
                          return {
                            ...prev,
                            config: {
                              ...prev.config,
                              filterOptions: {
                                ...prev.config?.filterOptions,
                                nodeLabels: newLabels,
                              },
                            },
                          };
                        });
                      }}
                    >
                      {nodeType.label || key}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxNodes">Máximo de Nós</Label>
              <Input
                id="maxNodes"
                type="number"
                value={newWidget.config?.maxNodes || "30"}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      maxNodes: parseInt(e.target.value) || 30,
                    },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={newWidget.config?.height || "400"}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      height: parseInt(e.target.value) || 400,
                    },
                  }))
                }
              />
            </div>
          </div>
        );

      case "advancedChart":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceNodeLabel">Nó de Origem</Label>
              <Select
                value={newWidget.config?.sourceNodeLabel || ""}
                onValueChange={(value) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, sourceNodeLabel: value },
                    title: prev.title || `Análise de ${value}`,
                  }))
                }
              >
                <SelectTrigger id="sourceNodeLabel">
                  <SelectValue placeholder="Selecione o tipo de nó de origem" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(schema.nodeTypes).map(([key, nodeType]) => (
                    <SelectItem key={key} value={key}>
                      {nodeType.label || key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyToAggregate">
                Propriedade para Agregar
                {loadingProperties && <span className="ml-2 text-xs text-muted-foreground">Carregando...</span>}
              </Label>
              <Select
                value={newWidget.config?.propertyToAggregate || ""}
                onValueChange={(value) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      propertyToAggregate: value,
                    },
                  }))
                }
                disabled={!newWidget.config?.sourceNodeLabel || loadingProperties || sourceProperties.length === 0}
              >
                <SelectTrigger id="propertyToAggregate">
                  <SelectValue placeholder={
                    loadingProperties 
                      ? "Carregando propriedades..." 
                      : sourceProperties.length === 0 
                        ? "Selecione o nó de origem primeiro" 
                        : "Selecione a propriedade"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {sourceProperties.map((prop) => (
                    <SelectItem key={prop} value={prop}>
                      {prop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceProperties.length === 0 && newWidget.config?.sourceNodeLabel && !loadingProperties && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhuma propriedade numérica encontrada. Você pode inserir o nome da propriedade manualmente.
                </p>
              )}
              {!newWidget.config?.sourceNodeLabel && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione o nó de origem para ver as propriedades disponíveis
                </p>
              )}
              {sourceProperties.length === 0 && (
                <Input
                  className="mt-2"
                  id="manualPropertyToAggregate"
                  value={newWidget.config?.propertyToAggregate || ""}
                  onChange={(e) =>
                    setNewWidget((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        propertyToAggregate: e.target.value,
                      },
                    }))
                  }
                  placeholder="Digite o nome da propriedade (ex: valor, pontuação)"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aggregationMethod">Método de Agregação</Label>
              <Select
                value={newWidget.config?.aggregationMethod || "sum"}
                onValueChange={(value: "sum" | "avg" | "count" | "min" | "max") =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, aggregationMethod: value },
                  }))
                }
              >
                <SelectTrigger id="aggregationMethod">
                  <SelectValue placeholder="Selecione o método de agregação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sum">Soma</SelectItem>
                  <SelectItem value="avg">Média</SelectItem>
                  <SelectItem value="count">Contagem</SelectItem>
                  <SelectItem value="min">Mínimo</SelectItem>
                  <SelectItem value="max">Máximo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-muted my-4 pt-4">
              <p className="text-sm font-medium mb-2">Agrupar Por (Opcional)</p>
              <p className="text-xs text-muted-foreground mb-4">
                Você pode agrupar os resultados por uma propriedade no mesmo nó ou por um nó relacionado.
              </p>
            </div>

            <div className="flex gap-2 items-center mb-4">
              <input
                type="checkbox"
                id="useRelationship"
                checked={!!newWidget.config?.targetNodeLabel}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setNewWidget((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        targetNodeLabel: undefined,
                        relationshipType: undefined,
                      },
                    }));
                  }
                }}
              />
              <Label htmlFor="useRelationship">Agrupar por nó relacionado</Label>
            </div>

            {!newWidget.config?.targetNodeLabel ? (
              <div className="space-y-2">
                <Label htmlFor="groupByProperty">Propriedade para Agrupar (no mesmo nó)</Label>
                <Select
                  value={newWidget.config?.groupByProperty || ""}
                  onValueChange={(value) =>
                    setNewWidget((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        groupByProperty: value,
                      },
                    }))
                  }
                  disabled={!newWidget.config?.sourceNodeLabel || loadingProperties}
                >
                  <SelectTrigger id="groupByProperty">
                    <SelectValue placeholder={
                      loadingProperties 
                        ? "Carregando propriedades..." 
                        : "Selecione a propriedade para agrupar"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceProperties.length > 0 && 
                      sourceProperties.map((prop) => (
                        <SelectItem key={prop} value={prop}>
                          {prop}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  className="mt-2"
                  id="manualGroupByProperty"
                  value={newWidget.config?.groupByProperty || ""}
                  onChange={(e) =>
                    setNewWidget((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        groupByProperty: e.target.value,
                      },
                    }))
                  }
                  placeholder="Digite o nome da propriedade (ex: categoria, departamento)"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="targetNodeLabel">Nó de Categoria</Label>
                  <Select
                    value={newWidget.config?.targetNodeLabel || ""}
                    onValueChange={(value) =>
                      setNewWidget((prev) => ({
                        ...prev,
                        config: { ...prev.config, targetNodeLabel: value },
                      }))
                    }
                  >
                    <SelectTrigger id="targetNodeLabel">
                      <SelectValue placeholder="Selecione o tipo de nó de categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(schema.nodeTypes).map(([key, nodeType]) => (
                        <SelectItem key={key} value={key}>
                          {nodeType.label || key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationshipType">Tipo de Relacionamento</Label>
                  <Select
                    value={newWidget.config?.relationshipType || ""}
                    onValueChange={(value) =>
                      setNewWidget((prev) => ({
                        ...prev,
                        config: { ...prev.config, relationshipType: value },
                      }))
                    }
                    disabled={!newWidget.config?.sourceNodeLabel || !newWidget.config?.targetNodeLabel}
                  >
                    <SelectTrigger id="relationshipType">
                      <SelectValue placeholder="Selecione o tipo de relacionamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(schema.relationshipTypes).map(([key, relType]) => (
                        <SelectItem key={key} value={key}>
                          {relType.type || key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupByProperty">Propriedade para Agrupar (no nó de categoria)</Label>
                  <Select
                    value={newWidget.config?.groupByProperty || ""}
                    onValueChange={(value) =>
                      setNewWidget((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          groupByProperty: value,
                        },
                      }))
                    }
                    disabled={!newWidget.config?.targetNodeLabel || loadingProperties}
                  >
                    <SelectTrigger id="groupByProperty">
                      <SelectValue placeholder={
                        loadingProperties 
                          ? "Carregando propriedades..." 
                          : "Selecione a propriedade para agrupar"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryProperties.length > 0 && 
                        categoryProperties.map((prop) => (
                          <SelectItem key={prop} value={prop}>
                            {prop}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2"
                    id="manualGroupByProperty"
                    value={newWidget.config?.groupByProperty || ""}
                    onChange={(e) =>
                      setNewWidget((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          groupByProperty: e.target.value,
                        },
                      }))
                    }
                    placeholder="Digite o nome da propriedade (ex: nome, tipo)"
                  />
                </div>
              </>
            )}

            <div className="border-t border-muted my-4 pt-4">
              <p className="text-sm font-medium mb-2">Opções de Visualização</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topResults">Limite de Resultados</Label>
              <Input
                id="topResults"
                type="number"
                min="1"
                step="1"
                value={newWidget.config?.topResults || "10"}
                onChange={(e) => {
                  // Parse as integer and ensure it's a positive number
                  const value = parseInt(e.target.value);
                  const safeValue = isNaN(value) || value < 1 ? 10 : Math.floor(value);
                  
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      topResults: safeValue,
                    },
                  }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortDirection">Ordem de Classificação</Label>
              <Select
                value={newWidget.config?.sortDirection || "desc"}
                onValueChange={(value: "asc" | "desc") =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, sortDirection: value },
                  }))
                }
              >
                <SelectTrigger id="sortDirection">
                  <SelectValue placeholder="Selecione a ordem de classificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Decrescente</SelectItem>
                  <SelectItem value="asc">Crescente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chartType">Tipo de Gráfico</Label>
              <Select
                value={newWidget.config?.chartType || "bar"}
                onValueChange={(value: "pie" | "bar" | "line" | "donut" | "area" | "radar") =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, chartType: value },
                  }))
                }
              >
                <SelectTrigger id="chartType">
                  <SelectValue placeholder="Selecione o tipo de gráfico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Gráfico de Barras</SelectItem>
                  <SelectItem value="pie">Gráfico de Pizza</SelectItem>
                  <SelectItem value="line">Gráfico de Linha</SelectItem>
                  <SelectItem value="donut">Gráfico de Rosca</SelectItem>
                  <SelectItem value="area">Gráfico de Área</SelectItem>
                  <SelectItem value="radar">Gráfico Radar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorScheme">Esquema de Cores</Label>
              <Select
                value={newWidget.config?.colorScheme || "default"}
                onValueChange={(value: "default" | "blues" | "greens" | "oranges" | "purples" | "category10") =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, colorScheme: value },
                  }))
                }
              >
                <SelectTrigger id="colorScheme">
                  <SelectValue placeholder="Esquema de cores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="blues">Azuis</SelectItem>
                  <SelectItem value="greens">Verdes</SelectItem>
                  <SelectItem value="oranges">Laranjas</SelectItem>
                  <SelectItem value="purples">Roxos</SelectItem>
                  <SelectItem value="category10">Categoria 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="showLegend"
                checked={!!newWidget.config?.showLegend}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: { ...prev.config, showLegend: e.target.checked },
                  }))
                }
              />
              <Label htmlFor="showLegend">Mostrar Legenda</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={newWidget.config?.height || "400"}
                onChange={(e) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      height: parseInt(e.target.value) || 400,
                    },
                  }))
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Adicionar Widget
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Widget ao Dashboard</DialogTitle>
            <DialogDescription>
              Configure um novo widget para adicionar ao seu dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-2 pl-2 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="widgetType">Tipo de Widget</Label>
              <Select
                value={newWidget.type || "nodeSummary"}
                onValueChange={(value) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    type: value as any,
                    config: value === "nodeSummary" || value === "propertyDistribution" 
                      ? { ...prev.config, nodeLabel: Object.keys(schema.nodeTypes)[0] || "" }
                      : value === "miniGraph"
                      ? { ...prev.config, filterOptions: { nodeLabels: [] } }
                      : {},
                  }))
                }
              >
                <SelectTrigger id="widgetType">
                  <SelectValue placeholder="Selecione o tipo de widget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nodeSummary">Resumo de Nós</SelectItem>
                  <SelectItem value="propertyDistribution">Distribuição de Propriedades</SelectItem>
                  <SelectItem value="relationshipChart">Gráfico de Relacionamentos</SelectItem>
                  <SelectItem value="miniGraph">Mini Grafo</SelectItem>
                  <SelectItem value="advancedChart">Gráfico Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título do Widget</Label>
              <Input
                id="title"
                value={newWidget.title}
                onChange={(e) =>
                  setNewWidget((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Digite o título do widget"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Tamanho do Widget</Label>
              <Select
                value={newWidget.size || "medium"}
                onValueChange={(value) =>
                  setNewWidget((prev) => ({
                    ...prev,
                    size: value as any,
                  }))
                }
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Selecione o tamanho do widget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno (1/3 da largura)</SelectItem>
                  <SelectItem value="medium">Médio (1/2 da largura)</SelectItem>
                  <SelectItem value="large">Grande (2/3 da largura)</SelectItem>
                  <SelectItem value="full">Largura Total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderWidgetConfigForm()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddWidget}>Adicionar Widget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" className="gap-2" onClick={handleSave}>
        <Save className="h-4 w-4" /> Salvar Layout
      </Button>

      <Button variant="outline" className="gap-2" onClick={onReset}>
        <Settings className="h-4 w-4" /> Redefinir
      </Button>
    </div>
  );
} 