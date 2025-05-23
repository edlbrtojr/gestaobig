"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardWidgetConfig } from "./dashboard-config";
import { NodeSummaryCard } from "./node-summary-card";
import { PropertyDistribution } from "./property-distribution";
import { RelationshipChart } from "./relationship-chart";
import { MiniGraph } from "./mini-graph";
import { X, GripVertical, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetEditModal } from "./widget-edit-modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  MeasuringStrategy
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cva } from "class-variance-authority";

interface DashboardGridProps {
  widgets: DashboardWidgetConfig[];
  onRemoveWidget: (id: string) => void;
  isEditing: boolean;
  onReorderWidgets?: (newWidgets: DashboardWidgetConfig[]) => void;
  onUpdateWidget?: (updatedWidget: DashboardWidgetConfig) => void;
}

// Define classes de colunas do grid com base no tamanho do widget
const getColSpan = (size: string) => {
  switch (size) {
    case "small":
      return "col-span-12 md:col-span-4"; // Largura total em dispositivos móveis, 1/3 em desktop
    case "medium":
      return "col-span-12 md:col-span-6"; // Largura total em dispositivos móveis, 1/2 em desktop
    case "large":
      return "col-span-12 md:col-span-8"; // Largura total em dispositivos móveis, 2/3 em desktop
    case "full":
      return "col-span-12"; // Sempre largura total
    default:
      return "col-span-12 md:col-span-6"; // Padrão para médio
  }
};

// Adicionar variantes de estilo de widget com base no estado
const widgetVariants = cva(
  "relative transition-all duration-200", 
  {
    variants: {
      state: {
        idle: "border-transparent",
        dragging: "opacity-50",
        dropTarget: "border-2 border-dashed border-primary/80 rounded-lg"
      }
    },
    defaultVariants: {
      state: "idle"
    }
  }
);

// Componente de Item de Widget Ordenável
function SortableWidgetItem({
  widget,
  onRemoveWidget,
  onEditWidget,
  isEditing,
  widgetState = "idle"
}: {
  widget: DashboardWidgetConfig;
  onRemoveWidget: (id: string) => void;
  onEditWidget: (widget: DashboardWidgetConfig) => void;
  isEditing: boolean;
  widgetState?: "idle" | "dragging" | "dropTarget";
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderWidget = (widget: DashboardWidgetConfig) => {
    switch (widget.type) {
      case "nodeSummary":
        return (
          <NodeSummaryCard
            title={widget.title}
            nodeLabel={widget.config.nodeLabel || ""}
            limit={widget.config.limit}
          />
        );
      
      case "propertyDistribution":
        return (
          <PropertyDistribution
            title={widget.title}
            nodeLabel={widget.config.nodeLabel || ""}
            defaultProperty={widget.config.property}
            chartType={widget.config.chartType}
            height={widget.config.height}
          />
        );
      
      case "relationshipChart":
        return (
          <RelationshipChart
            title={widget.title}
            height={widget.config.height}
          />
        );
      
      case "miniGraph":
        return (
          <MiniGraph
            title={widget.title}
            filterOptions={widget.config.filterOptions}
            maxNodes={widget.config.maxNodes}
            height={widget.config.height}
          />
        );
      
      default:
        return (
          <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
            Tipo de widget desconhecido: {widget.type}
          </div>
        );
    }
  };

  const actualState = isDragging ? "dragging" : widgetState;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`${getColSpan(widget.size)} ${widgetVariants({ state: actualState })}`}
      data-widget-id={widget.id}
    >
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 cursor-grab shadow-sm bg-background"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shadow-sm bg-background"
            onClick={() => onEditWidget(widget)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 shadow-sm bg-background"
            onClick={() => onRemoveWidget(widget.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {renderWidget(widget)}
    </div>
  );
}

// Componente de espaço reservado para destinos de soltar
function DropPlaceholder({ size }: { size: string }) {
  return (
    <div className={`${getColSpan(size)} h-12 border-2 border-dashed border-primary/40 rounded-lg bg-primary/5`}>
    </div>
  );
}

export function DashboardGrid({ 
  widgets, 
  onRemoveWidget, 
  isEditing,
  onReorderWidgets,
  onUpdateWidget
}: DashboardGridProps) {
  const [activeWidget, setActiveWidget] = useState<DashboardWidgetConfig | null>(null);
  const [widgetStates, setWidgetStates] = useState<Record<string, "idle" | "dragging" | "dropTarget">>({});
  const [editingWidget, setEditingWidget] = useState<DashboardWidgetConfig | null>(null);

  // Configurar sensores para arrastar e soltar
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Lidar com início de arrasto
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedWidget = widgets.find(widget => widget.id === active.id);
    
    if (draggedWidget) {
      setActiveWidget(draggedWidget);
      
      // Atualizar estados dos widgets
      const newStates: Record<string, "idle" | "dragging" | "dropTarget"> = {};
      widgets.forEach(w => {
        newStates[w.id] = w.id === active.id ? "dragging" : "idle";
      });
      setWidgetStates(newStates);
    }
  };
  
  // Lidar com arrastar sobre
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Destacar alvo potencial de soltar
      const newStates: Record<string, "idle" | "dragging" | "dropTarget"> = {};
      widgets.forEach(w => {
        if (w.id === active.id) {
          newStates[w.id] = "dragging";
        } else if (w.id === over.id) {
          newStates[w.id] = "dropTarget";
        } else {
          newStates[w.id] = "idle";
        }
      });
      setWidgetStates(newStates);
    }
  };

  // Lidar com fim de arrasto
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWidget(null);
    
    // Redefinir todos os estados de widgets
    const newStates: Record<string, "idle" | "dragging" | "dropTarget"> = {};
    widgets.forEach(w => {
      newStates[w.id] = "idle";
    });
    setWidgetStates(newStates);
    
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex(widget => widget.id === active.id);
      const newIndex = widgets.findIndex(widget => widget.id === over.id);
      
      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      
      // Chamar o callback para atualizar o componente pai
      if (onReorderWidgets) {
        onReorderWidgets(newWidgets);
      }
    }
  };

  // Abrir modal de edição de widget
  const handleEditWidget = (widget: DashboardWidgetConfig) => {
    setEditingWidget(widget);
  };

  // Salvar widget editado
  const handleSaveWidget = (updatedWidget: DashboardWidgetConfig) => {
    if (onUpdateWidget) {
      onUpdateWidget(updatedWidget);
    }
    setEditingWidget(null);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
      >
        <div className={`grid grid-cols-12 gap-4 ${isEditing ? "min-h-[300px]" : ""}`}>
          {widgets.length > 0 ? (
            <SortableContext
              items={widgets.map(widget => widget.id)}
              strategy={verticalListSortingStrategy}
              disabled={!isEditing}
            >
              {widgets.map((widget) => (
                <SortableWidgetItem
                  key={widget.id}
                  widget={widget}
                  onRemoveWidget={onRemoveWidget}
                  onEditWidget={handleEditWidget}
                  isEditing={isEditing}
                  widgetState={widgetStates[widget.id] || "idle"}
                />
              ))}
            </SortableContext>
          ) : (
            <div className="col-span-12 p-16 text-center border border-dashed border-muted-foreground/20 rounded-lg">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum widget ainda</h3>
              <p className="text-sm text-muted-foreground">
                Clique em "Adicionar Widget" para começar a construir seu dashboard
              </p>
            </div>
          )}

          {/* Zonas vazias de soltar que aparecem quando está no modo de edição sem widgets */}
          {isEditing && widgets.length === 0 && (
            <>
              <DropPlaceholder size="small" />
              <DropPlaceholder size="medium" />
              <DropPlaceholder size="large" />
            </>
          )}
        </div>

        {/* Sobreposição de arrasto que segue o cursor */}
        <DragOverlay adjustScale={true} dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeWidget && (
            <div className={`${getColSpan(activeWidget.size)} opacity-80 shadow-xl rounded-lg pointer-events-none`}>
              <SortableWidgetItem
                widget={activeWidget}
                onRemoveWidget={onRemoveWidget}
                onEditWidget={handleEditWidget}
                isEditing={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal de edição de widget */}
      <WidgetEditModal
        widget={editingWidget}
        open={!!editingWidget}
        onClose={() => setEditingWidget(null)}
        onSave={handleSaveWidget}
      />
    </>
  );
} 