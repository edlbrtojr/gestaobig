"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { DashboardWidgetConfig } from "./dashboard-config";
import { getGraphSchema } from "@/lib/schema";
import { GraphSchema } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { getNumericPropertyNames, getCategoricalPropertyNames } from "@/lib/property-discovery";

interface WidgetEditModalProps {
  widget: DashboardWidgetConfig | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedWidget: DashboardWidgetConfig) => void;
}

export function WidgetEditModal({
  widget,
  open,
  onClose,
  onSave,
}: WidgetEditModalProps) {
  const [editedWidget, setEditedWidget] = useState<DashboardWidgetConfig | null>(null);
  const [schema, setSchema] = useState<GraphSchema>({ nodeTypes: {}, relationshipTypes: {} });
  
  // Add these state variables at the component top level instead of inside renderWidgetSpecificFields
  const [sourceProperties, setSourceProperties] = useState<string[]>([]);
  const [categoryProperties, setCategoryProperties] = useState<string[]>([]);
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false);

  // Carregar schema e inicializar widget editado quando o modal abrir
  useEffect(() => {
    if (open && widget) {
      // Clone profundo do widget para evitar modificar o original
      setEditedWidget(JSON.parse(JSON.stringify(widget)));
      
      // Carregar schema
      const loadSchema = async () => {
        try {
          const loadedSchema = await getGraphSchema();
          setSchema(loadedSchema);
        } catch (error) {
          console.error("Falha ao carregar schema:", error);
        }
      };
      
      loadSchema();
    }
  }, [open, widget]);

  // Load properties when source node label or target node label changes
  useEffect(() => {
    const loadProperties = async () => {
      if (!editedWidget?.config?.sourceNodeLabel) return;
      
      setLoadingProperties(true);
      try {
        // Load numeric properties for aggregation
        const numericProps = await getNumericPropertyNames(editedWidget.config.sourceNodeLabel);
        setSourceProperties(numericProps);
        
        // If we have a target node label, load its categorical properties
        if (editedWidget.config.targetNodeLabel) {
          const catProps = await getCategoricalPropertyNames(editedWidget.config.targetNodeLabel);
          setCategoryProperties(catProps);
        }
      } catch (error) {
        console.error("Error loading properties:", error);
      } finally {
        setLoadingProperties(false);
      }
    };
    
    if (editedWidget?.type === "advancedChart") {
      loadProperties();
    }
  }, [editedWidget?.config?.sourceNodeLabel, editedWidget?.config?.targetNodeLabel, editedWidget?.type]);

  if (!editedWidget) {
    return null;
  }

  const handleSave = () => {
    if (editedWidget) {
      onSave(editedWidget);
      onClose();
    }
  };

  const renderWidgetSpecificFields = () => {
    switch (editedWidget.type) {
      case "nodeSummary":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="nodeLabel">Tipo de Nó</Label>
              <Select
                value={editedWidget.config.nodeLabel || ""}
                onValueChange={(value) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, nodeLabel: value },
                  })
                }
              >
                <SelectTrigger id="nodeLabel">
                  <SelectValue placeholder="Selecione um tipo de nó" />
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
              <Label htmlFor="limit">Limite de Exibição</Label>
              <Input
                id="limit"
                type="number"
                value={editedWidget.config.limit || 5}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      limit: parseInt(e.target.value) || 5,
                    },
                  })
                }
              />
            </div>
          </>
        );

      case "propertyDistribution":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="nodeLabel">Tipo de Nó</Label>
              <Select
                value={editedWidget.config.nodeLabel || ""}
                onValueChange={(value) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, nodeLabel: value },
                  })
                }
              >
                <SelectTrigger id="nodeLabel">
                  <SelectValue placeholder="Selecione um tipo de nó" />
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
                value={editedWidget.config.chartType || "pie"}
                onValueChange={(value: "pie" | "bar" | "line" | "donut" | "area" | "radar") =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, chartType: value },
                  })
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
                value={editedWidget.config.colorScheme || "default"}
                onValueChange={(value: "default" | "blues" | "greens" | "oranges" | "purples" | "category10") =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, colorScheme: value },
                  })
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
                checked={!!editedWidget.config.showLegend}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, showLegend: e.target.checked },
                  })
                }
              />
              <Label htmlFor="showLegend">Mostrar Legenda</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={editedWidget.config.height || 300}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      height: parseInt(e.target.value) || 300,
                    },
                  })
                }
              />
            </div>
          </>
        );

      case "relationshipChart":
        return (
          <div className="space-y-2">
            <Label htmlFor="height">Altura (px)</Label>
            <Input
              id="height"
              type="number"
              value={editedWidget.config.height || 400}
              onChange={(e) =>
                setEditedWidget({
                  ...editedWidget,
                  config: {
                    ...editedWidget.config,
                    height: parseInt(e.target.value) || 400,
                  },
                })
              }
            />
          </div>
        );

      case "miniGraph":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="nodeLabels">Tipos de Nós a Incluir</Label>
              <div className="space-x-1 flex flex-wrap gap-1 mt-2">
                {Object.entries(schema.nodeTypes).map(([key, nodeType]) => {
                  const nodeLabels = editedWidget.config.filterOptions?.nodeLabels || [];
                  const isSelected = nodeLabels.includes(key);
                  return (
                    <Badge
                      key={key}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentLabels = nodeLabels;
                        const newLabels = isSelected
                          ? currentLabels.filter((label) => label !== key)
                          : [...currentLabels, key];
                        setEditedWidget({
                          ...editedWidget,
                          config: {
                            ...editedWidget.config,
                            filterOptions: {
                              ...editedWidget.config.filterOptions,
                              nodeLabels: newLabels,
                            },
                          },
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
                value={editedWidget.config.maxNodes || 30}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      maxNodes: parseInt(e.target.value) || 30,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={editedWidget.config.height || 400}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      height: parseInt(e.target.value) || 400,
                    },
                  })
                }
              />
            </div>
          </>
        );

      case "advancedChart":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="sourceNodeLabel">Nó de Origem</Label>
              <Select
                value={editedWidget.config.sourceNodeLabel || ""}
                onValueChange={(value) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, sourceNodeLabel: value },
                  })
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
                value={editedWidget.config.propertyToAggregate || ""}
                onValueChange={(value) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      propertyToAggregate: value,
                    },
                  })
                }
                disabled={!editedWidget.config.sourceNodeLabel || loadingProperties || sourceProperties.length === 0}
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
              {sourceProperties.length === 0 && editedWidget.config.sourceNodeLabel && !loadingProperties && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhuma propriedade numérica encontrada. Você pode inserir o nome da propriedade manualmente.
                </p>
              )}
              {!editedWidget.config.sourceNodeLabel && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione o nó de origem para ver as propriedades disponíveis
                </p>
              )}
              {sourceProperties.length === 0 && (
                <Input
                  className="mt-2"
                  id="manualPropertyToAggregate"
                  value={editedWidget.config.propertyToAggregate || ""}
                  onChange={(e) =>
                    setEditedWidget({
                      ...editedWidget,
                      config: {
                        ...editedWidget.config,
                        propertyToAggregate: e.target.value,
                      },
                    })
                  }
                  placeholder="Digite o nome da propriedade (ex: valor, pontuação)"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aggregationMethod">Método de Agregação</Label>
              <Select
                value={editedWidget.config.aggregationMethod || "sum"}
                onValueChange={(value: "sum" | "avg" | "count" | "min" | "max") =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, aggregationMethod: value },
                  })
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
                checked={!!editedWidget.config.targetNodeLabel}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setEditedWidget({
                      ...editedWidget,
                      config: {
                        ...editedWidget.config,
                        targetNodeLabel: undefined,
                        relationshipType: undefined,
                      },
                    });
                  }
                }}
              />
              <Label htmlFor="useRelationship">Agrupar por nó relacionado</Label>
            </div>

            {!editedWidget.config.targetNodeLabel ? (
              <div className="space-y-2">
                <Label htmlFor="groupByProperty">Propriedade para Agrupar (no mesmo nó)</Label>
                <Select
                  value={editedWidget.config.groupByProperty || ""}
                  onValueChange={(value) =>
                    setEditedWidget({
                      ...editedWidget,
                      config: {
                        ...editedWidget.config,
                        groupByProperty: value,
                      },
                    })
                  }
                  disabled={!editedWidget.config.sourceNodeLabel || loadingProperties}
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
                  value={editedWidget.config.groupByProperty || ""}
                  onChange={(e) =>
                    setEditedWidget({
                      ...editedWidget,
                      config: {
                        ...editedWidget.config,
                        groupByProperty: e.target.value,
                      },
                    })
                  }
                  placeholder="Digite o nome da propriedade (ex: categoria, departamento)"
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="targetNodeLabel">Nó de Categoria</Label>
                  <Select
                    value={editedWidget.config.targetNodeLabel || ""}
                    onValueChange={(value) =>
                      setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, targetNodeLabel: value },
                      })
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
                    value={editedWidget.config.relationshipType || ""}
                    onValueChange={(value) =>
                      setEditedWidget({
                        ...editedWidget,
                        config: { ...editedWidget.config, relationshipType: value },
                      })
                    }
                    disabled={!editedWidget.config.sourceNodeLabel || !editedWidget.config.targetNodeLabel}
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
                    value={editedWidget.config.groupByProperty || ""}
                    onValueChange={(value) =>
                      setEditedWidget({
                        ...editedWidget,
                        config: {
                          ...editedWidget.config,
                          groupByProperty: value,
                        },
                      })
                    }
                    disabled={!editedWidget.config.targetNodeLabel || loadingProperties}
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
                    value={editedWidget.config.groupByProperty || ""}
                    onChange={(e) =>
                      setEditedWidget({
                        ...editedWidget,
                        config: {
                          ...editedWidget.config,
                          groupByProperty: e.target.value,
                        },
                      })
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
              <Label htmlFor="topResults">Resultados Principais</Label>
              <Input
                id="topResults"
                type="number"
                min="1"
                step="1"
                value={editedWidget.config.topResults || 10}
                onChange={(e) => {
                  // Parse as integer and ensure it's a positive number
                  const value = parseInt(e.target.value, 10);
                  const safeValue = isNaN(value) || value < 1 ? 10 : value;
                  
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      topResults: safeValue,
                    },
                  })
                }}
                placeholder="Número de resultados (10 padrão)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortDirection">Ordem de Classificação</Label>
              <Select
                value={editedWidget.config.sortDirection || "desc"}
                onValueChange={(value: "asc" | "desc") =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, sortDirection: value },
                  })
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
                value={editedWidget.config.chartType || "bar"}
                onValueChange={(value: "pie" | "bar" | "line" | "donut" | "area" | "radar") =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, chartType: value },
                  })
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
                value={editedWidget.config.colorScheme || "default"}
                onValueChange={(value: "default" | "blues" | "greens" | "oranges" | "purples" | "category10") =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, colorScheme: value },
                  })
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
                checked={!!editedWidget.config.showLegend}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: { ...editedWidget.config, showLegend: e.target.checked },
                  })
                }
              />
              <Label htmlFor="showLegend">Mostrar Legenda</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (px)</Label>
              <Input
                id="height"
                type="number"
                value={editedWidget.config.height || 400}
                onChange={(e) =>
                  setEditedWidget({
                    ...editedWidget,
                    config: {
                      ...editedWidget.config,
                      height: parseInt(e.target.value) || 400,
                    },
                  })
                }
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Widget: {editedWidget.title}</DialogTitle>
          <DialogDescription>
            Personalize as propriedades e aparência deste widget.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Widget</Label>
            <Input
              id="title"
              value={editedWidget.title}
              onChange={(e) =>
                setEditedWidget({ ...editedWidget, title: e.target.value })
              }
              placeholder="Digite o título do widget"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Tamanho do Widget</Label>
            <Select
              value={editedWidget.size}
              onValueChange={(value: "small" | "medium" | "large" | "full") =>
                setEditedWidget({ ...editedWidget, size: value })
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

          {renderWidgetSpecificFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 