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
                onValueChange={(value: "pie" | "bar") =>
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
                </SelectContent>
              </Select>
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

        <div className="py-4 space-y-4">
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