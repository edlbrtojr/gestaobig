"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, AlertCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

// Define node types configuration - copied from add-form.tsx
// Node types with their allowed relationships
interface NodeTypeConfig {
  allowedRelationships: string[];
}

interface NodeTypesConfig {
  [key: string]: NodeTypeConfig;
}

// This is a simplified version of the config in add-form.tsx
const NODE_TYPES_CONFIG: NodeTypesConfig = {
  Risco: {
    allowedRelationships: [
      "AFETA",
      "MITIGADO_POR",
      "RELACIONADO_A",
      "IDENTIFICADO_POR",
    ],
  },
  PlanoDeAcao: {
    allowedRelationships: [
      "MITIGA",
      "IMPLEMENTA",
      "RESPONSABILIDADE_DE",
      "POSSUI",
    ],
  },
  Acao: {
    allowedRelationships: ["PARTE_DE", "EXECUTADO_POR", "IMPACTA"],
  },
  Estrategia: {
    allowedRelationships: ["ENDEREÇA", "APOIA", "DEPENDE_DE", "ALINHADO_COM"],
  },
  Visao: {
    allowedRelationships: ["ORIENTA", "SUPORTA"],
  },
  Missao: {
    allowedRelationships: ["FUNDAMENTA", "DIRECIONA"],
  },
  Oportunidade: {
    allowedRelationships: ["EXPLORADA_POR", "RELACIONADA_A", "CONTRIBUI_PARA"],
  },
  Departamento: {
    allowedRelationships: ["RESPONSÁVEL_POR", "REPORTA_PARA", "GERENCIA"],
  },
  Projeto: {
    allowedRelationships: [
      "CONTRIBUI_PARA",
      "DEPENDE_DE",
      "GERENCIADO_POR",
      "INCLUI",
    ],
  },
  Objetivo: {
    allowedRelationships: ["SUPORTADO_POR", "ALINHADO_COM", "MENSURADO_POR"],
  },
  KPI: {
    allowedRelationships: ["MEDE", "RELACIONADO_A"],
  },
  Stakeholder: {
    allowedRelationships: ["INTERESSADO_EM", "INFLUENCIA", "RESPONDE_POR"],
  },
  Tecnologia: {
    allowedRelationships: ["SUPORTA", "INTEGRADA_COM", "PARTE_DE"],
  },
  Produto: {
    allowedRelationships: ["DEPENDENTE_DE", "ENTREGUE_POR", "INCLUI"],
  },
  Mercado: {
    allowedRelationships: ["INCLUI", "RELACIONADO_A"],
  },
  Competidor: {
    allowedRelationships: ["COMPETE_COM", "ATUA_EM", "AMEAÇA"],
  },
};

// Get all possible relationship types
const ALL_RELATIONSHIP_TYPES = [
  ...new Set(
    Object.values(NODE_TYPES_CONFIG).flatMap(
      (config) => config.allowedRelationships
    )
  ),
].sort();

// Get valid relationship types between source and target node types
const getValidRelationshipTypes = (
  sourceType: string,
  targetType: string
): string[] => {
  if (!sourceType) return ALL_RELATIONSHIP_TYPES;

  // Get allowed relationships from source node type
  const allowedRelationships =
    NODE_TYPES_CONFIG[sourceType]?.allowedRelationships || [];

  // If no specific node type constraints, return all possible types
  if (allowedRelationships.length === 0) return ALL_RELATIONSHIP_TYPES;
  
  return allowedRelationships;
};

interface RelationshipEditFormProps {
  relationship: any;
  onSave: (updatedRelationship: any) => void;
  onCancel: () => void;
  onFormChanged?: (changed: boolean) => void;
  onDelete?: (relationship: any) => void;
}

// Helper function to format values for editing
const formatValueForEditing = (value: any): string => {
  // Handle Neo4j integer objects
  if (value && typeof value === "object" && "low" in value && "high" in value) {
    return value.low.toString();
  }

  // Handle other objects by converting to JSON
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  // Return string representation for other types
  return String(value || "");
};

// Helper function to parse values when saving
const parseValueForSaving = (
  key: string,
  value: string,
  originalValue: any
): any => {
  // If original value was a Neo4j integer object, convert back to number
  if (
    originalValue &&
    typeof originalValue === "object" &&
    "low" in originalValue &&
    "high" in originalValue
  ) {
    return parseInt(value, 10);
  }

  // Try to parse JSON if the value starts with { or [
  if (
    (value.startsWith("{") || value.startsWith("[")) &&
    (value.endsWith("}") || value.endsWith("]"))
  ) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // If parsing fails, return as is
      return value;
    }
  }

  // Otherwise return as string
  return value;
};

export default function RelationshipEditForm({
  relationship,
  onSave,
  onCancel,
  onFormChanged,
  onDelete,
}: RelationshipEditFormProps) {
  const [editedType, setEditedType] = useState<string>(relationship.type || "");
  const originalType = useRef(relationship.type || "");
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Fetch relationship details including source and target node types on mount
  useEffect(() => {
    // Skip the API call entirely and just use all relationship types
    console.log("Setting all available relationship types");
    setRelationshipTypes(ALL_RELATIONSHIP_TYPES);
  }, []);

  // Update form changed status when type changes
  useEffect(() => {
    const hasChanged = editedType !== originalType.current;
    setFormChanged(hasChanged);

    // Notify parent component of form change status
    if (onFormChanged) {
      onFormChanged(hasChanged);
    }
  }, [editedType, onFormChanged]);

  const handleTypeChange = (value: string) => {
    setEditedType(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/relationship/${relationship.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: editedType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update relationship");
      }

      const updatedRelationship = await response.json();
      setShowSaveDialog(true);
    } catch (error) {
      console.error("Error updating relationship:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update relationship"
      );
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/relationship/${relationship.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete relationship");
      }

      if (onDelete) {
        onDelete(relationship);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting relationship:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete relationship"
      );
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (formChanged) {
      setShowCancelDialog(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    onCancel();
  };

  const confirmSave = () => {
    setShowSaveDialog(false);
    onSave({
      ...relationship,
      type: editedType,
    });
  };

  // Convert relationship types to ComboboxOption format
  const relationshipTypeOptions: ComboboxOption[] = relationshipTypes.map(
    (type) => ({
      value: type,
      label: type,
    })
  );

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2"
      >
        {/* Display source and target nodes */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="text-xs uppercase text-muted-foreground mb-1">De</div>
            <div className="font-medium truncate">
              {typeof relationship.source === "object" 
                ? relationship.source.properties?.name || `Node ID: ${relationship.source.id}` 
                : `Node ID: ${relationship.source}`}
            </div>
          </div>
          <div className="p-3 bg-muted rounded-md">
            <div className="text-xs uppercase text-muted-foreground mb-1">Para</div>
            <div className="font-medium truncate">
              {typeof relationship.target === "object" 
                ? relationship.target.properties?.name || `Node ID: ${relationship.target.id}` 
                : `Node ID: ${relationship.target}`}
            </div>
          </div>
        </div>

        {/* Edit relationship type with dropdown */}
        <div className="space-y-2">
          <Label htmlFor="relationshipType" className="text-sm font-medium">
            Tipo de Relacionamento
          </Label>
          {relationshipTypes.length > 0 ? (
            <Combobox
              options={relationshipTypeOptions}
              value={editedType}
              onChange={handleTypeChange}
              placeholder="Selecione o tipo de relação"
              searchPlaceholder="Buscar tipo..."
              emptyMessage="Nenhum tipo de relação disponível."
            />
          ) : (
            // Fallback to input if types are not loaded yet
            <Input
              id="relationshipType"
              value={editedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full"
              disabled={isSubmitting}
              placeholder="Nome do relacionamento"
              required
            />
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-500 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center gap-2 pt-4 border-t border-border sticky bottom-0 bg-card pb-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting || isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja descartá-las?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continuar Editando
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Descartar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Success Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterações Salvas</DialogTitle>
            <DialogDescription>
              Suas alterações foram salvas com sucesso.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={confirmSave}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este relacionamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitConfirmation}
        onOpenChange={setShowExitConfirmation}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExitConfirmation(false)}
            >
              Continuar Editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitConfirmation(false);
                onCancel();
              }}
            >
              Sair Sem Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 