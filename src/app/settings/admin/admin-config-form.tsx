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
import { PlusCircle, Trash, Edit, Save, X, Plus, ArrowRight, Filter, ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
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
  isPrimaryLabel?: boolean; // Indica se a propriedade será usada como label principal no grafo
}

interface NodeTypeDefinition {
  label: string;
  description: string;
  properties: NodeProperty[];
  color?: string;
  icon?: string;
  active?: boolean;
}

interface RelationshipTypeDefinition {
  type: string;
  description: string;
  sourceNodeTypes: string[];
  targetNodeTypes: string[];
  properties?: NodeProperty[];
  bidirectional?: boolean;
  active?: boolean;
}

// Lista de nós essenciais que devem ser protegidos
const SYSTEM_ESSENTIAL_NODES = [
  '_SchemaConfig',
  '_NodeLabelSchema',
  '_RelationshipTypeSchema',
  '_SchemaProperty',
  '_inAppSchemaConfig', // Para compatibilidade com versões anteriores
];

// Lista de prefixos de nós do sistema que devem ser protegidos
const SYSTEM_NODE_PREFIXES = ['_'];

// Lista de relacionamentos essenciais do sistema
const SYSTEM_ESSENTIAL_RELATIONSHIPS = [
  'DEFINES_NODE_LABEL',
  'DEFINES_RELATIONSHIP_TYPE',
  'HAS_PROPERTY',
  'FROM_NODE_TYPE',
  'TO_NODE_TYPE',
];

// Lista de prefixos de relacionamentos do sistema
const SYSTEM_RELATIONSHIP_PREFIXES = ['_'];

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
  
  // Estado para notificação de salvamento
  const [isSaving, setIsSaving] = useState(false);

  // State for disabled items filters
  const [disabledNodeSearchTerm, setDisabledNodeSearchTerm] = useState("");
  const [disabledRelationshipSearchTerm, setDisabledRelationshipSearchTerm] = useState("");
  
  // Estado para os toggles de mostrar itens desativados
  const [showDisabledNodes, setShowDisabledNodes] = useState(false);
  const [showDisabledRelationships, setShowDisabledRelationships] = useState(false);

  // Estados para o diálogo de confirmação de ativação/inativação
  const [toggleConfirmDialogOpen, setToggleConfirmDialogOpen] = useState(false);
  const [itemToToggle, setItemToToggle] = useState<{ 
    type: 'node' | 'relationship', 
    id: string, 
    currentState: boolean 
  }>({ type: 'node', id: '', currentState: true });
  
  // Estados para ordenação das tabelas
  type SortField = 'status' | 'name' | 'description' | 'properties' | 'color' | 'source' | 'bidirectional';
  type SortDirection = 'asc' | 'desc' | null;
  
  const [nodeSortField, setNodeSortField] = useState<SortField>('name');
  const [nodeSortDirection, setNodeSortDirection] = useState<SortDirection>('asc');
  
  const [relationshipSortField, setRelationshipSortField] = useState<SortField>('name');
  const [relationshipSortDirection, setRelationshipSortDirection] = useState<SortDirection>('asc');
  
  // Estado para rastrear alterações não salvas
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSchema, setOriginalSchema] = useState<GraphSchema>({ nodeTypes: {}, relationshipTypes: {} });

  // Função para alternar a direção de ordenação ou definir um novo campo
  const toggleSort = (table: 'node' | 'relationship', field: SortField) => {
    if (table === 'node') {
      if (nodeSortField === field) {
        // Se já estiver ordenando por este campo, alterne a direção
        setNodeSortDirection(prev => 
          prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
        );
      } else {
        // Se for um novo campo, defina-o como campo de ordenação e direção ascendente
        setNodeSortField(field);
        setNodeSortDirection('asc');
      }
    } else {
      if (relationshipSortField === field) {
        // Se já estiver ordenando por este campo, alterne a direção
        setRelationshipSortDirection(prev => 
          prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
        );
      } else {
        // Se for um novo campo, defina-o como campo de ordenação e direção ascendente
        setRelationshipSortField(field);
        setRelationshipSortDirection('asc');
      }
    }
  };
  
  // Função auxiliar para obter o ícone de ordenação
  const getSortIcon = (table: 'node' | 'relationship', field: SortField) => {
    const currentField = table === 'node' ? nodeSortField : relationshipSortField;
    const direction = table === 'node' ? nodeSortDirection : relationshipSortDirection;
    
    if (currentField !== field || direction === null) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    
    return direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  useEffect(() => {
    // Load schema from API or local storage
    const loadSchema = async () => {
      setIsLoading(true);
      try {
        // Use the utility function to get the schema
        const loadedSchema = await getGraphSchema();
        setSchema(loadedSchema);
        // Salvar uma cópia do schema original para comparação
        setOriginalSchema(JSON.parse(JSON.stringify(loadedSchema)));
        setHasUnsavedChanges(false);
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
  
  // Efeito para detectar alterações no schema
  useEffect(() => {
    // Não verificar alterações durante o carregamento inicial
    if (isLoading) return;
    
    // Verificar se há alterações comparando o schema atual com o original
    const currentSchemaJson = JSON.stringify(schema);
    const originalSchemaJson = JSON.stringify(originalSchema);
    
    setHasUnsavedChanges(currentSchemaJson !== originalSchemaJson);
  }, [schema, originalSchema, isLoading]);
  
  // Efeito para confirmar saída da página caso haja alterações não salvas
  useEffect(() => {
    // Função para confirmar saída
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Mensagem padrão definida pelo navegador
        const message = 'Há alterações não salvas. Tem certeza que deseja sair?';
        e.returnValue = message;
        return message;
      }
    };
    
    // Adicionar o evento ao window
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Limpar o evento quando o componente for desmontado
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  // Save schema to API and local storage
  const saveSchema = async () => {
    try {
      // Exibir notificação de salvamento
      setIsSaving(true);
      
      // Use the utility function to save schema to both API and localStorage
      await saveGraphSchema(schema);
      
      // Atualizar o schema original após salvar com sucesso
      setOriginalSchema(JSON.parse(JSON.stringify(schema)));
      setHasUnsavedChanges(false);
      
      // Open success dialog instead of using alert
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Failed to save schema:", error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setErrorDialogOpen(true);
    } finally {
      // Esconder notificação de salvamento
      setIsSaving(false);
    }
  };

  // Node type management handlers
  const handleAddNodeType = () => {
    if (!newNodeType.label.trim()) {
      setValidationMessage("Nome do tipo de nó é obrigatório");
      setValidationDialogOpen(true);
      return;
    }
    
    const nodeTypeKey = newNodeType.label.replace(/\s+/g, '');
    
    // Verificar se o nome do nó começa com prefixo do sistema
    if (SYSTEM_NODE_PREFIXES.some(prefix => nodeTypeKey.startsWith(prefix))) {
      setValidationMessage("Não é permitido criar tipos de nós com prefixos reservados para o sistema (ex: '_')");
      setValidationDialogOpen(true);
      return;
    }
    
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
    // Verificar se é um nó essencial do sistema
    if (SYSTEM_ESSENTIAL_NODES.includes(nodeType) || 
        SYSTEM_NODE_PREFIXES.some(prefix => nodeType.startsWith(prefix))) {
      setValidationMessage("Não é permitido excluir nós essenciais do sistema");
      setValidationDialogOpen(true);
      return;
    }
    
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
      setValidationMessage("Nome do tipo de relacionamento é obrigatório");
      setValidationDialogOpen(true);
      return;
    }
    
    // Verificar se o nome do relacionamento é reservado para o sistema
    if (SYSTEM_ESSENTIAL_RELATIONSHIPS.includes(newRelationshipType.type) ||
        SYSTEM_RELATIONSHIP_PREFIXES.some(prefix => newRelationshipType.type.startsWith(prefix))) {
      setValidationMessage("Não é permitido criar tipos de relacionamentos com nomes ou prefixos reservados para o sistema");
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
    // Verificar se é um relacionamento essencial do sistema
    if (SYSTEM_ESSENTIAL_RELATIONSHIPS.includes(relType) ||
        SYSTEM_RELATIONSHIP_PREFIXES.some(prefix => relType.startsWith(prefix))) {
      setValidationMessage("Não é permitido excluir relacionamentos essenciais do sistema");
      setValidationDialogOpen(true);
      return;
    }
    
    setItemToDelete({ type: 'relationship', id: relType });
    setDeleteConfirmDialogOpen(true);
  };
  
  // Property management handlers
  const handleAddProperty = (nodeType?: string, relationshipType?: string) => {
    if (!newProperty.name.trim()) {
      setValidationMessage("Nome da propriedade é obrigatório");
      setValidationDialogOpen(true);
      return;
    }
    
    // Verificar se o nome da propriedade começa com prefixo do sistema
    if (SYSTEM_NODE_PREFIXES.some(prefix => newProperty.name.startsWith(prefix))) {
      setValidationMessage("Não é permitido criar propriedades com prefixos reservados para o sistema (ex: '_')");
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
    // Verificar se está tentando excluir propriedade de um nó ou relacionamento do sistema
    if ((nodeType && SYSTEM_ESSENTIAL_NODES.includes(nodeType)) || 
        (relationshipType && SYSTEM_ESSENTIAL_RELATIONSHIPS.includes(relationshipType))) {
      setValidationMessage("Não é permitido excluir propriedades de itens essenciais do sistema");
      setValidationDialogOpen(true);
      return;
    }
    
    // Verificar se a propriedade começa com prefixo do sistema
    const propertyName = nodeType 
      ? schema.nodeTypes[nodeType].properties[index].name
      : relationshipType
        ? (schema.relationshipTypes[relationshipType].properties || [])[index].name
        : "";
        
    if (SYSTEM_NODE_PREFIXES.some(prefix => propertyName.startsWith(prefix))) {
      setValidationMessage("Não é permitido excluir propriedades do sistema");
      setValidationDialogOpen(true);
      return;
    }
    
    if (nodeType) {
      setItemToDelete({ type: 'property', id: `node:${nodeType}`, index });
    } else if (relationshipType) {
      setItemToDelete({ type: 'property', id: `relationship:${relationshipType}`, index });
    }
    setDeleteConfirmDialogOpen(true);
  };
  
  // Função para confirmar a ativação/inativação
  const confirmToggleActive = () => {
    if (itemToToggle.type === 'node') {
      toggleNodeTypeActiveImpl(itemToToggle.id);
    } else if (itemToToggle.type === 'relationship') {
      toggleRelationshipTypeActiveImpl(itemToToggle.id);
    }
    
    setToggleConfirmDialogOpen(false);
  };
  
  // Função para iniciar o processo de ativação/inativação de nós
  const toggleNodeTypeActive = (nodeType: string) => {
    const currentState = schema.nodeTypes[nodeType].active !== false;
    setItemToToggle({ 
      type: 'node', 
      id: nodeType, 
      currentState: currentState 
    });
    setToggleConfirmDialogOpen(true);
  };
  
  // Implementação da ativação/inativação de nós
  const toggleNodeTypeActiveImpl = (nodeType: string) => {
    setSchema(prev => ({
      ...prev,
      nodeTypes: {
        ...prev.nodeTypes,
        [nodeType]: {
          ...prev.nodeTypes[nodeType],
          active: prev.nodeTypes[nodeType].active === false ? true : false
        }
      }
    }));
  };
  
  // Função para iniciar o processo de ativação/inativação de relacionamentos
  const toggleRelationshipTypeActive = (relType: string) => {
    const currentState = schema.relationshipTypes[relType].active !== false;
    setItemToToggle({ 
      type: 'relationship', 
      id: relType, 
      currentState: currentState 
    });
    setToggleConfirmDialogOpen(true);
  };
  
  // Implementação da ativação/inativação de relacionamentos
  const toggleRelationshipTypeActiveImpl = (relType: string) => {
    setSchema(prev => ({
      ...prev,
      relationshipTypes: {
        ...prev.relationshipTypes,
        [relType]: {
          ...prev.relationshipTypes[relType],
          active: prev.relationshipTypes[relType].active === false ? true : false
        }
      }
    }));
  };
  
  // Tab content for node types management
  const renderNodeTypesTab = () => {
    // Filtrar nós com base nos critérios atualizados
    const filteredNodeTypes = Object.entries(schema.nodeTypes).filter(([key, nodeType]) => {
      // Não mostrar nós essenciais do sistema
      if (SYSTEM_ESSENTIAL_NODES.includes(key) || 
          SYSTEM_NODE_PREFIXES.some(prefix => key.startsWith(prefix))) {
        return false;
      }
      
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
      
      // Mostrar nós ativos ou desativados com base no toggle
      const matchesActiveState = showDisabledNodes ? true : nodeType.active !== false;
      
      return matchesSearch && matchesTypeFilter && matchesActiveState;
    });
    
    // Ordenar os nós filtrados com base no campo e direção de ordenação
    const sortedNodeTypes = [...filteredNodeTypes].sort((a, b) => {
      const [keyA, nodeA] = a;
      const [keyB, nodeB] = b;
      
      // Se não houver ordenação, manter a ordem original
      if (nodeSortDirection === null) return 0;
      
      // Fator de multiplicação baseado na direção de ordenação
      const sortFactor = nodeSortDirection === 'asc' ? 1 : -1;
      
      // Ordenação com base no campo selecionado
      switch (nodeSortField) {
        case 'status':
          // Converter booleanos para números para comparação
          const statusA = nodeA.active !== false ? 1 : 0;
          const statusB = nodeB.active !== false ? 1 : 0;
          return (statusA - statusB) * sortFactor;
        
        case 'name':
          return nodeA.label.localeCompare(nodeB.label) * sortFactor;
        
        case 'description':
          return nodeA.description.localeCompare(nodeB.description) * sortFactor;
        
        case 'properties':
          return (nodeA.properties.length - nodeB.properties.length) * sortFactor;
        
        case 'color':
          return (nodeA.color || '').localeCompare(nodeB.color || '') * sortFactor;
        
        default:
          return 0;
      }
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
          
          <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-md">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-disabled-nodes"
                checked={showDisabledNodes}
                onCheckedChange={setShowDisabledNodes}
              />
              <Label htmlFor="show-disabled-nodes" className="text-sm cursor-pointer">
                Mostrar desativados
              </Label>
            </div>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer w-[120px]"
                onClick={() => toggleSort('node', 'status')}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('node', 'status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('node', 'name')}
              >
                <div className="flex items-center gap-1">
                  Nome {getSortIcon('node', 'name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('node', 'description')}
              >
                <div className="flex items-center gap-1">
                  Descrição {getSortIcon('node', 'description')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('node', 'properties')}
              >
                <div className="flex items-center gap-1">
                  Propriedades {getSortIcon('node', 'properties')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer w-[100px]"
                onClick={() => toggleSort('node', 'color')}
              >
                <div className="flex items-center gap-1">
                  Cor {getSortIcon('node', 'color')}
                </div>
              </TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNodeTypes.length > 0 ? (
              sortedNodeTypes.map(([key, nodeType]) => (
                <TableRow key={key} className={nodeType.active === false ? "opacity-70 bg-muted/30" : ""}>
                  <TableCell>
                    {nodeType.active === false ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                        Desativado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                        Ativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{nodeType.label}</TableCell>
                  <TableCell>{nodeType.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {nodeType.properties.map((prop, index) => (
                        <Badge key={index} variant="outline" className={`text-xs ${prop.isPrimaryLabel ? "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700" : ""}`}>
                          {prop.name} ({prop.type}){prop.required ? "*" : ""}
                          {prop.isPrimaryLabel && <span className="ml-1 text-blue-600 dark:text-blue-400">📌</span>}
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
                        onClick={() => toggleNodeTypeActive(key)}
                        title={nodeType.active === false ? "Ativar" : "Desativar"}
                      >
                        {nodeType.active === false ? (
                          <PlusCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-yellow-600" />
                        )}
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
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
    // Filtrar relacionamentos com base nos critérios atualizados
    const filteredRelationshipTypes = Object.entries(schema.relationshipTypes).filter(([key, relType]) => {
      // Não mostrar relacionamentos essenciais do sistema
      if (SYSTEM_ESSENTIAL_RELATIONSHIPS.includes(key) ||
          SYSTEM_RELATIONSHIP_PREFIXES.some(prefix => key.startsWith(prefix))) {
        return false;
      }
      
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
      
      // Mostrar relacionamentos ativos ou desativados com base no toggle
      const matchesActiveState = showDisabledRelationships ? true : relType.active !== false;
      
      return matchesSearch && matchesNodeFilter && matchesActiveState;
    });
    
    // Ordenar os relacionamentos filtrados com base no campo e direção de ordenação
    const sortedRelationshipTypes = [...filteredRelationshipTypes].sort((a, b) => {
      const [keyA, relA] = a;
      const [keyB, relB] = b;
      
      // Se não houver ordenação, manter a ordem original
      if (relationshipSortDirection === null) return 0;
      
      // Fator de multiplicação baseado na direção de ordenação
      const sortFactor = relationshipSortDirection === 'asc' ? 1 : -1;
      
      // Ordenação com base no campo selecionado
      switch (relationshipSortField) {
        case 'status':
          // Converter booleanos para números para comparação
          const statusA = relA.active !== false ? 1 : 0;
          const statusB = relB.active !== false ? 1 : 0;
          return (statusA - statusB) * sortFactor;
        
        case 'name':
          return relA.type.localeCompare(relB.type) * sortFactor;
        
        case 'description':
          return relA.description.localeCompare(relB.description) * sortFactor;
        
        case 'source':
          // Ordenar pelo primeiro tipo de nó de origem, se houver
          const sourceA = relA.sourceNodeTypes[0] || '';
          const sourceB = relB.sourceNodeTypes[0] || '';
          return sourceA.localeCompare(sourceB) * sortFactor;
        
        case 'bidirectional':
          // Converter booleanos para números para comparação
          const bidirA = relA.bidirectional ? 1 : 0;
          const bidirB = relB.bidirectional ? 1 : 0;
          return (bidirA - bidirB) * sortFactor;
        
        default:
          return 0;
      }
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
          
          <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded-md">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-disabled-relationships"
                checked={showDisabledRelationships}
                onCheckedChange={setShowDisabledRelationships}
              />
              <Label htmlFor="show-disabled-relationships" className="text-sm cursor-pointer">
                Mostrar desativados
              </Label>
            </div>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer w-[120px]"
                onClick={() => toggleSort('relationship', 'status')}
              >
                <div className="flex items-center gap-1">
                  Status {getSortIcon('relationship', 'status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('relationship', 'name')}
              >
                <div className="flex items-center gap-1">
                  Tipo {getSortIcon('relationship', 'name')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('relationship', 'description')}
              >
                <div className="flex items-center gap-1">
                  Descrição {getSortIcon('relationship', 'description')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('relationship', 'source')}
              >
                <div className="flex items-center gap-1">
                  Origem → Destino {getSortIcon('relationship', 'source')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('relationship', 'bidirectional')}
              >
                <div className="flex items-center gap-1">
                  Bidirecional {getSortIcon('relationship', 'bidirectional')}
                </div>
              </TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRelationshipTypes.length > 0 ? (
              sortedRelationshipTypes.map(([key, relType]) => (
                <TableRow key={key} className={relType.active === false ? "opacity-70 bg-muted/30" : ""}>
                  <TableCell>
                    {relType.active === false ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                        Desativado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
                        Ativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{relType.type}</TableCell>
                  <TableCell>{relType.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {relType.sourceNodeTypes.map((sourceType, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-xs">
                          <span className="font-medium">{schema.nodeTypes[sourceType]?.label || sourceType}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">
                            {relType.targetNodeTypes.map(targetType => schema.nodeTypes[targetType]?.label || targetType).join(', ') || 'Any'}
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
                        onClick={() => toggleRelationshipTypeActive(key)}
                        title={relType.active === false ? "Ativar" : "Desativar"}
                      >
                        {relType.active === false ? (
                          <PlusCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-yellow-600" />
                        )}
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
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
      {/* Notificação de salvamento */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <div className="text-xl font-semibold">Salvando alterações...</div>
              <p className="text-center text-muted-foreground">
                Por favor, não feche ou recarregue a página até que o salvamento seja concluído.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mb-4">
        <div className="flex items-center">
          {hasUnsavedChanges && (
            <div className="flex items-center mr-4 text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-md">
              <div className="relative mr-2">
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full absolute top-0 left-0 animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium">Alterações não salvas</span>
            </div>
          )}
        </div>
        <Button 
          onClick={saveSchema}
          disabled={!hasUnsavedChanges}
          className={hasUnsavedChanges ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <Save className="h-4 w-4 mr-2" />
          {hasUnsavedChanges ? "Salvar Alterações" : "Sem Alterações"}
        </Button>
      </div>
      
      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
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
      
      {/* Add dialog for active/inactive confirmation */}
      <Dialog open={toggleConfirmDialogOpen} onOpenChange={setToggleConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemToToggle.currentState 
                ? "Confirmar Desativação" 
                : "Confirmar Ativação"}
            </DialogTitle>
            <DialogDescription>
              {itemToToggle.type === 'node' && itemToToggle.currentState && (
                <>
                  Tem certeza que deseja <strong>desativar</strong> o tipo de nó "{itemToToggle.id}"?
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Nós desativados não aparecerão nas opções de criação e filtros por padrão.
                  </span>
                </>
              )}
              {itemToToggle.type === 'node' && !itemToToggle.currentState && (
                <>
                  Tem certeza que deseja <strong>ativar</strong> o tipo de nó "{itemToToggle.id}"?
                </>
              )}
              {itemToToggle.type === 'relationship' && itemToToggle.currentState && (
                <>
                  Tem certeza que deseja <strong>desativar</strong> o tipo de relacionamento "{itemToToggle.id}"?
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Relacionamentos desativados não aparecerão nas opções de criação e filtros por padrão.
                  </span>
                </>
              )}
              {itemToToggle.type === 'relationship' && !itemToToggle.currentState && (
                <>
                  Tem certeza que deseja <strong>ativar</strong> o tipo de relacionamento "{itemToToggle.id}"?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant={itemToToggle.currentState ? "destructive" : "default"}
              onClick={confirmToggleActive}
            >
              {itemToToggle.currentState ? "Desativar" : "Ativar"}
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
              <Label htmlFor="prop-name" className="flex items-center">
                Nome <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                id="prop-name" 
                value={newProperty.name}
                onChange={(e) => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: nome, idade, status"
                className={!newProperty.name.trim() ? "border-red-300 focus-visible:ring-red-400" : ""}
              />
              {!newProperty.name.trim() && (
                <p className="text-xs text-red-500 mt-1">Nome da propriedade é obrigatório</p>
              )}
              {newProperty.name.trim() && SYSTEM_NODE_PREFIXES.some(prefix => newProperty.name.startsWith(prefix)) && (
                <p className="text-xs text-amber-500 mt-1">Nomes que começam com "{SYSTEM_NODE_PREFIXES.join(', ')}" são reservados para o sistema</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="prop-type">Tipo</Label>
              <Select
                value={newProperty.type}
                onValueChange={(value) => setNewProperty(prev => ({ 
                  ...prev, 
                  type: value,
                  // Resetar options se não for enum
                  options: value === 'enum' ? (prev.options || ['']) : undefined,
                  // Adequar defaultValue para o tipo selecionado
                  defaultValue: value === 'boolean' ? 'false' : 
                              value === 'number' ? '0' : 
                              value === 'date' ? new Date().toISOString().split('T')[0] : 
                              prev.defaultValue
                }))}
              >
                <SelectTrigger id="prop-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">
                    <div className="flex items-center">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">ABC</span>
                      <span>Texto (string)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="number">
                    <div className="flex items-center">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">123</span>
                      <span>Número (number)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="boolean">
                    <div className="flex items-center">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">T/F</span>
                      <span>Booleano (boolean)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="date">
                    <div className="flex items-center">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">📅</span>
                      <span>Data (date)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="enum">
                    <div className="flex items-center">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">[ ]</span>
                      <span>Enumeração (enum)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {newProperty.type === 'string' && "Texto livre, pode conter qualquer caractere"}
                {newProperty.type === 'number' && "Valores numéricos inteiros ou decimais"}
                {newProperty.type === 'boolean' && "Valores verdadeiro/falso (true/false)"}
                {newProperty.type === 'date' && "Datas no formato YYYY-MM-DD"}
                {newProperty.type === 'enum' && "Lista de valores pré-definidos"}
              </p>
            </div>
            
            {newProperty.type === 'enum' && (
              <div className="grid gap-2">
                <Label htmlFor="prop-options" className="flex items-center">
                  Opções <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="space-y-3">
                  {(newProperty.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                <Input 
                        value={option}
                  onChange={(e) => {
                          const newOptions = [...(newProperty.options || [])];
                          newOptions[index] = e.target.value;
                          setNewProperty(prev => ({ ...prev, options: newOptions }));
                        }}
                        placeholder={`Opção ${index + 1}`}
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          const newOptions = [...(newProperty.options || [])];
                          newOptions.splice(index, 1);
                          setNewProperty(prev => ({ ...prev, options: newOptions.length ? newOptions : [''] }));
                  }}
                        disabled={(newProperty.options || []).length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(newProperty.options || []), ''];
                      setNewProperty(prev => ({ ...prev, options: newOptions }));
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="prop-default">
                Valor Padrão
                <span className="ml-2 text-xs text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              {newProperty.type === 'boolean' ? (
                <Select
                  value={newProperty.defaultValue || 'false'}
                  onValueChange={(value) => setNewProperty(prev => ({ ...prev, defaultValue: value }))}
                >
                  <SelectTrigger id="prop-default-boolean">
                    <SelectValue placeholder="Selecione o valor padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Verdadeiro (true)</SelectItem>
                    <SelectItem value="false">Falso (false)</SelectItem>
                  </SelectContent>
                </Select>
              ) : newProperty.type === 'enum' ? (
                <Select
                  value={newProperty.defaultValue || ''}
                  onValueChange={(value) => setNewProperty(prev => ({ ...prev, defaultValue: value }))}
                  disabled={!(newProperty.options || []).some(opt => opt.trim())}
                >
                  <SelectTrigger id="prop-default-enum">
                    <SelectValue placeholder="Selecione o valor padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum valor padrão</SelectItem>
                    {(newProperty.options || [])
                      .filter(opt => opt.trim())
                      .map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              ) : newProperty.type === 'date' ? (
              <Input 
                id="prop-default" 
                  type="date"
                value={newProperty.defaultValue || ''}
                onChange={(e) => setNewProperty(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="YYYY-MM-DD"
                />
              ) : (
                <Input 
                  id="prop-default" 
                  value={newProperty.defaultValue || ''}
                  onChange={(e) => setNewProperty(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder={
                    newProperty.type === 'string' ? "Texto padrão" : 
                    newProperty.type === 'number' ? "0" : ""
                  }
                  type={newProperty.type === 'number' ? 'number' : 'text'}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Valor usado quando esta propriedade não for especificada
              </p>
            </div>
            
            <div className="flex items-center space-x-2 bg-muted/40 p-3 rounded-md">
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
              <div>
              <Label 
                htmlFor="prop-required"
                  className="text-sm font-medium cursor-pointer"
              >
                Propriedade obrigatória
              </Label>
                <p className="text-xs text-muted-foreground">
                  Se marcada, esta propriedade deve ser preenchida em todos os nós deste tipo
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-muted/40 p-3 rounded-md">
              <Checkbox 
                id="prop-primary-label"
                checked={newProperty.isPrimaryLabel || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Se marcada, desmarca todas as outras propriedades (caso seja propriedade de nó)
                    if (selectedNodeType) {
                      const nodeProperties = schema.nodeTypes[selectedNodeType].properties;
                      nodeProperties.forEach((prop) => {
                        if (prop.isPrimaryLabel) {
                          prop.isPrimaryLabel = false;
                        }
                      });
                    }
                  }
                  
                  setNewProperty(prev => ({
                    ...prev,
                    isPrimaryLabel: !!checked
                  }));
                }}
              />
              <div>
                <Label 
                  htmlFor="prop-primary-label"
                  className="text-sm font-medium cursor-pointer"
                >
                  Propriedade Nome
                </Label>
                <p className="text-xs text-muted-foreground">
                  Se marcada, esta propriedade será usada como label principal na visualização do grafo
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setIsAddingProperty(false)}>Cancelar</Button>
            <Button 
              onClick={() => handleAddProperty(selectedNodeType || undefined, selectedRelationshipType || undefined)}
              disabled={
                !newProperty.name.trim() || 
                (newProperty.type === 'enum' && (!(newProperty.options || []).some(opt => opt.trim())))
              }
            >
              Adicionar Propriedade
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
                <Label htmlFor="edit-prop-name" className="flex items-center">
                  Nome <span className="text-red-500 ml-1">*</span>
                </Label>
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
                  className={!propertyToEdit.property.name.trim() ? "border-red-300 focus-visible:ring-red-400" : ""}
                />
                {!propertyToEdit.property.name.trim() && (
                  <p className="text-xs text-red-500 mt-1">Nome da propriedade é obrigatório</p>
                )}
                {propertyToEdit.property.name.trim() && SYSTEM_NODE_PREFIXES.some(prefix => propertyToEdit.property.name.startsWith(prefix)) && (
                  <p className="text-xs text-amber-500 mt-1">Nomes que começam com "{SYSTEM_NODE_PREFIXES.join(', ')}" são reservados para o sistema</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-prop-type">Tipo</Label>
                <Select
                  value={propertyToEdit.property.type}
                  onValueChange={(value) => setPropertyToEdit(prev => prev ? {
                    ...prev,
                    property: {
                      ...prev.property,
                      type: value,
                      // Resetar options se não for enum
                      options: value === 'enum' ? (prev.property.options || ['']) : undefined,
                      // Adequar defaultValue para o tipo selecionado
                      defaultValue: value === 'boolean' ? 'false' : 
                                   value === 'number' ? '0' : 
                                   value === 'date' ? new Date().toISOString().split('T')[0] : 
                                   prev.property.defaultValue
                    }
                  } : prev)}
                >
                  <SelectTrigger id="edit-prop-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">
                      <div className="flex items-center">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">ABC</span>
                        <span>Texto (string)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="number">
                      <div className="flex items-center">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">123</span>
                        <span>Número (number)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="boolean">
                      <div className="flex items-center">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">T/F</span>
                        <span>Booleano (boolean)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="date">
                      <div className="flex items-center">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">📅</span>
                        <span>Data (date)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enum">
                      <div className="flex items-center">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs mr-2">[ ]</span>
                        <span>Enumeração (enum)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {propertyToEdit.property.type === 'string' && "Texto livre, pode conter qualquer caractere"}
                  {propertyToEdit.property.type === 'number' && "Valores numéricos inteiros ou decimais"}
                  {propertyToEdit.property.type === 'boolean' && "Valores verdadeiro/falso (true/false)"}
                  {propertyToEdit.property.type === 'date' && "Datas no formato YYYY-MM-DD"}
                  {propertyToEdit.property.type === 'enum' && "Lista de valores pré-definidos"}
                </p>
              </div>
              
              {propertyToEdit.property.type === 'enum' && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-prop-options" className="flex items-center">
                    Opções <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="space-y-3">
                    {(propertyToEdit.property.options || []).map((option, index) => (
                      <div key={index} className="flex gap-2">
                  <Input 
                          value={option}
                    onChange={(e) => {
                            const newOptions = [...(propertyToEdit.property.options || [])];
                            newOptions[index] = e.target.value;
                      setPropertyToEdit(prev => prev ? {
                        ...prev,
                        property: {
                          ...prev.property,
                                options: newOptions
                        }
                      } : prev);
                    }}
                          placeholder={`Opção ${index + 1}`}
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            const newOptions = [...(propertyToEdit.property.options || [])];
                            newOptions.splice(index, 1);
                            setPropertyToEdit(prev => prev ? {
                              ...prev,
                              property: {
                                ...prev.property,
                                options: newOptions.length ? newOptions : ['']
                              }
                            } : prev);
                          }}
                          disabled={(propertyToEdit.property.options || []).length <= 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [...(propertyToEdit.property.options || []), ''];
                        setPropertyToEdit(prev => prev ? {
                          ...prev,
                          property: {
                            ...prev.property,
                            options: newOptions
                          }
                        } : prev);
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="edit-prop-default">
                  Valor Padrão
                  <span className="ml-2 text-xs text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                {propertyToEdit.property.type === 'boolean' ? (
                  <Select
                    value={propertyToEdit.property.defaultValue || 'false'}
                    onValueChange={(value) => setPropertyToEdit(prev => prev ? {
                      ...prev,
                      property: {
                        ...prev.property,
                        defaultValue: value
                      }
                    } : prev)}
                  >
                    <SelectTrigger id="edit-prop-default-boolean">
                      <SelectValue placeholder="Selecione o valor padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Verdadeiro (true)</SelectItem>
                      <SelectItem value="false">Falso (false)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : propertyToEdit.property.type === 'enum' ? (
                  <Select
                    value={propertyToEdit.property.defaultValue || ''}
                    onValueChange={(value) => setPropertyToEdit(prev => prev ? {
                      ...prev,
                      property: {
                        ...prev.property,
                        defaultValue: value
                      }
                    } : prev)}
                    disabled={!(propertyToEdit.property.options || []).some(opt => opt.trim())}
                  >
                    <SelectTrigger id="edit-prop-default-enum">
                      <SelectValue placeholder="Selecione o valor padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum valor padrão</SelectItem>
                      {(propertyToEdit.property.options || [])
                        .filter(opt => opt.trim())
                        .map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                ) : propertyToEdit.property.type === 'date' ? (
                <Input 
                  id="edit-prop-default" 
                    type="date"
                  value={propertyToEdit.property.defaultValue || ''}
                  onChange={(e) => setPropertyToEdit(prev => prev ? {
                    ...prev,
                    property: {
                      ...prev.property,
                      defaultValue: e.target.value
                    }
                  } : prev)}
                    placeholder="YYYY-MM-DD"
                  />
                ) : (
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
                    placeholder={
                      propertyToEdit.property.type === 'string' ? "Texto padrão" : 
                      propertyToEdit.property.type === 'number' ? "0" : ""
                    }
                    type={propertyToEdit.property.type === 'number' ? 'number' : 'text'}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Valor usado quando esta propriedade não for especificada
                </p>
              </div>
              
              <div className="flex items-center space-x-2 bg-muted/40 p-3 rounded-md">
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
                <div>
                <Label 
                  htmlFor="edit-prop-required"
                    className="text-sm font-medium cursor-pointer"
                >
                  Propriedade obrigatória
                </Label>
                  <p className="text-xs text-muted-foreground">
                    Se marcada, esta propriedade deve ser preenchida em todos os nós deste tipo
                  </p>
                </div>
              </div>
              
              {propertyToEdit.nodeType && (
                <div className="flex items-center space-x-2 bg-muted/40 p-3 rounded-md">
                  <Checkbox 
                    id="edit-prop-primary-label"
                    checked={propertyToEdit.property.isPrimaryLabel || false}
                    onCheckedChange={(checked) => {
                      if (checked && propertyToEdit.nodeType) {
                        // Se marcada, desmarca todas as outras propriedades do nó
                        const nodeProperties = schema.nodeTypes[propertyToEdit.nodeType].properties;
                        
                        // Criar uma cópia atualizada das propriedades com isPrimaryLabel atualizado
                        const updatedProperties = nodeProperties.map((prop, idx) => {
                          if (idx === propertyToEdit.index) {
                            return { ...prop, isPrimaryLabel: true };
                          } else {
                            return { ...prop, isPrimaryLabel: false };
                          }
                        });
                        
                        // Atualizar o schema com as propriedades modificadas
                        setSchema(prev => ({
                          ...prev,
                          nodeTypes: {
                            ...prev.nodeTypes,
                            [propertyToEdit.nodeType as string]: {
                              ...prev.nodeTypes[propertyToEdit.nodeType as string],
                              properties: updatedProperties
                            }
                          }
                        }));
                      }
                      
                      // Atualizar a propriedade em edição
                      setPropertyToEdit(prev => prev ? {
                        ...prev,
                        property: {
                          ...prev.property,
                          isPrimaryLabel: !!checked
                        }
                      } : prev);
                    }}
                  />
                  <div>
                    <Label 
                      htmlFor="edit-prop-primary-label"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Propriedade Nome
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Se marcada, esta propriedade será usada como label principal na visualização do grafo
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
              <Button variant="outline" onClick={() => setIsEditingProperty(false)}>Cancelar</Button>
              <Button 
                onClick={() => {
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
                
                // Close the dialog
                setIsEditingProperty(false);
                setPropertyToEdit(null);
                }}
                disabled={
                  !propertyToEdit.property.name.trim() || 
                  (propertyToEdit.property.type === 'enum' && (!(propertyToEdit.property.options || []).some(opt => opt.trim())))
                }
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
} 