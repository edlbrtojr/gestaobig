"use client";

import { useState } from "react";
import { D3Link } from "@/types/graph";
import { Pencil, X } from "lucide-react";
import RelationshipEditForm from "@/components/relationship-edit-form";
import { useGraphContext } from "./GraphContext";

interface RelationshipDetailsProps {
  relationship: D3Link;
  onClose: () => void;
  onRelationshipUpdate: (updatedRelationship: D3Link) => void;
  onRelationshipDelete: (deletedRelationship: D3Link) => void;
}

/**
 * Componente para exibição de detalhes de relacionamentos selecionados
 */
export function RelationshipDetails({
  relationship,
  onClose,
  onRelationshipUpdate,
  onRelationshipDelete
}: RelationshipDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

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

  // Extrair nomes de origem e destino
  const getNodeName = (node: any): string => {
    if (!node) return "Desconhecido";
    if (typeof node === "number") return `Node ID: ${node}`;
    return node.properties?.name || `Node ID: ${node.id}`;
  };

  const sourceName = getNodeName(relationship.source);
  const targetName = getNodeName(relationship.target);

  return (
    <div className="absolute bottom-0 right-0 mb-8 mr-8 w-80 p-4 bg-card border rounded-lg shadow-lg z-30">
      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Relacionamento</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                title="Editar Relacionamento"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-md transition-colors"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-muted rounded-md">
            <div className="text-xs uppercase text-muted-foreground mb-1">
              Tipo
            </div>
            <div className="font-medium">{relationship.type}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-muted rounded-md">
              <div className="text-xs uppercase text-muted-foreground mb-1">
                De
              </div>
              <div className="font-medium truncate" title={sourceName}>
                {sourceName}
              </div>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-xs uppercase text-muted-foreground mb-1">
                Para
              </div>
              <div className="font-medium truncate" title={targetName}>
                {targetName}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Propriedades</h4>

            {Object.keys(relationship.properties || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(relationship.properties || {}).map(
                  ([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}:
                      </div>
                      <div className="col-span-2 font-mono break-all">
                        {formatValue(value)}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Nenhuma propriedade
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Editar Relacionamento</h3>
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
            </div>
          </div>
          <RelationshipEditForm
            relationship={relationship}
            onSave={(updatedRelationship) => {
              onRelationshipUpdate(updatedRelationship);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
            onFormChanged={setFormChanged}
            onDelete={(deletedRelationship) => {
              onRelationshipDelete(deletedRelationship);
              setIsEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
} 