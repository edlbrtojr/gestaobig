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

interface StatusOptions {
  [key: string]: string[];
}

interface CommonOptions {
  status: StatusOptions;
  [key: string]: string[] | StatusOptions;
}

// Node types with their standard properties
const NODE_TYPES_CONFIG: NodeTypesConfig = {
  Risco: {
    properties: {
      description: "",
      impact: "Médio", // Default value
      probability: "Média", // Default value
      area: "",
      status: "Identificado",
    },
    // Allowed relationship types from this node type
    allowedRelationships: [
      "AFETA",
      "MITIGADO_POR",
      "RELACIONADO_A",
      "IDENTIFICADO_POR",
    ],
  },
  PlanoDeAcao: {
    properties: {
      description: "",
      deadline: "",
      status: "Planejado",
      priority: "Média",
      responsible: "",
    },
    allowedRelationships: [
      "MITIGA",
      "IMPLEMENTA",
      "RESPONSABILIDADE_DE",
      "POSSUI",
    ],
  },
  Acao: {
    properties: {
      description: "",
      deadline: "",
      status: "Pendente",
      responsible: "",
    },
    allowedRelationships: ["PARTE_DE", "EXECUTADO_POR", "IMPACTA"],
  },
  Estrategia: {
    properties: {
      description: "",
      timeframe: "",
      status: "Ativa",
      objective: "",
    },
    allowedRelationships: ["ENDEREÇA", "APOIA", "DEPENDE_DE", "ALINHADO_COM"],
  },
  Visao: {
    properties: {
      description: "",
      timeframe: "",
    },
    allowedRelationships: ["ORIENTA", "SUPORTA"],
  },
  Missao: {
    properties: {
      description: "",
    },
    allowedRelationships: ["FUNDAMENTA", "DIRECIONA"],
  },
  Oportunidade: {
    properties: {
      description: "",
      potential: "Médio",
      timeframe: "",
      area: "",
    },
    allowedRelationships: ["EXPLORADA_POR", "RELACIONADA_A", "CONTRIBUI_PARA"],
  },
  Departamento: {
    properties: {
      description: "",
      manager: "",
      size: "",
    },
    allowedRelationships: ["RESPONSÁVEL_POR", "REPORTA_PARA", "GERENCIA"],
  },
  Projeto: {
    properties: {
      description: "",
      status: "Em andamento",
      startDate: "",
      endDate: "",
      manager: "",
    },
    allowedRelationships: [
      "CONTRIBUI_PARA",
      "DEPENDE_DE",
      "GERENCIADO_POR",
      "INCLUI",
    ],
  },
  Objetivo: {
    properties: {
      description: "",
      timeframe: "",
      status: "Ativo",
      metric: "",
    },
    allowedRelationships: ["SUPORTADO_POR", "ALINHADO_COM", "MENSURADO_POR"],
  },
  KPI: {
    properties: {
      description: "",
      target: "",
      current: "",
      unit: "",
      frequency: "Mensal",
    },
    allowedRelationships: ["MEDE", "RELACIONADO_A"],
  },
  Stakeholder: {
    properties: {
      description: "",
      role: "",
      influence: "Média",
      interest: "Médio",
    },
    allowedRelationships: ["INTERESSADO_EM", "INFLUENCIA", "RESPONDE_POR"],
  },
  Tecnologia: {
    properties: {
      description: "",
      version: "",
      status: "Ativo",
      vendor: "",
    },
    allowedRelationships: ["SUPORTA", "INTEGRADA_COM", "PARTE_DE"],
  },
  Produto: {
    properties: {
      description: "",
      status: "Ativo",
      lifecycle: "Desenvolvimento",
      manager: "",
    },
    allowedRelationships: ["DEPENDENTE_DE", "ENTREGUE_POR", "INCLUI"],
  },
  Mercado: {
    properties: {
      description: "",
      size: "",
      growth: "",
      region: "",
    },
    allowedRelationships: ["INCLUI", "RELACIONADO_A"],
  },
  Competidor: {
    properties: {
      description: "",
      size: "",
      strength: "Médio",
      threat: "Médio",
    },
    allowedRelationships: ["COMPETE_COM", "ATUA_EM", "AMEAÇA"],
  },
};

// Property types and their input components
const PROPERTY_TYPES: { [key: string]: string } = {
  text: "input",
  textarea: "textarea",
  date: "date",
  select: "select",
};

// Common property options
const COMMON_OPTIONS: CommonOptions = {
  status: {
    Risco: ["Identificado", "Analisado", "Mitigado", "Aceito", "Fechado"],
    PlanoDeAcao: [
      "Planejado",
      "Em andamento",
      "Concluído",
      "Atrasado",
      "Cancelado",
    ],
    Acao: ["Pendente", "Em andamento", "Concluída", "Atrasada", "Cancelada"],
    Estrategia: ["Ativa", "Em revisão", "Concluída", "Abandonada"],
    Projeto: [
      "Planejado",
      "Em andamento",
      "Concluído",
      "Suspenso",
      "Cancelado",
    ],
    Objetivo: ["Ativo", "Concluído", "Revisão", "Abandonado"],
    Tecnologia: ["Ativo", "Legado", "Em implementação", "Descontinuado"],
    Produto: ["Ativo", "Em desenvolvimento", "Descontinuado", "Planejado"],
  },
  priority: ["Alta", "Média", "Baixa"],
  impact: ["Alto", "Médio", "Baixo"],
  probability: ["Alta", "Média", "Baixa"],
  influence: ["Alta", "Média", "Baixa"],
  interest: ["Alto", "Médio", "Baixo"],
  potential: ["Alto", "Médio", "Baixo"],
  strength: ["Alto", "Médio", "Baixo"],
  threat: ["Alto", "Médio", "Baixo"],
  lifecycle: [
    "Concepção",
    "Desenvolvimento",
    "Lançamento",
    "Crescimento",
    "Maturidade",
    "Declínio",
  ],
  frequency: [
    "Diária",
    "Semanal",
    "Mensal",
    "Trimestral",
    "Semestral",
    "Anual",
  ],
};

// Get all node types
const NODE_TYPES = Object.keys(NODE_TYPES_CONFIG);

// Get all possible relationship types
const ALL_RELATIONSHIP_TYPES = [
  ...new Set(
    Object.values(NODE_TYPES_CONFIG).flatMap(
      (config) => config.allowedRelationships
    )
  ),
].sort();

interface NodeFormData {
  name: string;
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

// Get valid relationship types between source and target node types
const getValidRelationshipTypes = (
  sourceType: string,
  targetType: string
): string[] => {
  if (!sourceType || !targetType) return [];

  // Get allowed relationships from source node type
  const allowedRelationships =
    NODE_TYPES_CONFIG[sourceType]?.allowedRelationships || [];

  // Return all allowed relationships for simplicity
  // In a more sophisticated system, this would filter by which relationships
  // can connect specific target node types
  return allowedRelationships;
};

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

export default function AddForm({ onAdd }: AddFormProps) {
  const router = useRouter();
  const [formType, setFormType] = useState<"node" | "relationship">("node");
  const [selectedNodeType, setSelectedNodeType] = useState<string>("Risco");
  const [nodeFormData, setNodeFormData] = useState<NodeFormData>({
    name: "",
    label: "Risco",
    properties: { ...NODE_TYPES_CONFIG["Risco"].properties },
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
    { id: string; name: string; label: string; properties: any }[]
  >([]);
  const [relationshipTypes, setRelationshipTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCustomPropertiesForm, setShowCustomPropertiesForm] =
    useState<boolean>(false);

  // Fetch existing nodes on component mount
  useEffect(() => {
    fetchExistingNodes();
  }, []);

  // Update node properties when label changes
  useEffect(() => {
    if (nodeFormData.label && NODE_TYPES_CONFIG[nodeFormData.label]) {
      setNodeFormData((prevData) => ({
        ...prevData,
        properties: { ...NODE_TYPES_CONFIG[nodeFormData.label].properties },
      }));
    }
  }, [nodeFormData.label]);

  // Update allowed relationship types when source node changes
  useEffect(() => {
    if (
      relationshipFormData.sourceType &&
      NODE_TYPES_CONFIG[relationshipFormData.sourceType]
    ) {
      const allowedRelationships =
        NODE_TYPES_CONFIG[relationshipFormData.sourceType].allowedRelationships;
      // Reset relationship type when source changes
      setRelationshipFormData({
        ...relationshipFormData,
        type: allowedRelationships.length > 0 ? allowedRelationships[0] : "",
      });
    }
  }, [relationshipFormData.sourceType]);

  const fetchExistingNodes = async () => {
    try {
      const response = await fetch(`/api/graph?t=${Date.now()}`);
      if (!response.ok) throw new Error("Falha ao buscar nós existentes");
      const data = await response.json();

      // Normalize node IDs to ensure consistent object shape
      const normalizedNodes = data.nodes.map((node: any) => ({
        ...node,
        id: getUniqueNodeId(node.id), // Convert Neo4j ID to string for consistent comparison
        name: node.properties?.name || `Node ${getUniqueNodeId(node.id)}`, // Ensure name is extracted from properties
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
      if (!nodeFormData.name.trim()) {
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

      // Log submission data for debugging
      console.log("Submitting node:", {
        name: nodeFormData.name,
        label: nodeFormData.label,
        properties: cleanedProperties,
      });

      const response = await fetch("/api/node", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nodeFormData.name,
          label: nodeFormData.label,
          properties: cleanedProperties,
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
        name: "",
        label: NODE_TYPES[0],
        properties: { ...NODE_TYPES_CONFIG[NODE_TYPES[0]].properties },
      });
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

  // Helper function to get input type based on property name
  const getInputType = (propertyName: string, nodeType: string): string => {
    if (
      propertyName.includes("date") ||
      propertyName === "startDate" ||
      propertyName === "endDate" ||
      propertyName === "deadline"
    ) {
      return "date";
    }

    if (propertyName === "description") {
      return "textarea";
    }

    if (
      propertyName === "status" ||
      propertyName === "priority" ||
      propertyName === "impact" ||
      propertyName === "probability" ||
      propertyName === "influence" ||
      propertyName === "interest" ||
      propertyName === "potential" ||
      propertyName === "strength" ||
      propertyName === "threat" ||
      propertyName === "lifecycle" ||
      propertyName === "frequency"
    ) {
      return "select";
    }

    return "text";
  };

  // Helper function to get options for a select input
  const getOptions = (propertyName: string, nodeType: string): string[] => {
    if (
      propertyName === "status" &&
      COMMON_OPTIONS.status &&
      COMMON_OPTIONS.status[nodeType]
    ) {
      return COMMON_OPTIONS.status[nodeType];
    }

    const options = COMMON_OPTIONS[propertyName];
    if (Array.isArray(options)) {
      return options;
    }

    return [];
  };

  // Convert existingNodes to ComboboxOption format
  const nodeOptions: ComboboxOption[] = existingNodes.map((node) => ({
    value: node.id,
    label: node.name,
    description: node.label,
  }));

  // Filter target nodes to exclude the selected source node
  const targetNodeOptions = nodeOptions.filter(
    (option) => option.value !== relationshipFormData.source
  );

  // Convert relationship types to ComboboxOption format
  const relationshipTypeOptions: ComboboxOption[] = relationshipTypes.map(
    (type) => ({
      value: type,
      label: type,
    })
  );

  return (
    <div className="w-full p-6">
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
                      name: "",
                      label: selectedType,
                      properties: {
                        ...NODE_TYPES_CONFIG[selectedType].properties,
                      },
                    });
                  }}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                >
                  {Object.keys(NODE_TYPES_CONFIG).map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                  value={nodeFormData.name}
                  onChange={(e) =>
                    setNodeFormData({ ...nodeFormData, name: e.target.value })
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
                      {key}
                    </label>
                    {getInputType(key, selectedNodeType) === "textarea" ? (
                      <textarea
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        placeholder={`${key}`}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                        rows={3}
                      />
                    ) : getInputType(key, selectedNodeType) === "select" ? (
                      <select
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      >
                        {getOptions(key, selectedNodeType).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : getInputType(key, selectedNodeType) === "date" ? (
                      <input
                        type="date"
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-700 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handlePropertyChange(key, e.target.value)
                        }
                        placeholder={`${key}`}
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
                        {key}
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
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Tecendo...
                    </span>
                  ) : (
                    "Tecer Nó"
                  )}
                </button>
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

                    // Update relationship types if both nodes are selected
                    if (
                      selectedNode?.label &&
                      relationshipFormData.targetType
                    ) {
                      const validTypes = getValidRelationshipTypes(
                        selectedNode.label,
                        relationshipFormData.targetType
                      );
                      setRelationshipTypes(validTypes);
                      setRelationshipFormData((prev) => ({
                        ...prev,
                        type: validTypes.length > 0 ? validTypes[0] : "",
                      }));
                    }
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

                    // Update relationship types if both nodes are selected
                    if (
                      relationshipFormData.sourceType &&
                      selectedNode?.label
                    ) {
                      const validTypes = getValidRelationshipTypes(
                        relationshipFormData.sourceType,
                        selectedNode.label
                      );
                      setRelationshipTypes(validTypes);
                      setRelationshipFormData((prev) => ({
                        ...prev,
                        type: validTypes.length > 0 ? validTypes[0] : "",
                      }));
                    }
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
              <button
                type="submit"
                disabled={loading || relationshipTypes.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Tecendo...
                  </span>
                ) : (
                  "Tecer Conexão"
                )}
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
