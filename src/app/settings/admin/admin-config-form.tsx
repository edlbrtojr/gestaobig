"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { PlusCircle, Trash, Edit, Save, X, Plus, ArrowRight, Filter } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GraphSchema, getGraphSchema, saveGraphSchema } from "@/lib/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define types for node and relationship configurations
interface NodeProperty {
  name: string;
  type: string;  // string, number, boolean, date, enum
  required: boolean;
  defaultValue?: string;
  options?: string[];  // For enum type
  description?: string;
}

interface NodeTypeDefinition {
  label: string;
  description: string;
  properties: NodeProperty[];
  color?: string;
  icon?: string;
}

interface RelationshipTypeDefinition {
  type: string;
  description: string;
  sourceNodeTypes: string[];
  targetNodeTypes: string[];
  properties?: NodeProperty[];
  bidirectional?: boolean;
}

export default function AdminConfigForm() {
  // State for the current graph schema configuration
  const [schema, setSchema] = useState<GraphSchema>({ nodeTypes: {}, relationshipTypes: {} });
  
  // State for the currently selected node/relationship for editing
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string | null>(null);
  
  // Search filters state
  const [nodeSearchTerm, setNodeSearchTerm] = useState("");
  const [relationshipSearchTerm, setRelationshipSearchTerm] = useState("");
  
  // Node type filters
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>("all");
  const [relationshipNodeFilter, setRelationshipNodeFilter] = useState<string>("all");
  
  // State for adding new node types and properties
  const [isAddingNodeType, setIsAddingNodeType] = useState(false);
  const [newNodeType, setNewNodeType] = useState<NodeTypeDefinition>({
    label: "",
    description: "",
    properties: [],
    color: "#" + Math.floor(Math.random()*16777215).toString(16)
  });
  
  // State for adding new relationship types
  const [isAddingRelationshipType, setIsAddingRelationshipType] = useState(false);
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipTypeDefinition>({
    type: "",
    description: "",
    sourceNodeTypes: [],
    targetNodeTypes: [],
    properties: [],
    bidirectional: false
  });
  
  // State for adding properties to node/relationship types
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newProperty, setNewProperty] = useState<NodeProperty>({
    name: "",
    type: "string",
    required: false
  });
  
  // State for editing existing properties
  const [isEditingProperty, setIsEditingProperty] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<{
    nodeType?: string;
    relationshipType?: string;
    index: number;
    property: NodeProperty;
  } | null>(null);

  // Dialog states for notifications and confirmations
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'node' | 'relationship' | 'property', id: string, index?: number }>({ type: 'node', id: '' });

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load schema from API or local storage
    const loadSchema = async () => {
      setIsLoading(true);
      try {
        // Use the utility function to get the schema
        const loadedSchema = await getGraphSchema();
        setSchema(loadedSchema);
      } catch (error) {
        console.error("Failed to load schema:", error);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setErrorDialogOpen(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSchema();
  }, []);
  
  // Save schema to API and local storage
  const saveSchema = async () => {
    try {
      // Use the utility function to save schema to both API and localStorage
      await saveGraphSchema(schema);
      
      // Open success dialog instead of using alert
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Failed to save schema:", error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorDialogOpen(true);
    }
  };

  // Node type management handlers
  const handleAddNodeType = () => {
    if (!newNodeType.label.trim()) {
      setValidationMessage("Node type name is required");
      setValidationDialogOpen(true);
      return;
    }
    
    const nodeTypeKey = newNodeType.label.replace(/\s+/g, '');
    
    setSchema(prev => ({
      ...prev,
      nodeTypes: {
        ...prev.nodeTypes,
        [nodeTypeKey]: {
          ...newNodeType,
          properties: [...newNodeType.properties]
        }
      }
    }));
    
    setNewNodeType({
      label: "",
      description: "",
      properties: [],
      color: "#" + Math.floor(Math.random()*16777215).toString(16)
    });
    
    setIsAddingNodeType(false);
  };
  
  const handleDeleteNodeType = (nodeType: string) => {
    setItemToDelete({ type: 'node', id: nodeType });
    setDeleteConfirmDialogOpen(true);
  };
  
  // Confirm delete for nodes, relationships, or properties
  const confirmDelete = () => {
    if (itemToDelete.type === 'node') {
      const nodeType = itemToDelete.id;
      setSchema(prev => {
        const newNodeTypes = { ...prev.nodeTypes };
        delete newNodeTypes[nodeType];
        
        // Also remove this node type from all relationship type configurations
        const newRelationshipTypes = { ...prev.relationshipTypes };
        Object.keys(newRelationshipTypes).forEach(relType => {
          newRelationshipTypes[relType] = {
            ...newRelationshipTypes[relType],
            sourceNodeTypes: newRelationshipTypes[relType].sourceNodeTypes.filter(t => t !== nodeType),
            targetNodeTypes: newRelationshipTypes[relType].targetNodeTypes.filter(t => t !== nodeType)
          };
        });
        
        return {
          ...prev,
          nodeTypes: newNodeTypes,
          relationshipTypes: newRelationshipTypes
        };
      });
    } else if (itemToDelete.type === 'relationship') {
      const relType = itemToDelete.id;
      setSchema(prev => {
        const newRelationshipTypes = { ...prev.relationshipTypes };
        delete newRelationshipTypes[relType];
        
        return {
          ...prev,
          relationshipTypes: newRelationshipTypes
        };
      });
    } else if (itemToDelete.type === 'property' && itemToDelete.index !== undefined) {
      const index = itemToDelete.index;
      if (itemToDelete.id.startsWith('node:')) {
        const nodeType = itemToDelete.id.substring(5);
        setSchema(prev => {
          const updatedProperties = [...prev.nodeTypes[nodeType].properties];
          updatedProperties.splice(index, 1);
          
          return {
            ...prev,
            nodeTypes: {
              ...prev.nodeTypes,
              [nodeType]: {
                ...prev.nodeTypes[nodeType],
                properties: updatedProperties
              }
            }
          };
        });
      } else if (itemToDelete.id.startsWith('relationship:')) {
        const relType = itemToDelete.id.substring(13);
        setSchema(prev => {
          const updatedProperties = [...(prev.relationshipTypes[relType].properties || [])];
          updatedProperties.splice(index, 1);
          
          return {
            ...prev,
            relationshipTypes: {
              ...prev.relationshipTypes,
              [relType]: {
                ...prev.relationshipTypes[relType],
                properties: updatedProperties
              }
            }
          };
        });
      }
    }
    
    setDeleteConfirmDialogOpen(false);
  };
  
  // Relationship type management handlers
  const handleAddRelationshipType = () => {
    if (!newRelationshipType.type.trim()) {
      setValidationMessage("Relationship type name is required");
      setValidationDialogOpen(true);
      return;
    }
    
    setSchema(prev => ({
      ...prev,
      relationshipTypes: {
        ...prev.relationshipTypes,
        [newRelationshipType.type]: {
          ...newRelationshipType,
          sourceNodeTypes: [...newRelationshipType.sourceNodeTypes],
          targetNodeTypes: [...newRelationshipType.targetNodeTypes],
          properties: newRelationshipType.properties || []
        }
      }
    }));
    
    setNewRelationshipType({
      type: "",
      description: "",
      sourceNodeTypes: [],
      targetNodeTypes: [],
      properties: [],
      bidirectional: false
    });
    
    setIsAddingRelationshipType(false);
  };
  
  const handleDeleteRelationshipType = (relType: string) => {
    setItemToDelete({ type: 'relationship', id: relType });
    setDeleteConfirmDialogOpen(true);
  };
  
  // Property management handlers
  const handleAddProperty = (nodeType?: string, relationshipType?: string) => {
    if (!newProperty.name.trim()) {
      setValidationMessage("Property name is required");
      setValidationDialogOpen(true);
      return;
    }
    
    setSchema(prev => {
      if (nodeType) {
        // Adding property to a node type
        const updatedNodeType = {
          ...prev.nodeTypes[nodeType],
          properties: [
            ...prev.nodeTypes[nodeType].properties,
            { ...newProperty }
          ]
        };
        
        return {
          ...prev,
          nodeTypes: {
            ...prev.nodeTypes,
            [nodeType]: updatedNodeType
          }
        };
      } else if (relationshipType) {
        // Adding property to a relationship type
        const updatedRelType = {
          ...prev.relationshipTypes[relationshipType],
          properties: [
            ...(prev.relationshipTypes[relationshipType].properties || []),
            { ...newProperty }
          ]
        };
        
        return {
          ...prev,
          relationshipTypes: {
            ...prev.relationshipTypes,
            [relationshipType]: updatedRelType
          }
        };
      }
      
      return prev;
    });
    
    setNewProperty({
      name: "",
      type: "string",
      required: false
    });
    
    setIsAddingProperty(false);
  };
  
  const handleDeleteProperty = (index: number, nodeType?: string, relationshipType?: string) => {
    if (nodeType) {
      setItemToDelete({ type: 'property', id: `node:${nodeType}`, index });
    } else if (relationshipType) {
      setItemToDelete({ type: 'property', id: `relationship:${relationshipType}`, index });
    }
    setDeleteConfirmDialogOpen(true);
  };
  
  // Tab content for node types management
  const renderNodeTypesTab = () => {
    // Filter node types based on search term and type filter
    const filteredNodeTypes = Object.entries(schema.nodeTypes).filter(([key, nodeType]) => {
      const searchTermLower = nodeSearchTerm.toLowerCase();
      const matchesSearch = (
        nodeType.label.toLowerCase().includes(searchTermLower) ||
        nodeType.description.toLowerCase().includes(searchTermLower) ||
        nodeType.properties.some(prop => 
          prop.name.toLowerCase().includes(searchTermLower)
        )
      );
      
      // Apply node type filter if selected
      const matchesTypeFilter = !nodeTypeFilter || nodeTypeFilter === "all" || key === nodeTypeFilter;
      
      return matchesSearch && matchesTypeFilter;
    });
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Tipos de Nós</h3>
          <Button onClick={() => setIsAddingNodeType(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Tipo de Nó
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por nome, descrição ou propriedade..."
              value={nodeSearchTerm}
              onChange={(e) => setNodeSearchTerm(e.target.value)}
              className="pr-8"
            />
            {nodeSearchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-3" 
                onClick={() => setNodeSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="w-full sm:w-[200px]">
            <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(schema.nodeTypes).map(([key, nodeType]) => (
                  <SelectItem key={key} value={key}>
                    {nodeType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Propriedades</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNodeTypes.length > 0 ? (
              filteredNodeTypes.map(([key, nodeType]) => (
                <TableRow key={key}>
                  <TableCell>{nodeType.label}</TableCell>
                  <TableCell>{nodeType.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {nodeType.properties.map((prop, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {prop.name} ({prop.type}){prop.required ? "*" : ""}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: nodeType.color || "#CCCCCC" }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedNodeType(key)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteNodeType(key)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  {nodeSearchTerm 
                    ? "Nenhum tipo de nó encontrado com esses critérios de busca." 
                    : "Nenhum tipo de nó definido."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Tab content for relationship types management
  const renderRelationshipTypesTab = () => {
    // Filter relationship types based on search term and node filter
    const filteredRelationshipTypes = Object.entries(schema.relationshipTypes).filter(([key, relType]) => {
      const searchTermLower = relationshipSearchTerm.toLowerCase();
      const matchesSearch = (
        relType.type.toLowerCase().includes(searchTermLower) ||
        relType.description.toLowerCase().includes(searchTermLower) ||
        relType.sourceNodeTypes.some(type => 
          type.toLowerCase().includes(searchTermLower) ||
          (schema.nodeTypes[type]?.label || "").toLowerCase().includes(searchTermLower)
        ) ||
        relType.targetNodeTypes.some(type => 
          type.toLowerCase().includes(searchTermLower) ||
          (schema.nodeTypes[type]?.label || "").toLowerCase().includes(searchTermLower)
        )
      );
      
      // Apply node filter if selected - relationship involves this node type
      const matchesNodeFilter = relationshipNodeFilter === "all" || !relationshipNodeFilter || 
        relType.sourceNodeTypes.includes(relationshipNodeFilter) || 
        relType.targetNodeTypes.includes(relationshipNodeFilter);
      
      return matchesSearch && matchesNodeFilter;
    });
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Tipos de Relacionamentos</h3>
          <Button onClick={() => setIsAddingRelationshipType(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Tipo de Relacionamento
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por tipo, descrição ou nós relacionados..."
              value={relationshipSearchTerm}
              onChange={(e) => setRelationshipSearchTerm(e.target.value)}
              className="pr-8"
            />
            {relationshipSearchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-3" 
                onClick={() => setRelationshipSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="w-full sm:w-[200px]">
            <Select value={relationshipNodeFilter} onValueChange={setRelationshipNodeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filtrar por nó" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nós</SelectItem>
                {Object.entries(schema.nodeTypes).map(([key, nodeType]) => (
                  <SelectItem key={key} value={key}>
                    {nodeType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Origem → Destino</TableHead>
              <TableHead>Bidirecional</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRelationshipTypes.length > 0 ? (
              filteredRelationshipTypes.map(([key, relType]) => (
                <TableRow key={key}>
                  <TableCell>{relType.type}</TableCell>
                  <TableCell>{relType.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {relType.sourceNodeTypes.map((sourceType, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs">
                          <span className="font-medium">{sourceType}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">
                            {relType.targetNodeTypes.join(', ') || 'Any'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {relType.bidirectional ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedRelationshipType(key)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteRelationshipType(key)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  {relationshipSearchTerm 
                    ? "Nenhum tipo de relacionamento encontrado com esses critérios de busca." 
                    : "Nenhum tipo de relacionamento definido."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Render loading state if still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }
  
  // Render the main component with tabs
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={saveSchema}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
      
      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nodes">Tipos de Nós</TabsTrigger>
          <TabsTrigger value="relationships">Tipos de Relacionamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="nodes" className="space-y-4">
          {renderNodeTypesTab()}
        </TabsContent>
        
        <TabsContent value="relationships" className="space-y-4">
          {renderRelationshipTypesTab()}
        </TabsContent>
      </Tabs>
      
      {/* Add dialog for success message */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações Salvas</DialogTitle>
            <DialogDescription>
              Configurações salvas com sucesso no banco de dados! As alterações serão refletidas para todos os usuários da aplicação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog for error message */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Falha ao salvar configurações: {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add dialog for validation messages */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aviso</DialogTitle>
            <DialogDescription>
              {validationMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setValidationDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog for delete confirmation */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              {itemToDelete.type === 'node' && (
                <>Tem certeza que deseja excluir o tipo de nó "{itemToDelete.id}"?</>
              )}
              {itemToDelete.type === 'relationship' && (
                <>Tem certeza que deseja excluir o tipo de relacionamento "{itemToDelete.id}"?</>
              )}
              {itemToDelete.type === 'property' && (
                <>Tem certeza que deseja excluir esta propriedade?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding a new node type */}
      <Dialog 
        open={isAddingNodeType} 
        onOpenChange={(open) => !open && setIsAddingNodeType(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Tipo de Nó</DialogTitle>
            <DialogDescription>
              Defina um novo tipo de nó para o grafo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="label">Nome</Label>
              <Input 
                id="label" 
                value={newNodeType.label}
                onChange={(e) => setNewNodeType(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Pessoa, Empresa, Produto"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input 
                id="description" 
                value={newNodeType.description}
                onChange={(e) => setNewNodeType(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que este tipo de nó representa"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="color" 
                  type="color"
                  value={newNodeType.color || "#CCCCCC"}
                  onChange={(e) => setNewNodeType(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 p-1"
                />
                <div className="text-sm text-muted-foreground">
                  Selecione uma cor para identificar este tipo de nó no grafo
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Propriedades</Label>
              {newNodeType.properties.length > 0 ? (
                <div className="space-y-2">
                  {newNodeType.properties.map((prop, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">{prop.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {prop.type}{prop.required ? ' (Obrigatório)' : ''}{prop.defaultValue ? ` (Padrão: ${prop.defaultValue})` : ''}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setNewNodeType(prev => ({
                            ...prev,
                            properties: prev.properties.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  Nenhuma propriedade definida ainda.
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewProperty({
                    name: "",
                    type: "string",
                    required: false
                  });
                  setIsAddingProperty(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Propriedade
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingNodeType(false)}>Cancelar</Button>
            <Button onClick={handleAddNodeType}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a selected node type */}
      <Dialog 
        open={selectedNodeType !== null} 
        onOpenChange={(open) => !open && setSelectedNodeType(null)}
      >
        {selectedNodeType && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tipo de Nó: {schema.nodeTypes[selectedNodeType].label}</DialogTitle>
              <DialogDescription>
                Modifique as propriedades e configurações deste tipo de nó.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-label">Nome</Label>
                <Input 
                  id="edit-label" 
                  value={schema.nodeTypes[selectedNodeType].label}
                  onChange={(e) => {
                    setSchema(prev => ({
                      ...prev,
                      nodeTypes: {
                        ...prev.nodeTypes,
                        [selectedNodeType]: {
                          ...prev.nodeTypes[selectedNodeType],
                          label: e.target.value
                        }
                      }
                    }));
                  }}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input 
                  id="edit-description" 
                  value={schema.nodeTypes[selectedNodeType].description}
                  onChange={(e) => {
                    setSchema(prev => ({
                      ...prev,
                      nodeTypes: {
                        ...prev.nodeTypes,
                        [selectedNodeType]: {
                          ...prev.nodeTypes[selectedNodeType],
                          description: e.target.value
                        }
                      }
                    }));
                  }}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="edit-color" 
                    type="color"
                    value={schema.nodeTypes[selectedNodeType].color || "#CCCCCC"}
                    onChange={(e) => {
                      setSchema(prev => ({
                        ...prev,
                        nodeTypes: {
                          ...prev.nodeTypes,
                          [selectedNodeType]: {
                            ...prev.nodeTypes[selectedNodeType],
                            color: e.target.value
                          }
                        }
                      }));
                    }}
                    className="w-12 h-10 p-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Propriedades</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewProperty({
                        name: "",
                        type: "string",
                        required: false
                      });
                      setIsAddingProperty(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {schema.nodeTypes[selectedNodeType].properties.length > 0 ? (
                  <div className="space-y-2">
                    {schema.nodeTypes[selectedNodeType].properties.map((prop, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                        <div className="flex-1">
                          <div className="font-medium">{prop.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {prop.type}{prop.required ? ' (Obrigatório)' : ''}{prop.defaultValue ? ` (Padrão: ${prop.defaultValue})` : ''}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setPropertyToEdit({
                              nodeType: selectedNodeType,
                              index,
                              property: { ...prop }
                            });
                            setIsEditingProperty(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteProperty(index, selectedNodeType)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    Nenhuma propriedade definida.
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedNodeType(null)}>Cancelar</Button>
              <Button onClick={() => {
                saveSchema();
                setSelectedNodeType(null);
              }}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Dialog for adding a new relationship type */}
      <Dialog 
        open={isAddingRelationshipType} 
        onOpenChange={(open) => !open && setIsAddingRelationshipType(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Tipo de Relacionamento</DialogTitle>
            <DialogDescription>
              Defina um novo tipo de relacionamento entre nós.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rel-type">Tipo</Label>
              <Input 
                id="rel-type" 
                value={newRelationshipType.type}
                onChange={(e) => setNewRelationshipType(prev => ({ ...prev, type: e.target.value.toUpperCase() }))}
                placeholder="Ex: CONTÉM, PERTENCE_A, CONECTADO_COM"
              />
              <p className="text-xs text-muted-foreground">
                Use letras maiúsculas e underscores para separar palavras (ex: CONECTADO_COM)
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="rel-description">Descrição</Label>
              <Input 
                id="rel-description" 
                value={newRelationshipType.description}
                onChange={(e) => setNewRelationshipType(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que este relacionamento representa"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="source-types">Tipos de Nós de Origem</Label>
              <div className="p-2 border rounded-md min-h-[80px] max-h-[150px] overflow-y-auto space-y-1">
                {Object.keys(schema.nodeTypes).map(nodeType => (
                  <div key={nodeType} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`source-${nodeType}`}
                      checked={newRelationshipType.sourceNodeTypes.includes(nodeType)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRelationshipType(prev => ({
                            ...prev,
                            sourceNodeTypes: [...prev.sourceNodeTypes, nodeType]
                          }));
                        } else {
                          setNewRelationshipType(prev => ({
                            ...prev,
                            sourceNodeTypes: prev.sourceNodeTypes.filter(t => t !== nodeType)
                          }));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`source-${nodeType}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {schema.nodeTypes[nodeType].label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="target-types">Tipos de Nós de Destino</Label>
              <div className="p-2 border rounded-md min-h-[80px] max-h-[150px] overflow-y-auto space-y-1">
                {Object.keys(schema.nodeTypes).map(nodeType => (
                  <div key={nodeType} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`target-${nodeType}`}
                      checked={newRelationshipType.targetNodeTypes.includes(nodeType)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRelationshipType(prev => ({
                            ...prev,
                            targetNodeTypes: [...prev.targetNodeTypes, nodeType]
                          }));
                        } else {
                          setNewRelationshipType(prev => ({
                            ...prev,
                            targetNodeTypes: prev.targetNodeTypes.filter(t => t !== nodeType)
                          }));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`target-${nodeType}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {schema.nodeTypes[nodeType].label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="bidirectional"
                checked={newRelationshipType.bidirectional}
                onCheckedChange={(checked) => {
                  setNewRelationshipType(prev => ({
                    ...prev,
                    bidirectional: !!checked
                  }));
                }}
              />
              <Label 
                htmlFor="bidirectional"
                className="text-sm font-normal cursor-pointer"
              >
                Relacionamento bidirecional
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingRelationshipType(false)}>Cancelar</Button>
            <Button onClick={handleAddRelationshipType}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a selected relationship type */}
      <Dialog 
        open={selectedRelationshipType !== null} 
        onOpenChange={(open) => !open && setSelectedRelationshipType(null)}
      >
        {selectedRelationshipType && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tipo de Relacionamento: {schema.relationshipTypes[selectedRelationshipType].type}</DialogTitle>
              <DialogDescription>
                Modifique as configurações deste tipo de relacionamento.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-rel-type">Tipo</Label>
                <Input 
                  id="edit-rel-type" 
                  value={schema.relationshipTypes[selectedRelationshipType].type}
                  onChange={(e) => {
                    setSchema(prev => ({
                      ...prev,
                      relationshipTypes: {
                        ...prev.relationshipTypes,
                        [selectedRelationshipType]: {
                          ...prev.relationshipTypes[selectedRelationshipType],
                          type: e.target.value.toUpperCase()
                        }
                      }
                    }));
                  }}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-rel-description">Descrição</Label>
                <Input 
                  id="edit-rel-description" 
                  value={schema.relationshipTypes[selectedRelationshipType].description}
                  onChange={(e) => {
                    setSchema(prev => ({
                      ...prev,
                      relationshipTypes: {
                        ...prev.relationshipTypes,
                        [selectedRelationshipType]: {
                          ...prev.relationshipTypes[selectedRelationshipType],
                          description: e.target.value
                        }
                      }
                    }));
                  }}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-source-types">Tipos de Nós de Origem</Label>
                <div className="p-2 border rounded-md min-h-[80px] max-h-[150px] overflow-y-auto space-y-1">
                  {Object.keys(schema.nodeTypes).map(nodeType => (
                    <div key={nodeType} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-source-${nodeType}`}
                        checked={schema.relationshipTypes[selectedRelationshipType].sourceNodeTypes.includes(nodeType)}
                        onCheckedChange={(checked) => {
                          setSchema(prev => {
                            const updatedSourceTypes = checked
                              ? [...prev.relationshipTypes[selectedRelationshipType].sourceNodeTypes, nodeType]
                              : prev.relationshipTypes[selectedRelationshipType].sourceNodeTypes.filter(t => t !== nodeType);
                            
                            return {
                              ...prev,
                              relationshipTypes: {
                                ...prev.relationshipTypes,
                                [selectedRelationshipType]: {
                                  ...prev.relationshipTypes[selectedRelationshipType],
                                  sourceNodeTypes: updatedSourceTypes
                                }
                              }
                            };
                          });
                        }}
                      />
                      <Label 
                        htmlFor={`edit-source-${nodeType}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {schema.nodeTypes[nodeType].label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-target-types">Tipos de Nós de Destino</Label>
                <div className="p-2 border rounded-md min-h-[80px] max-h-[150px] overflow-y-auto space-y-1">
                  {Object.keys(schema.nodeTypes).map(nodeType => (
                    <div key={nodeType} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-target-${nodeType}`}
                        checked={schema.relationshipTypes[selectedRelationshipType].targetNodeTypes.includes(nodeType)}
                        onCheckedChange={(checked) => {
                          setSchema(prev => {
                            const updatedTargetTypes = checked
                              ? [...prev.relationshipTypes[selectedRelationshipType].targetNodeTypes, nodeType]
                              : prev.relationshipTypes[selectedRelationshipType].targetNodeTypes.filter(t => t !== nodeType);
                            
                            return {
                              ...prev,
                              relationshipTypes: {
                                ...prev.relationshipTypes,
                                [selectedRelationshipType]: {
                                  ...prev.relationshipTypes[selectedRelationshipType],
                                  targetNodeTypes: updatedTargetTypes
                                }
                              }
                            };
                          });
                        }}
                      />
                      <Label 
                        htmlFor={`edit-target-${nodeType}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {schema.nodeTypes[nodeType].label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-bidirectional"
                  checked={schema.relationshipTypes[selectedRelationshipType].bidirectional}
                  onCheckedChange={(checked) => {
                    setSchema(prev => ({
                      ...prev,
                      relationshipTypes: {
                        ...prev.relationshipTypes,
                        [selectedRelationshipType]: {
                          ...prev.relationshipTypes[selectedRelationshipType],
                          bidirectional: !!checked
                        }
                      }
                    }));
                  }}
                />
                <Label 
                  htmlFor="edit-bidirectional"
                  className="text-sm font-normal cursor-pointer"
                >
                  Relacionamento bidirecional
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRelationshipType(null)}>Cancelar</Button>
              <Button onClick={() => {
                saveSchema();
                setSelectedRelationshipType(null);
              }}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Dialog for adding a property */}
      <Dialog
        open={isAddingProperty}
        onOpenChange={(open) => !open && setIsAddingProperty(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Propriedade</DialogTitle>
            <DialogDescription>
              Defina uma nova propriedade para o tipo de nó ou relacionamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="prop-name">Nome</Label>
              <Input 
                id="prop-name" 
                value={newProperty.name}
                onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: nome, idade, status"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="prop-type">Tipo</Label>
              <select
                id="prop-type"
                value={newProperty.type}
                onChange={(e) => setNewProperty(prev => ({ ...prev, type: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="string">Texto (string)</option>
                <option value="number">Número (number)</option>
                <option value="boolean">Booleano (boolean)</option>
                <option value="date">Data (date)</option>
                <option value="enum">Enumeração (enum)</option>
              </select>
            </div>
            
            {newProperty.type === 'enum' && (
              <div className="grid gap-2">
                <Label htmlFor="prop-options">Opções (separadas por vírgula)</Label>
                <Input 
                  id="prop-options" 
                  value={newProperty.options?.join(', ') || ''}
                  onChange={(e) => {
                    const options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean);
                    setNewProperty(prev => ({ ...prev, options }));
                  }}
                  placeholder="Ex: Ativo, Inativo, Pendente"
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="prop-default">Valor Padrão</Label>
              <Input 
                id="prop-default" 
                value={newProperty.defaultValue || ''}
                onChange={(e) => setNewProperty(prev => ({ ...prev, defaultValue: e.target.value }))}
                placeholder="Valor padrão (opcional)"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prop-required"
                checked={newProperty.required}
                onCheckedChange={(checked) => {
                  setNewProperty(prev => ({
                    ...prev,
                    required: !!checked
                  }));
                }}
              />
              <Label 
                htmlFor="prop-required"
                className="text-sm font-normal cursor-pointer"
              >
                Propriedade obrigatória
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingProperty(false)}>Cancelar</Button>
            <Button onClick={() => handleAddProperty(selectedNodeType || undefined, selectedRelationshipType || undefined)}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for editing a property */}
      <Dialog
        open={isEditingProperty}
        onOpenChange={(open) => !open && setIsEditingProperty(false)}
      >
        {propertyToEdit && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Propriedade: {propertyToEdit.property.name}</DialogTitle>
              <DialogDescription>
                Modifique a configuração desta propriedade.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-prop-name">Nome</Label>
                <Input 
                  id="edit-prop-name" 
                  value={propertyToEdit.property.name}
                  onChange={(e) => setPropertyToEdit(prev => prev ? {
                    ...prev,
                    property: {
                      ...prev.property,
                      name: e.target.value
                    }
                  } : prev)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-prop-type">Tipo</Label>
                <select
                  id="edit-prop-type"
                  value={propertyToEdit.property.type}
                  onChange={(e) => setPropertyToEdit(prev => prev ? {
                    ...prev,
                    property: {
                      ...prev.property,
                      type: e.target.value,
                      // Clear options if switching from enum to another type
                      options: e.target.value === 'enum' ? prev.property.options : undefined
                    }
                  } : prev)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="string">Texto (string)</option>
                  <option value="number">Número (number)</option>
                  <option value="boolean">Booleano (boolean)</option>
                  <option value="date">Data (date)</option>
                  <option value="enum">Enumeração (enum)</option>
                </select>
              </div>
              
              {propertyToEdit.property.type === 'enum' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-prop-options">Opções (separadas por vírgula)</Label>
                  <Input 
                    id="edit-prop-options" 
                    value={propertyToEdit.property.options?.join(', ') || ''}
                    onChange={(e) => {
                      const options = e.target.value.split(',').map(opt => opt.trim()).filter(Boolean);
                      setPropertyToEdit(prev => prev ? {
                        ...prev,
                        property: {
                          ...prev.property,
                          options
                        }
                      } : prev);
                    }}
                    placeholder="Ex: Ativo, Inativo, Pendente"
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="edit-prop-default">Valor Padrão</Label>
                <Input 
                  id="edit-prop-default" 
                  value={propertyToEdit.property.defaultValue || ''}
                  onChange={(e) => setPropertyToEdit(prev => prev ? {
                    ...prev,
                    property: {
                      ...prev.property,
                      defaultValue: e.target.value
                    }
                  } : prev)}
                  placeholder="Valor padrão (opcional)"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-prop-required"
                  checked={propertyToEdit.property.required}
                  onCheckedChange={(checked) => {
                    setPropertyToEdit(prev => prev ? {
                      ...prev,
                      property: {
                        ...prev.property,
                        required: !!checked
                      }
                    } : prev);
                  }}
                />
                <Label 
                  htmlFor="edit-prop-required"
                  className="text-sm font-normal cursor-pointer"
                >
                  Propriedade obrigatória
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingProperty(false)}>Cancelar</Button>
              <Button onClick={() => {
                // Apply the edits to the schema
                setSchema(prev => {
                  if (propertyToEdit?.nodeType) {
                    // Update node property
                    const updatedProperties = [...prev.nodeTypes[propertyToEdit.nodeType].properties];
                    updatedProperties[propertyToEdit.index] = propertyToEdit.property;
                    
                    return {
                      ...prev,
                      nodeTypes: {
                        ...prev.nodeTypes,
                        [propertyToEdit.nodeType]: {
                          ...prev.nodeTypes[propertyToEdit.nodeType],
                          properties: updatedProperties
                        }
                      }
                    };
                  } else if (propertyToEdit?.relationshipType) {
                    // Update relationship property
                    const updatedProperties = [...(prev.relationshipTypes[propertyToEdit.relationshipType].properties || [])];
                    updatedProperties[propertyToEdit.index] = propertyToEdit.property;
                    
                    return {
                      ...prev,
                      relationshipTypes: {
                        ...prev.relationshipTypes,
                        [propertyToEdit.relationshipType]: {
                          ...prev.relationshipTypes[propertyToEdit.relationshipType],
                          properties: updatedProperties
                        }
                      }
                    };
                  }
                  
                  return prev;
                });
                
                // Save changes to persist them
                saveSchema();
                
                // Close the dialog
                setIsEditingProperty(false);
                setPropertyToEdit(null);
              }}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 