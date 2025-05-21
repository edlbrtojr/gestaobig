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
import { getNodeProperties, getPropertyOptions } from "@/lib/schema";

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

interface NodeEditFormProps {
  node: any;
  onSave: (updatedNode: any) => void;
  onCancel: () => void;
  onFormChanged?: (changed: boolean) => void;
  onDelete?: (node: any) => void;
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

export default function NodeEditForm({
  node,
  onSave,
  onCancel,
  onFormChanged,
  onDelete,
}: NodeEditFormProps) {
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>(
    () => {
      // Create a copy of properties with formatted values
      const formatted: Record<string, any> = {};
      for (const [key, value] of Object.entries(node.properties)) {
        formatted[key] = value;
      }
      return formatted;
    }
  );

  const originalProperties = useRef(node.properties);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodeProperties, setNodeProperties] = useState<any[]>([]);

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Load node type properties
  useEffect(() => {
    if (node && node.label) {
      const fetchProperties = async () => {
        try {
          const properties = await getNodeProperties(node.label);
          setNodeProperties(properties);
        } catch (error) {
          console.error("Error loading node properties:", error);
          setNodeProperties([]);
        }
      };
      
      fetchProperties();
    }
  }, [node]);

  // Prop to handle the onOpenChange of the Dialog in the parent component
  const handleExternalClose = () => {
    if (formChanged) {
      setShowExitConfirmation(true);
      return false; // Prevent dialog from closing
    }
    return true; // Allow dialog to close
  };

  // Expose the handleExternalClose function to parent components through a ref
  useEffect(() => {
    // Add an event handler to detect clicks outside the form
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (formChanged) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    // Add event listener for page navigation
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Remove event listener when component unmounts
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [formChanged]);

  // Check if form has been modified
  useEffect(() => {
    const hasChanged = Object.keys(editedProperties).some((key) => {
      const original = originalProperties.current[key];
      const current = editedProperties[key];

      if (typeof original === "object" && "low" in original) {
        return original.low.toString() !== formatValueForEditing(current);
      }
      return formatValueForEditing(original) !== formatValueForEditing(current);
    });

    setFormChanged(hasChanged);

    // Notify parent component of form change status
    if (onFormChanged) {
      onFormChanged(hasChanged);
    }
  }, [editedProperties, onFormChanged]);

  const handlePropertyChange = (key: string, value: string) => {
    setEditedProperties((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse the edited values back to their appropriate formats
      const processedProperties: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(editedProperties)) {
        const originalValue = originalProperties.current[key];
        
        // Find property definition if available
        let propType;
        if (Array.isArray(nodeProperties)) {
          const propDef = nodeProperties.find(p => p.name === key);
          propType = propDef?.type;
        }
        
        const parsedValue = parseValueForSaving(
          key,
          formatValueForEditing(value),
          originalValue,
          propType
        );
        
        processedProperties[key] = parsedValue;
      }

      const response = await fetch(`/api/node/${node.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: processedProperties,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update node");
      }

      const updatedNode = await response.json();
      setShowSaveDialog(true);
      // We'll complete the save after the dialog is closed
    } catch (error) {
      console.error("Error updating node:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update node"
      );
      setIsSubmitting(false);
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
      ...node,
      properties: editedProperties,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/node/${node.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete node");
      }

      if (onDelete) {
        onDelete(node);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting node:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete node"
      );
      setIsDeleting(false);
    }
  };

  // Determine the appropriate input type for each property
  const getInputType = (propertyName: string, value: any) => {
    // Check if nodeProperties is an array and not a Promise
    if (Array.isArray(nodeProperties)) {
      // Find property definition if available
      const propDef = nodeProperties.find(p => p.name === propertyName);
      
      if (propDef) {
        if (propDef.type === 'date') return 'date';
        if (propDef.type === 'enum') return 'select';
        if (propDef.type === 'boolean') return 'checkbox';
        if (propDef.type === 'string' && (propertyName === 'description' || formatValueForEditing(value).length > 50)) {
          return 'textarea';
        }
        return 'text';
      }
    }
    
    // Fallback to existing logic for properties not in schema
    const formatted = formatValueForEditing(value);
    return (
      formatted.length > 50 ||
      formatted.includes("\n") ||
      (formatted.startsWith("{") && formatted.endsWith("}")) ||
      (formatted.startsWith("[") && formatted.endsWith("]"))
    ) ? 'textarea' : 'text';
  };

  // Get options for enum properties
  const getOptions = (propertyName: string) => {
    // Check if we have already fetched property definitions
    if (Array.isArray(nodeProperties)) {
      const property = nodeProperties.find(p => p.name === propertyName);
      if (property && property.type === 'enum' && property.options) {
        return property.options;
      }
    }
    
    // Fallback for when property definitions not available yet
    return [];
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 w-80"
      >
        <div className="space-y-4 pl-2">
          {Object.entries(editedProperties).map(([key, value]) => {
            const formattedValue = formatValueForEditing(value);
            const inputType = getInputType(key, value);
            const options = inputType === 'select' ? getOptions(key) : [];
            
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium capitalize">
                  {key.replace(/_/g, " ")}
                </Label>

                {inputType === 'textarea' ? (
                  <Textarea
                    id={key}
                    value={formattedValue}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    className="w-full font-mono text-sm"
                    rows={4}
                    disabled={isSubmitting}
                  />
                ) : inputType === 'select' && options.length > 0 ? (
                  <select
                    id={key}
                    value={formattedValue}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : inputType === 'date' ? (
                  <Input
                    id={key}
                    type="date"
                    value={formattedValue}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                ) : inputType === 'checkbox' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      id={key}
                      type="checkbox"
                      checked={value === true || value === 'true'}
                      onChange={(e) => handlePropertyChange(key, e.target.checked.toString())}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      disabled={isSubmitting}
                    />
                    <label htmlFor={key} className="text-sm text-gray-700 dark:text-gray-300">
                      {value === true || value === 'true' ? 'Yes' : 'No'}
                    </label>
                  </div>
                ) : (
                  <Input
                    id={key}
                    value={formattedValue}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-500 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between items-center gap-2 pt-4 border-t border-border sticky bottom-0 bg-card pb-2">
          {onDelete && (
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
          )}
          
          <div className={`flex gap-2 ${onDelete ? '' : 'ml-auto'}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continue Editing
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Success Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changes Saved</DialogTitle>
            <DialogDescription>
              Your changes have been saved successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={confirmSave}>Close</Button>
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
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to exit?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExitConfirmation(false)}
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitConfirmation(false);
                onCancel();
              }}
            >
              Exit Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this node? This action cannot be undone.
              {node.label === 'Person' && <p className="mt-2 text-red-500">Warning: Deleting a person will also delete all their relationships.</p>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
