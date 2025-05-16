"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function AddForm({ onAdd }: AddFormProps) {
  const router = useRouter();
  const [isAddingNode, setIsAddingNode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [existingNodes, setExistingNodes] = useState<any[]>([]);
  const [customPropertyMode, setCustomPropertyMode] = useState(false);

  // Node form state
  const [nodeFormData, setNodeFormData] = useState<NodeFormData>({
    name: "",
    label: NODE_TYPES[0],
    properties: { ...NODE_TYPES_CONFIG[NODE_TYPES[0]].properties },
  });

  // Relationship form state
  const [relationshipFormData, setRelationshipFormData] =
    useState<RelationshipFormData>({
      source: "",
      sourceType: "",
      target: "",
      targetType: "",
      type: "",
      properties: {},
    });

  // Custom property form state
  const [newPropertyKey, setNewPropertyKey] = useState("");
  const [newPropertyValue, setNewPropertyValue] = useState("");

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
      setExistingNodes(data.nodes);
    } catch (error) {
      console.error("Error fetching nodes:", error);
      setMessage({
        text: "Falha ao carregar nós existentes",
        type: "error",
      });
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
    if (!newPropertyKey.trim()) return;

    setNodeFormData({
      ...nodeFormData,
      properties: {
        ...nodeFormData.properties,
        [newPropertyKey]: newPropertyValue,
      },
    });

    // Clear inputs
    setNewPropertyKey("");
    setNewPropertyValue("");
  };

  const handleRemoveCustomProperty = (key: string) => {
    const newProperties = { ...nodeFormData.properties };
    delete newProperties[key];
    setNodeFormData({
      ...nodeFormData,
      properties: newProperties,
    });
  };

  const handleSubmitNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate inputs
      if (!nodeFormData.name.trim()) {
        setMessage({
          text: "Nome do nó é obrigatório",
          type: "error",
        });
        setIsLoading(false);
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

      setMessage({
        text: "Nó adicionado com sucesso! Adicione um relacionamento.",
        type: "success",
      });

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
        setIsAddingNode(false); // Switch to relationship form
      }

      // Reset node form (even though we are switching, it's good practice)
      setNodeFormData({
        name: "",
        label: NODE_TYPES[0],
        properties: { ...NODE_TYPES_CONFIG[NODE_TYPES[0]].properties },
      });
    } catch (error) {
      console.error("Error adding node:", error);
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Falha ao adicionar nó. Tente novamente.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate inputs
      if (
        !relationshipFormData.source ||
        !relationshipFormData.target ||
        !relationshipFormData.type
      ) {
        setMessage({
          text: "Origem, destino e tipo de relacionamento são obrigatórios",
          type: "error",
        });
        setIsLoading(false);
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

      setMessage({
        text: "Relacionamento adicionado com sucesso!",
        type: "success",
      });

      // Call onAdd callback if provided
      if (onAdd) onAdd();

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error adding relationship:", error);
      setMessage({
        text:
          error instanceof Error
            ? error.message
            : "Falha ao adicionar relacionamento. Tente novamente.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="border border-[var(--card-border)] rounded-lg p-6 bg-[var(--card-background)] shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Adicionar ao Grafo</h2>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              isAddingNode
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted-background)] text-[var(--foreground)]"
            }`}
            onClick={() => setIsAddingNode(true)}
          >
            Adicionar Nó
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              !isAddingNode
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted-background)] text-[var(--foreground)]"
            }`}
            onClick={() => setIsAddingNode(false)}
          >
            Adicionar Relacionamento
          </button>
        </div>
      </div>

      {/* Message display */}
      {message && (
        <div
          className={`p-4 mb-4 rounded-md ${
            message.type === "success"
              ? "bg-[var(--success)] bg-opacity-10 text-[var(--success)]"
              : "bg-[var(--danger)] bg-opacity-10 text-[var(--danger)]"
          }`}
        >
          {message.text}
        </div>
      )}

      {isAddingNode ? (
        // Node Form
        <form onSubmit={handleSubmitNode}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Nó
              </label>
              <select
                className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                value={nodeFormData.label}
                onChange={(e) =>
                  setNodeFormData({
                    ...nodeFormData,
                    label: e.target.value,
                  })
                }
                required
              >
                {NODE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                value={nodeFormData.name}
                onChange={(e) =>
                  setNodeFormData({
                    ...nodeFormData,
                    name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium mb-1">
                Propriedades Padrão
              </label>
              <div className="space-y-3">
                {Object.entries(
                  NODE_TYPES_CONFIG[nodeFormData.label]?.properties || {}
                ).map(([key, defaultValue]) => {
                  const inputType = getInputType(key, nodeFormData.label);
                  const options = getOptions(key, nodeFormData.label);
                  const currentValue =
                    nodeFormData.properties[key] ?? defaultValue ?? "";

                  return (
                    <div key={key} className="space-y-1">
                      <label
                        htmlFor={`prop-${key}`}
                        className="block text-xs font-medium text-[var(--muted-foreground)] capitalize"
                      >
                        {key.replace(/_/g, " ")}
                      </label>
                      {inputType === "select" ? (
                        <select
                          id={`prop-${key}`}
                          className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                          value={currentValue}
                          onChange={(e) =>
                            handlePropertyChange(key, e.target.value)
                          }
                        >
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : inputType === "textarea" ? (
                        <textarea
                          id={`prop-${key}`}
                          className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)] min-h-[60px]"
                          value={currentValue}
                          onChange={(e) =>
                            handlePropertyChange(key, e.target.value)
                          }
                        />
                      ) : (
                        <input
                          id={`prop-${key}`}
                          type={inputType}
                          className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                          value={currentValue}
                          onChange={(e) =>
                            handlePropertyChange(key, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Propriedades Personalizadas
                </label>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded-md bg-[var(--muted-background)]"
                  onClick={() => setCustomPropertyMode(!customPropertyMode)}
                >
                  {customPropertyMode ? "Esconder" : "Mostrar"}
                </button>
              </div>

              {customPropertyMode && (
                <div className="space-y-3 pt-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Chave"
                      className="flex-1 p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                      value={newPropertyKey}
                      onChange={(e) => setNewPropertyKey(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Valor"
                      className="flex-1 p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                      value={newPropertyValue}
                      onChange={(e) => setNewPropertyValue(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-[var(--muted-background)] rounded-md"
                      onClick={handleAddCustomProperty}
                    >
                      +
                    </button>
                  </div>
                  {/* Display custom properties for editing/removal */}
                  {Object.entries(nodeFormData.properties)
                    .filter(
                      ([key]) =>
                        !(
                          key in
                          (NODE_TYPES_CONFIG[nodeFormData.label]?.properties ||
                            {})
                        )
                    )
                    .map(([key, value]) => (
                      <div
                        key={`custom-${key}`}
                        className="flex items-center space-x-2 p-2 border border-dashed border-[var(--card-border)] rounded-md bg-[var(--muted-background)]/50"
                      >
                        <span className="font-medium text-sm capitalize flex-1">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <input
                          type="text"
                          className="flex-1 p-1.5 border border-[var(--card-border)] rounded-md bg-[var(--background)] text-sm"
                          value={String(value)}
                          onChange={(e) =>
                            handlePropertyChange(key, e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="p-1 text-[var(--danger)] hover:text-[var(--danger-hover)]"
                          onClick={() => handleRemoveCustomProperty(key)}
                          title={`Remover ${key}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Adicionando..." : "Adicionar Nó"}
            </button>
          </div>
        </form>
      ) : (
        // Relationship Form
        <form onSubmit={handleSubmitRelationship}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nó de Origem
              </label>
              <select
                className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                value={relationshipFormData.source}
                onChange={(e) => {
                  const selectedNode = existingNodes.find(
                    (node) => (node.id.low || node.id) == e.target.value
                  );

                  setRelationshipFormData({
                    ...relationshipFormData,
                    source: e.target.value,
                    sourceType: selectedNode?.label || "",
                  });
                }}
                required
              >
                <option value="">Selecione um nó</option>
                {existingNodes.map((node) => (
                  <option
                    key={`source-${node.id.low || node.id}`}
                    value={node.id.low || node.id}
                  >
                    {node.properties.name} ({node.label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Relacionamento
              </label>
              <select
                className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                value={relationshipFormData.type}
                onChange={(e) =>
                  setRelationshipFormData({
                    ...relationshipFormData,
                    type: e.target.value,
                  })
                }
                disabled={!relationshipFormData.sourceType}
                required
              >
                <option value="">Selecione um tipo</option>
                {relationshipFormData.sourceType &&
                  NODE_TYPES_CONFIG[relationshipFormData.sourceType] &&
                  NODE_TYPES_CONFIG[
                    relationshipFormData.sourceType
                  ].allowedRelationships.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
              </select>
              {!relationshipFormData.sourceType && (
                <p className="text-xs text-[var(--muted)] mt-1">
                  Selecione um nó de origem para ver os tipos de relacionamento
                  disponíveis
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nó de Destino
              </label>
              <select
                className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
                value={relationshipFormData.target}
                onChange={(e) =>
                  setRelationshipFormData({
                    ...relationshipFormData,
                    target: e.target.value,
                    targetType:
                      existingNodes.find(
                        (node) => (node.id.low || node.id) == e.target.value
                      )?.label || "",
                  })
                }
                required
              >
                <option value="">Selecione um nó</option>
                {existingNodes.map((node) => (
                  <option
                    key={`target-${node.id.low || node.id}`}
                    value={node.id.low || node.id}
                  >
                    {node.properties.name} ({node.label})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
              disabled={isLoading || !relationshipFormData.type}
            >
              {isLoading ? "Adicionando..." : "Adicionar Relacionamento"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
