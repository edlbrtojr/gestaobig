"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  return String(value);
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

export default function NodeEditForm({
  node,
  onSave,
  onCancel,
  onFormChanged,
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
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

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
        const parsedValue = parseValueForSaving(
          key,
          formatValueForEditing(value),
          originalValue
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

  // Determine if a field should use textarea (for objects or long strings)
  const shouldUseTextarea = (value: any) => {
    const formatted = formatValueForEditing(value);
    return (
      formatted.length > 50 ||
      formatted.includes("\n") ||
      (formatted.startsWith("{") && formatted.endsWith("}")) ||
      (formatted.startsWith("[") && formatted.endsWith("]"))
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 w-70"
      >
        <div className="space-y-4 pl-2">
          {Object.entries(editedProperties).map(([key, value]) => {
            const formattedValue = formatValueForEditing(value);
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium capitalize">
                  {key.replace(/_/g, " ")}
                </Label>

                {shouldUseTextarea(value) ? (
                  <Textarea
                    id={key}
                    value={formattedValue}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    className="w-full font-mono text-sm"
                    rows={4}
                    disabled={isSubmitting}
                  />
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

        <div className="flex justify-end gap-2 pt-4 border-t border-border sticky bottom-0 bg-card pb-2">
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
    </>
  );
}
