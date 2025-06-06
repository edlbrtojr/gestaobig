"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { SewingMachineLoader } from "@/components/ui/sewing-machine-loader";
import { getNodeTypesConfig, getValidRelationshipTypes, getPropertyOptions, getNodeProperties } from "@/lib/schema";

// Define types for node configurations
interface NodeProperties {
  [key: string]: string;
}

interface NodeTypeConfig {
  properties: NodeProperties;
  allowedRelationships: string[];
}

interface NodeTypesConfig {
  [key: string]: NodeTypeConfig;
}

interface NodeFormData {
  nome: string;
  label: string;
  properties: { [key: string]: string };
}

interface RelationshipFormData {
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
  type: string;
  properties: { [key: string]: string };
}

interface AddFormProps {
  onAdd?: () => void;
}

// Helper function to safely extract a string ID from a Neo4j node ID
const getUniqueNodeId = (nodeId: any): string => {
  if (nodeId === null || nodeId === undefined) return "unknown";
  if (typeof nodeId === "string") return nodeId;
  if (typeof nodeId === "number") return String(nodeId);
  // Handle Neo4j integer objects which have a 'low' property
  if (typeof nodeId === "object" && nodeId !== null && "low" in nodeId) {
    return String(nodeId.low);
  }
  // Last resort for any other object
  return JSON.stringify(nodeId);
};

// Map node types to human-readable labels
const getNodeTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    'Empresa': 'Empresa',
    'Unidade': 'Unidade',
    'Missao': 'Missão',
    'Visao': 'Visão',
    'Proposito': 'Propósito',
    'Negocio': 'Negócio',
    'SistemaApoio': 'Sistema de Apoio'
  };
  
  return labelMap[type] || type;
};

// Map relationship types to human-readable labels
const getRelationshipTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    'POSSUI': 'Possui',
    'TEM_PROPOSITO': 'Tem propósito',
    'TEM_MISSAO': 'Tem missão',
    'TEM_VISAO': 'Tem visão',
    'INCLUI': 'Inclui',
    'PRESTA_SERVICO_PARA': 'Presta serviço para',
    'ATUA_EM': 'Atua em'
  };
  
  return labelMap[type] || type;
};

export default function AddForm({ onAdd }: AddFormProps) {
  const router = useRouter();
  const [formType, setFormType] = useState<"node" | "relationship">("node");
  const [nodeTypesConfig, setNodeTypesConfig] = useState<NodeTypesConfig>({});
  const [selectedNodeType, setSelectedNodeType] = useState<string>("");
  const [nodeFormData, setNodeFormData] = useState<NodeFormData>({
    nome: "",
    label: "",
    properties: {},
  });
  const [customProperties, setCustomProperties] = useState<{
    [key: string]: string;
  }>({});
  const [customPropertyKey, setCustomPropertyKey] = useState<string>("");
  const [customPropertyValue, setCustomPropertyValue] = useState<string>("");
  const [relationshipFormData, setRelationshipFormData] =
    useState<RelationshipFormData>({
      source: "",
      sourceType: "",
      target: "",
      targetType: "",
      type: "",
      properties: {},
    });
  const [existingNodes, setExistingNodes] = useState<
    { id: string; nome: string; label: string; properties: any }[]
  >([]);
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCustomPropertiesForm, setShowCustomPropertiesForm] =
    useState<boolean>(false);
  
  // Cache state for input types and options
  const [inputTypes, setInputTypes] = useState<Record<string, string>>({});
  const [selectOptions, setSelectOptions] = useState<Record<string, string[]>>({});
  
  // Loading overlay state based on the loading state
  const loadingType = formType === "node" ? "nó" : "conexão";

  // Load node types config and fetch existing nodes on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Load node types config from API/localStorage via utility
        const config = await getNodeTypesConfig();
        setNodeTypesConfig(config);
        
        // Set initial selected node type and form data
        if (Object.keys(config).length > 0) {
          const firstNodeType = Object.keys(config)[0];
          setSelectedNodeType(firstNodeType);
          setNodeFormData({
            nome: "",
            label: firstNodeType,
            properties: { ...config[firstNodeType].properties },
          });
        }
      } catch (error) {
        console.error("Failed to load node types config:", error);
        setError("Falha ao carregar configuração de tipos de nós");
      }
    };
    
    loadConfig();
    fetchExistingNodes();
  }, []);

  // Re-load node types config whenever the form is shown
  // This ensures it picks up any changes made in the admin settings
  useEffect(() => {
    const refreshConfig = async () => {
      try {
        const config = await getNodeTypesConfig();
        setNodeTypesConfig(config);
        
        if (Object.keys(config).length > 0 && !selectedNodeType) {
          const firstNodeType = Object.keys(config)[0];
          setSelectedNodeType(firstNodeType);
          setNodeFormData({
            nome: "",
            label: firstNodeType,
            properties: { ...config[firstNodeType].properties },
          });
        }
      } catch (error) {
        console.error("Failed to refresh node types config:", error);
      }
    };
    
    refreshConfig();
  }, [formType]);

  // Update node properties when label changes
  useEffect(() => {
    if (nodeFormData.label && nodeTypesConfig[nodeFormData.label]) {
      setNodeFormData((prevData) => ({
        ...prevData,
        properties: { ...nodeTypesConfig[nodeFormData.label].properties },
      }));
      
      // Reset input types when properties change
      setInputTypes({});
    }
  }, [nodeFormData.label, nodeTypesConfig]);
  
  // Load input types and options for current properties
  useEffect(() => {
    const loadPropertyDetails = async () => {
      if (!selectedNodeType) return;
      
      // Load input types for all properties
      const newInputTypes: Record<string, string> = {};
      const newSelectOptions: Record<string, string[]> = {};
      
      const properties = Object.keys(nodeFormData.properties);
      for (const propertyName of properties) {
        try {
          // Get input type
          const type = await getInputType(propertyName, selectedNodeType);
          newInputTypes[propertyName] = type;
          
          // If it's a select, load options
          if (type === 'select') {
            const options = await getOptions(propertyName, selectedNodeType);
            newSelectOptions[propertyName] = options;
          }
        } catch (error) {
          console.error(`Error loading details for property ${propertyName}:`, error);
        }
      }
      
      setInputTypes(newInputTypes);
      setSelectOptions(newSelectOptions);
    };
    
    loadPropertyDetails();
  }, [selectedNodeType, nodeFormData.properties]);

  // Update allowed relationship types when source and target nodes change
  useEffect(() => {
    const updateRelationshipTypes = async () => {
      if (
        relationshipFormData.sourceType &&
        relationshipFormData.targetType
      ) {
        try {
          const validTypes = await getValidRelationshipTypes(
            relationshipFormData.sourceType,
            relationshipFormData.targetType
          );
          setRelationshipTypes(validTypes);
          
          // Reset relationship type when source/target changes
          setRelationshipFormData((prev) => ({
            ...prev,
            type: validTypes.length > 0 ? validTypes[0] : "",
          }));
        } catch (error) {
          console.error("Failed to get valid relationship types:", error);
          setRelationshipTypes([]);
        }
      }
    };
    
    updateRelationshipTypes();
  }, [relationshipFormData.sourceType, relationshipFormData.targetType]);

  const fetchExistingNodes = async () => {
    try {
      const response = await fetch(`/api/graph?t=${Date.now()}`);
      if (!response.ok) throw new Error("Falha ao buscar nós existentes");
      const data = await response.json();

      // Normalize node IDs to ensure consistent object shape
      const normalizedNodes = data.nodes.map((node: any) => ({
        ...node,
        id: getUniqueNodeId(node.id), // Convert Neo4j ID to string for consistent comparison
        nome: node.properties?.nome || node.properties?.name || `Nó ${getUniqueNodeId(node.id)}`, // Ensure nome is extracted from properties
      }));

      setExistingNodes(normalizedNodes);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setError("Falha ao carregar nós existentes");
    }
  };

  const handlePropertyChange = (key: string, value: string) => {
    setNodeFormData({
      ...nodeFormData,
      properties: {
        ...nodeFormData.properties,
        [key]: value,
      },
    });
  };

  const handleAddCustomProperty = () => {
    if (!customPropertyKey.trim()) return;

    setCustomProperties({
      ...customProperties,
      [customPropertyKey]: customPropertyValue,
    });

    // Clear inputs
    setCustomPropertyKey("");
    setCustomPropertyValue("");
  };

  const handleRemoveCustomProperty = (key: string) => {
    const newProperties = { ...customProperties };
    delete newProperties[key];
    setCustomProperties(newProperties);
  };

  const handleSubmitNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (!nodeFormData.nome.trim()) {
        setError("Nome do nó é obrigatório");
        setLoading(false);
        return;
      }

      // Prepare data with valid properties
      const cleanedProperties = Object.fromEntries(
        Object.entries(nodeFormData.properties).filter(
          ([_, value]) => value !== undefined
        )
      );

      // Add custom properties
      const finalProperties = {
        ...cleanedProperties,
        ...customProperties,
        nome: nodeFormData.nome
      };

      // Log submission data for debugging
      console.log("Submitting node:", {
        nome: nodeFormData.nome,
        label: nodeFormData.label,
        properties: finalProperties,
      });

      const response = await fetch("/api/node", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nodeFormData.nome,
          label: nodeFormData.label,
          properties: finalProperties,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao adicionar nó");
      }

      // Refresh list of nodes first to ensure the new node is available
      await fetchExistingNodes();

      setSuccess("Nó adicionado com sucesso! Adicione um relacionamento.");

      // Call onAdd callback if provided
      if (onAdd) onAdd();

      // Refresh the page data
      router.refresh();

      // Pre-fill relationship form with the new node as source
      if (data.node) {
        const newNode = data.node;
        const newNodeId =
          newNode.id?.low !== undefined ? newNode.id.low : newNode.id;

        setRelationshipFormData({
          source: String(newNodeId),
          sourceType: newNode.label || "",
          target: "",
          targetType: "",
          type: "", // This will be repopulated by the useEffect based on sourceType
          properties: {},
        });
        setFormType("relationship"); // Switch to relationship form
      }

      // Reset node form (even though we are switching, it's good practice)
      setNodeFormData({
        nome: "",
        label: selectedNodeType,
        properties: { ...nodeTypesConfig[selectedNodeType].properties },
      });
      
      // Reset custom properties
      setCustomProperties({});
    } catch (error) {
      console.error("Error adding node:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Falha ao adicionar nó. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      if (
        !relationshipFormData.source ||
        !relationshipFormData.target ||
        !relationshipFormData.type
      ) {
        setError("Origem, destino e tipo de relacionamento são obrigatórios");
        setLoading(false);
        return;
      }

      // Log submission data for debugging
      console.log("Submitting relationship:", relationshipFormData);

      const response = await fetch("/api/relationship", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: relationshipFormData.source,
          target: relationshipFormData.target,
          type: relationshipFormData.type,
          properties: relationshipFormData.properties || {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao adicionar relacionamento");
      }

      // Reset form
      setRelationshipFormData({
        source: "",
        sourceType: "",
        target: "",
        targetType: "",
        type: "",
        properties: {},
      });

      setSuccess("Relacionamento adicionado com sucesso!");

      // Call onAdd callback if provided
      if (onAdd) onAdd();

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error adding relationship:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Falha ao adicionar relacionamento. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get input type based on property name and definition
  const getInputType = async (propertyName: string, nodeType: string): Promise<string> => {
    try {
      const nodeProps = await getNodeProperties(nodeType);
      const propDef = nodeProps.find(p => p.name === propertyName);
      
      if (propDef) {
        if (propDef.type === 'date') return 'date';
        if (propDef.type === 'enum') return 'select';
        if (propDef.type === 'boolean') return 'checkbox';
        if (propDef.type === 'string' && propertyName === 'descricao') return 'textarea';
        return 'text';
      }
      
      // Fallback logic for custom properties
      if (
        propertyName.includes("data") ||
        propertyName === "dataInicio" ||
        propertyName === "dataFim" ||
        propertyName === "prazo"
      ) {
        return "date";
      }

      if (propertyName === "descricao") {
        return "textarea";
      }
    } catch (error) {
      console.error("Failed to get node properties:", error);
    }

    return "text";
  };

  // Helper function to get options for a select input
  const getOptions = async (propertyName: string, nodeType: string): Promise<string[]> => {
    try {
      return await getPropertyOptions(propertyName, nodeType);
    } catch (error) {
      console.error("Failed to get property options:", error);
      return [];
    }
  };

  // Convert existingNodes to ComboboxOption format
  const nodeOptions: ComboboxOption[] = existingNodes.map((node) => ({
    value: node.id,
    label: node.nome || node.properties?.nome || node.properties?.name || `Nó ${node.id}`,
    description: getNodeTypeLabel(node.label),
  }));

  // Filter target nodes to exclude the selected source node
  const targetNodeOptions = nodeOptions.filter(
    (option) => option.value !== relationshipFormData.source
  );

  // Convert relationship types to ComboboxOption format
  const relationshipTypeOptions: ComboboxOption[] = relationshipTypes.map(
    (type) => ({
      value: type,
      label: getRelationshipTypeLabel(type),
    })
  );

  // Get all node types for dropdown
  const nodeTypeOptions = Object.keys(nodeTypesConfig);
  
  // Helper function to translate property names to human-readable labels
  const getPropertyLabel = (name: string): string => {
    const labelMap: Record<string, string> = {
      'nome': 'Nome',
      'descricao': 'Descrição',
      'data': 'Data',
      'status': 'Status',
      'prioridade': 'Prioridade',
      'responsavel': 'Responsável',
      'setor': 'Setor',
      'area': 'Área',
      'objetivo': 'Objetivo'
    };
    
    return labelMap[name] || name.replace(/_/g, " ");
  };

  return (
    <div className="w-full p-6 relative">
      {/* Loading overlay with blurred background */}
      {loading && (
        <SewingMachineLoader 
          fullScreen={true}
          size="lg" 
          text={`Tecendo ${loadingType}...`}
        />
      )}
      
      {/* Tabs for Form Type Selection */}
      <Tabs
        defaultValue="node"
        value={formType}
        onValueChange={(value) => setFormType(value as "node" | "relationship")}
        className="w-full mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="node">Adicionar Nó</TabsTrigger>
          <TabsTrigger value="relationship">Adicionar Relação</TabsTrigger>
        </TabsList>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300">
            <p className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-300">
            <p className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {success}
            </p>
          </div>
        )}

        <TabsContent value="node" className="mt-4">
          {/* Node Form */}
          <form onSubmit={handleSubmitNode} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Nó
                </label>
                <select
                  value={selectedNodeType}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setSelectedNodeType(selectedType);
                    // Reset the form data when the node type changes
                    setNodeFormData({
                      nome: "",
                      label: selectedType,
                      properties: {
                        ...nodeTypesConfig[selectedType]?.properties || {},
                      },
                    });
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                >
                  {nodeTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {getNodeTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nome
                </label>
                <input
                  type="text"
                  value={nodeFormData.nome}
                  onChange={(e) =>
                    setNodeFormData({ ...nodeFormData, nome: e.target.value })
                  }
                  placeholder="Nome do nó"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 my-4 pt-4">
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Propriedades
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard properties based on node type */}
                {Object.entries(nodeFormData.properties).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {getPropertyLabel(key)}
                    </label>
                    {!inputTypes[key] ? (
                      // Show loading state or fallback while input type is being determined
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        placeholder={`${getPropertyLabel(key)}`}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      />
                    ) : inputTypes[key] === "textarea" ? (
                      <textarea
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        placeholder={`${getPropertyLabel(key)}`}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                        rows={3}
                      />
                    ) : inputTypes[key] === "select" ? (
                      <select
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        {selectOptions[key]?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : inputTypes[key] === "date" ? (
                      <input
                        type="date"
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      />
                    ) : inputTypes[key] === "checkbox" ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={value === 'true' || Boolean(value)}
                          onChange={(e) =>
                            handlePropertyChange(key, e.target.checked.toString())
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {value === 'true' || Boolean(value) ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        placeholder={`${getPropertyLabel(key)}`}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Properties */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Propriedades Personalizadas
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowCustomPropertiesForm(!showCustomPropertiesForm)
                  }
                >
                  {showCustomPropertiesForm ? "Ocultar" : "Adicionar"}
                </Button>
              </div>

              {showCustomPropertiesForm && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Nome da Propriedade
                      </label>
                      <input
                        type="text"
                        value={customPropertyKey}
                        onChange={(e) => setCustomPropertyKey(e.target.value)}
                        placeholder="Nome da propriedade"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Valor da Propriedade
                      </label>
                      <input
                        type="text"
                        value={customPropertyValue}
                        onChange={(e) => setCustomPropertyValue(e.target.value)}
                        placeholder="Valor da propriedade"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomProperty}
                      disabled={!customPropertyKey.trim()}
                    >
                      Adicionar Propriedade
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {Object.entries(customProperties).map(([key, value]) => (
                  <div key={key} className="relative">
                    <div className="flex items-center space-x-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {getPropertyLabel(key)}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomProperty(key)}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setCustomProperties({
                          ...customProperties,
                          [key]: e.target.value,
                        })
                      }
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-32"
                >
                  Tecer Nó
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="relationship" className="mt-4">
          {/* Relationship Form */}
          <form onSubmit={handleSubmitRelationship} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nó de Origem
                </label>
                <Combobox
                  options={nodeOptions}
                  value={relationshipFormData.source}
                  onChange={(value) => {
                    // Find the selected node to get its type
                    const selectedNode = existingNodes.find(
                      (node) => node.id === value
                    );

                    setRelationshipFormData({
                      ...relationshipFormData,
                      source: value,
                      sourceType: selectedNode?.label || "",
                    });
                  }}
                  placeholder="Selecione um nó de origem"
                  searchPlaceholder="Buscar nó..."
                  emptyMessage="Nenhum nó encontrado."
                  groupHeading="Nós"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Nó de Destino
                </label>
                <Combobox
                  options={targetNodeOptions}
                  value={relationshipFormData.target}
                  onChange={(value) => {
                    // Find the selected node to get its type
                    const selectedNode = existingNodes.find(
                      (node) => node.id === value
                    );

                    setRelationshipFormData({
                      ...relationshipFormData,
                      target: value,
                      targetType: selectedNode?.label || "",
                    });
                  }}
                  placeholder="Selecione um nó de destino"
                  searchPlaceholder="Buscar nó..."
                  emptyMessage="Nenhum nó encontrado."
                  groupHeading="Nós"
                  disabled={!relationshipFormData.source}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Tipo de Relação
              </label>
              <Combobox
                options={relationshipTypeOptions}
                value={relationshipFormData.type}
                onChange={(value) => {
                  setRelationshipFormData({
                    ...relationshipFormData,
                    type: value,
                  });
                }}
                placeholder="Selecione o tipo de relação"
                searchPlaceholder="Buscar tipo..."
                emptyMessage="Nenhum tipo de relação disponível."
                disabled={relationshipTypes.length === 0}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                disabled={loading || relationshipTypes.length === 0}
                className="min-w-32"
              >
                Tecer Conexão
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
