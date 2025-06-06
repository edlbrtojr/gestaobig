"use client";

import { useState } from "react";
import { D3Node } from "@/types/graph";
import { Pencil, X } from "lucide-react";
import NodeEditForm from "@/components/node-edit-form";
import { Button } from "@/components/ui/button";
import { useGraphContext } from "./GraphContext";

interface NodeDetailsProps {
  node: D3Node;
  onClose: () => void;
  onNodeUpdate: (updatedNode: D3Node) => void;
  onNodeDelete: (deletedNode: D3Node) => void;
}

/**
 * Componente para exibição de detalhes de nós selecionados
 */
export function NodeDetails({
  node,
  onClose,
  onNodeUpdate,
  onNodeDelete
}: NodeDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  const { colors } = useGraphContext();
  const nodeColor = colors.nodeColors[node.label] || colors.defaultColor;

  // Função para formatar valores de propriedades para exibição
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }

    // Lidar com objetos inteiros do Neo4j
    if (
      typeof value === "object" &&
      value !== null &&
      "low" in value &&
      "high" in value
    ) {
      return value.low.toString();
    }

    // Lidar com outros objetos convertendo para JSON
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }

    // Retornar representação de string para outros tipos
    return String(value);
  };

  return (
    <div className="absolute bottom-5 right-5 p-4 bg-card text-card-foreground shadow-xl rounded-lg max-w-md w-full sm:w-auto border border-border transition-all duration-300 ease-in-out transform-gpu motion-safe:animate-fadeInUp z-30">
      {!isEditing ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-lg font-semibold truncate pr-2"
              title={
                node.properties?.name || `Node ${node.id}`
              }
            >
              {node.properties?.name || `Node ${node.id}`}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                title="Editar Nó"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <span
                className="inline-block w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: nodeColor
                }}
              ></span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tipo: {node.label || "Unknown"}
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-sm mb-3 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-card-background">
            {node.properties &&
              Object.entries(node.properties)
                .filter(([key]) => key !== "name")
                .map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="font-medium mr-2 text-muted-foreground capitalize whitespace-nowrap">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="truncate" title={String(value)}>
                      {formatValue(value)}
                    </span>
                  </div>
                ))}
          </div>
          <button
            className="mt-4 w-full px-4 py-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-card"
            onClick={onClose}
          >
            Fechar
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Editar Nó</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (formChanged) {
                    setShowExitConfirmation(true);
                  } else {
                    setIsEditing(false);
                  }
                }}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
              <span
                className="inline-block w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: nodeColor
                }}
              ></span>
            </div>
          </div>
          <NodeEditForm
            node={node}
            onSave={(updatedNode) => {
              onNodeUpdate(updatedNode);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
            onFormChanged={setFormChanged}
            onDelete={(deletedNode) => {
              onNodeDelete(deletedNode);
              setIsEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
} 