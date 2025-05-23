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

export interface DashboardWidgetConfig {
  id: string;
  type: "nodeSummary" | "propertyDistribution" | "relationshipChart" | "miniGraph";
  title: string;
  size: "small" | "medium" | "large" | "full";
  config: {
    nodeLabel?: string;
    property?: string;
    chartType?: "pie" | "bar";
    filterOptions?: {
      nodeLabels?: string[];
      relationshipTypes?: string[];
      propertyFilters?: any[];
    };
    maxNodes?: number;
    limit?: number;
    height?: number;
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
                onValueChange={(value: "pie" | "bar") =>
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
                </SelectContent>
              </Select>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Widget ao Dashboard</DialogTitle>
            <DialogDescription>
              Configure um novo widget para adicionar ao seu dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
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