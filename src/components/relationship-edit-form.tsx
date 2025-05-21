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
import { getAllRelationshipTypes, getRelationshipProperties, getValidRelationshipTypes } from "@/lib/schema";

// Create a simple Textarea component since one doesn't exist in the codebase
const Textarea = ({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<"textarea">) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
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
  originalValue: any,
  propertyType?: string
): any => {
  // If a specific type is provided, use it
  if (propertyType) {
    if (propertyType === 'number') {
      return Number(value);
    }
    if (propertyType === 'boolean') {
      return value === 'true';
    }
    // For enum and string, leave as string
    return value;
  }

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
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>(
    () => {
      // Create a copy of properties with formatted values
      const formatted: Record<string, any> = {};
      for (const [key, value] of Object.entries(relationship.properties || {})) {
        formatted[key] = value;
      }
      return formatted;
    }
  );
  const originalType = useRef(relationship.type || "");
  const originalProperties = useRef(relationship.properties || {});
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  const [relationshipProperties, setRelationshipProperties] = useState<any[]>([]);
  
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
    const loadData = async () => {
      await loadRelationshipTypes();
      await loadRelationshipProperties();
    };
    
    loadData();
  }, [relationship.type]);

  // Load allowed relationship types based on source and target node types
  const loadRelationshipTypes = async () => {
    try {
      const sourceType = typeof relationship.source === 'object' ? relationship.source.label : '';
      const targetType = typeof relationship.target === 'object' ? relationship.target.label : '';
      
      if (sourceType && targetType) {
        const validTypes = await getValidRelationshipTypes(sourceType, targetType);
        if (validTypes && validTypes.length > 0) {
          setRelationshipTypes(validTypes);
          return;
        }
      }
      
      // Fallback to all relationship types if specific validation fails
      const allTypes = await getAllRelationshipTypes();
      setRelationshipTypes(allTypes || []);
    } catch (error) {
      console.error("Error loading relationship types:", error);
      setRelationshipTypes([]);
    }
  };
  
  // Load property definitions for the relationship type
  const loadRelationshipProperties = async () => {
    try {
      if (relationship.type) {
        const properties = await getRelationshipProperties(relationship.type);
        setRelationshipProperties(properties || []);
      }
    } catch (error) {
      console.error("Error loading relationship properties:", error);
      setRelationshipProperties([]);
    }
  };

  // Update form changed status when type or properties change
  useEffect(() => {
    const typeChanged = editedType !== originalType.current;
    
    const propertiesChanged = Object.keys(editedProperties).some((key) => {
      const original = originalProperties.current[key];
      const current = editedProperties[key];

      if (typeof original === "object" && "low" in original) {
        return original.low.toString() !== formatValueForEditing(current);
      }
      return formatValueForEditing(original) !== formatValueForEditing(current);
    });
    
    const hasChanged = typeChanged || propertiesChanged;
    setFormChanged(hasChanged);

    // Notify parent component of form change status
    if (onFormChanged) {
      onFormChanged(hasChanged);
    }
  }, [editedType, editedProperties, onFormChanged]);

  const handleTypeChange = async (value: string) => {
    setEditedType(value);
    
    // Reload property definitions when type changes
    if (value !== relationship.type) {
      try {
        const properties = await getRelationshipProperties(value);
        setRelationshipProperties(properties || []);
        
        // Reset/update properties based on new relationship type
        const newProperties: Record<string, any> = {};
        
        // Initialize properties from schema definitions
        if (properties && properties.length > 0) {
          properties.forEach(prop => {
            if (prop.defaultValue) {
              newProperties[prop.name] = prop.defaultValue;
            } else {
              newProperties[prop.name] = '';
            }
          });
        }
        
        // Keep any existing properties that match the new type's schema
        Object.entries(editedProperties).forEach(([key, value]) => {
          if (properties.some(p => p.name === key)) {
            newProperties[key] = value;
          }
        });
        
        setEditedProperties(newProperties);
      } catch (error) {
        console.error("Error loading relationship properties for type:", value, error);
      }
    }
  };
  
  const handlePropertyChange = (key: string, value: string) => {
    setEditedProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse edited properties to their appropriate formats
      const processedProperties: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(editedProperties)) {
        const originalValue = originalProperties.current[key];
        
        // Find property definition if available
        const propDef = relationshipProperties.find(p => p.name === key);
        const propType = propDef?.type;
        
        const parsedValue = parseValueForSaving(
          key,
          formatValueForEditing(value),
          originalValue,
          propType
        );
        
        processedProperties[key] = parsedValue;
      }

      const response = await fetch(`/api/relationship/${relationship.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: editedType,
          properties: processedProperties
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
      properties: editedProperties
    });
  };

  // Convert relationship types to ComboboxOption format
  const relationshipTypeOptions: ComboboxOption[] = Array.isArray(relationshipTypes) 
    ? relationshipTypes.map((type) => ({
        value: type,
        label: type,
      }))
    : [];
  
  // Get input type for property
  const getInputType = (propertyName: string, value: any) => {
    // Find property definition if available
    if (!Array.isArray(relationshipProperties)) {
      return 'text'; // Default to text if properties not loaded
    }
    
    const propDef = relationshipProperties.find(p => p.name === propertyName);
    
    if (propDef) {
      if (propDef.type === 'date') return 'date';
      if (propDef.type === 'enum') return 'select';
      if (propDef.type === 'boolean') return 'checkbox';
      if (propDef.type === 'string' && (propertyName === 'description' || formatValueForEditing(value).length > 50)) {
        return 'textarea';
      }
      return 'text';
    }
    
    // Fallback to text for unknown properties
    return 'text';
  };
  
  // Get options for enum properties
  const getOptions = (propertyName: string) => {
    if (!Array.isArray(relationshipProperties)) {
      return [];
    }
    const propDef = relationshipProperties.find(p => p.name === propertyName);
    return propDef?.options || [];
  };

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
        
        {/* Relationship properties */}
        {Array.isArray(relationshipProperties) && relationshipProperties.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-medium">Propriedades</h3>
            
            <div className="space-y-4">
              {relationshipProperties.map((prop) => {
                const value = editedProperties[prop.name] || '';
                const formattedValue = formatValueForEditing(value);
                const inputType = getInputType(prop.name, value);
                const options = inputType === 'select' ? getOptions(prop.name) : [];
                
                return (
                  <div key={prop.name} className="space-y-2">
                    <Label htmlFor={prop.name} className="text-sm font-medium capitalize">
                      {prop.name.replace(/_/g, " ")}
                      {prop.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {inputType === 'textarea' ? (
                      <Textarea
                        id={prop.name}
                        value={formattedValue}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        className="w-full"
                        rows={3}
                        disabled={isSubmitting}
                        required={prop.required}
                      />
                    ) : inputType === 'select' && options.length > 0 ? (
                      <select
                        id={prop.name}
                        value={formattedValue}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isSubmitting}
                        required={prop.required}
                      >
                        <option value="">Selecione...</option>
                        {options.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : inputType === 'date' ? (
                      <Input
                        id={prop.name}
                        type="date"
                        value={formattedValue}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        className="w-full"
                        disabled={isSubmitting}
                        required={prop.required}
                      />
                    ) : inputType === 'checkbox' ? (
                      <div className="flex items-center space-x-2">
                        <input
                          id={prop.name}
                          type="checkbox"
                          checked={value === true || value === 'true'}
                          onChange={(e) => handlePropertyChange(prop.name, e.target.checked.toString())}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={isSubmitting}
                          required={prop.required}
                        />
                        <label htmlFor={prop.name} className="text-sm text-gray-700 dark:text-gray-300">
                          {value === true || value === 'true' ? 'Yes' : 'No'}
                        </label>
                      </div>
                    ) : (
                      <Input
                        id={prop.name}
                        value={formattedValue}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        className="w-full"
                        disabled={isSubmitting}
                        required={prop.required}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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