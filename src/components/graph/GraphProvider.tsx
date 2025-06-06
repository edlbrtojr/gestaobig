"use client";

import React, { useState, useRef, useMemo, useEffect, ReactNode } from "react";
import * as d3 from "d3";
import { useTheme } from "@/components/theme-provider";
import { getGraphSchema } from "@/lib/schema";
import { toast } from "@/lib/utils";
import { D3Node, D3Link, GraphData } from "@/types/graph";
import { 
  GraphContext, 
  GraphContextType, 
  GraphSelectionState, 
  GraphViewState, 
  GraphColorsState 
} from "./GraphContext";

// Define as cores padrão para nós (será substituído por cores do schema quando disponíveis)
const defaultNodeColors: Record<string, string> = {
  Risco: "#F44336", // Red
  PlanoDeAcao: "#4CAF50", // Green
  Acao: "#2196F3", // Blue
  Estrategia: "#FFC107", // Amber
  Visao: "#9C27B0", // Purple
  Missao: "#673AB7", // Deep Purple
  Oportunidade: "#FF9800", // Orange
  Unidade: "#009688", // Teal
  Projeto: "#3F51B5", // Indigo
  Objetivo: "#E91E63", // Pink
  KPI: "#795548", // Brown
  Stakeholder: "#BDBDBD", // Light Gray
  Tecnologia: "#00BCD4", // Cyan
  Produto: "#8BC34A", // Light Green
  Mercado: "#FFEB3B", // Yellow
  Competidor: "#FF5722", // Deep Orange
};

// Default color for unknown node types
const defaultColor = "#757575"; // Darker Gray for unknowns

interface GraphProviderProps {
  children: ReactNode;
  data: GraphData;
  searchTerm?: string;
  onNodeSelected?: (node: D3Node | null) => void;
  onRelationshipSelected?: (relationship: D3Link | null) => void;
}

// Define um poll de schema para atualização das cores
const setupSchemaPolling = (callback: () => void) => {
  // Poll the schema API endpoint
  const pollSchema = async () => {
    try {
      const response = await fetch("/api/schema");
      if (response.ok) {
        callback();
      } else {
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error polling schema:", error);
    }
  };

  // Check only once every 5 minutes to reduce API calls
  const interval = setInterval(pollSchema, 300000);

  return () => clearInterval(interval);
};

// Define group centers for semantic clustering
const calculateGroupCenters = (
  width: number,
  height: number,
  labels: string[]
): Record<string, { x: number; y: number; r: number }> => {
  const centers: Record<string, { x: number; y: number; r: number }> = {};
  const centerX = width / 2;
  const centerY = height / 2;

  // Base distance from center for the group orbits
  const baseRadius = Math.min(width, height) * 0.25;

  // Distribute the labels evenly in a circle
  labels.forEach((label, i) => {
    const angle = (i / labels.length) * 2 * Math.PI;
    const x = centerX + baseRadius * Math.cos(angle);
    const y = centerY + baseRadius * Math.sin(angle);
    const r = baseRadius * 0.4;

    centers[label] = { x, y, r };
  });

  return centers;
};

// Helper function to get contrast color for text
const getContrastColor = (backgroundColor: string): string => {
  // Convert hex to RGB
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export function GraphProvider({ 
  children, 
  data, 
  searchTerm,
  onNodeSelected,
  onRelationshipSelected 
}: GraphProviderProps) {
  // Referências - corrigido os tipos para corresponder à GraphContextType
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  
  // Estado de tema
  const { theme, resolvedTheme } = useTheme();
  
  // Estados de dados
  const [initialized, setInitialized] = useState(false);
  const [hierarchyLevels, setHierarchyLevels] = useState<Record<number, number>>({});
  const [categorizedNodes, setCategorizedNodes] = useState<Record<string, D3Node[]>>({});
  const [groupCentersMap, setGroupCentersMap] = useState<Record<string, { x: number; y: number; r: number }>>({});

  // Estados de seleção
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<D3Link | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<number[]>([]);
  
  // Estados de visualização
  const [viewMode, setViewMode] = useState<"standard" | "search" | "selection">("standard");
  const [showCategorized, setShowCategorized] = useState(false);
  const [enableFisheye, setEnableFisheye] = useState(false);
  const [distortionCenter, setDistortionCenter] = useState<{ x: number; y: number } | null>(null);
  
  // Estados de edição
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

  // Estados de cores
  const [nodeColors, setNodeColors] = useState<Record<string, string>>(defaultNodeColors);
  const [isLoadingColors, setIsLoadingColors] = useState(true);

  // Armazena IDs de nós que correspondem à busca
  const matchingNodeIdsRef = useRef<Set<number>>(new Set());
  
  // Calcular dados processados do grafo usando memo
  const [processedData, nodeMap] = useMemo(() => {
    if (!data.nodes.length) return [null, new Map<number, D3Node>()];
    
    // Create node map only with valid nodes (excluding system nodes)
    const map = new Map<number, D3Node>();

    // System node types that should never be displayed
    const systemNodeTypes = ["NodeVisibility", "NodePermission"];

    // Process nodes - filter out system nodes and nodes with labels starting with underscore
    const processedNodes = data.nodes
      .filter((node) => {
        // Exclude specific system node types
        if (systemNodeTypes.includes(node.label)) return false;
        // Exclude any node whose label starts with underscore (system node)
        if (node.label && node.label.startsWith('_')) return false;
        return true;
      })
      .map((node) => {
        const nodeId =
          typeof node.id === "object" && node.id !== null
            ? node.id.low
            : Number(node.id);

        const d3Node = {
          ...node,
          id: nodeId,
        } as D3Node;
        map.set(nodeId, d3Node);
        return d3Node;
      });

    // Filter out relationships that involve system nodes
    const filteredRelationships = data.relationships.filter((rel) => {
      const sourceId =
        typeof rel.source === "object" && rel.source !== null
          ? rel.source.low
          : Number(rel.source);
      const targetId =
        typeof rel.target === "object" && rel.target !== null
          ? rel.target.low
          : Number(rel.target);

      // Check if the source or target node is in our filtered set
      return map.has(sourceId) && map.has(targetId);
    }) as D3Link[];

    return [
      {
        nodes: processedNodes,
        relationships: filteredRelationships,
      },
      map,
    ];
  }, [data]);

  // Função para determinar cores baseadas no tema
  const getThemeColors = () => {
    const isDarkTheme =
      resolvedTheme === "dark" ||
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";

    return {
      textColor: isDarkTheme ? "#FFFFFF" : "#0A0A0A", // Branco para tema escuro, preto para tema claro
      mutedForegroundColor: isDarkTheme ? "#A0A0A0" : "#707070", // Cinza claro para tema escuro, cinza escuro para tema claro
      linkColor: isDarkTheme ? "#606060" : "#C0C0C0", // Cinza visível para links no tema escuro, cinza claro no tema claro
      nodeBorderColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--border")
        .trim(),
    };
  };

  // Função para calcular raio de nó baseado em conexões
  const getNodeRadius = (nodeId: number): number => {
    // Esta função será implementada quando tivermos o mapa de contagem de conexões 
    // Por enquanto retorna um valor constante (será atualizada pelo hook useGraphData)
    return 22; // valor padrão
  };

  // Carregar cores do schema
  const loadNodeColors = async () => {
    if (isLoadingColors) return;

    try {
      setIsLoadingColors(true);

      const schema = await getGraphSchema();
      if (!schema || !schema.nodeTypes) {
        throw new Error("Invalid schema format received from API");
      }

      const newColors: Record<string, string> = {};

      // Extract colors from schema
      Object.entries(schema.nodeTypes).forEach(([key, nodeType]) => {
        if (nodeType.color) {
          newColors[key] = nodeType.color;
          newColors[nodeType.label] = nodeType.color;
        } else {
          throw new Error(`No color defined for node type: ${key}`);
        }
      });

      if (Object.keys(newColors).length === 0) {
        throw new Error("No node colors defined in schema");
      }

      // Deep comparison to check if colors actually changed
      let colorsChanged = false;
      const allKeys = Array.from(
        new Set([...Object.keys(nodeColors), ...Object.keys(newColors)])
      );

      for (const key of allKeys) {
        if (nodeColors[key] !== newColors[key]) {
          colorsChanged = true;
          break;
        }
      }

      if (colorsChanged) {
        setNodeColors(newColors);
        setInitialized(false);
      }
    } catch (error) {
      console.error("Failed to load node colors from schema:", error);
      toast.error(
        `Failed to load node colors: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoadingColors(false);
    }
  };

  // Effect para atualizar cores quando o schema muda
  useEffect(() => {
    if (isLoadingColors) return;

    let isMounted = true;

    // Handler for custom event
    const handleSchemaUpdated = () => {
      if (isMounted) loadNodeColors();
    };

    // Listen for direct schema update events
    window.addEventListener("schemaUpdated", handleSchemaUpdated);

    // Set up polling for schema changes
    const cleanupPolling = setupSchemaPolling(() => {
      if (isMounted) loadNodeColors();
    });

    // Initial load of colors
    if (
      !Object.keys(nodeColors).length ||
      Object.keys(nodeColors).length === Object.keys(defaultNodeColors).length
    ) {
      loadNodeColors();
    }

    return () => {
      isMounted = false;
      window.removeEventListener("schemaUpdated", handleSchemaUpdated);
      cleanupPolling();
    };
  }, []);

  // Reinicializar quando o tema muda
  useEffect(() => {
    setInitialized((prev) => {
      return prev ? false : prev;
    });
  }, [theme, resolvedTheme]);

  // Agrupa os estados relacionados
  const selection: GraphSelectionState = {
    selectedNode,
    selectedRelationship,
    connectedNodes
  };
  
  const view: GraphViewState = {
    viewMode,
    showCategorized,
    enableFisheye,
    distortionCenter
  };
  
  const colors: GraphColorsState = {
    nodeColors,
    isLoadingColors,
    defaultColor,
    getThemeColors
  };

  // Criar o objeto de contexto
  const contextValue: GraphContextType = {
    svgRef,
    simulationRef,
    data,
    processedData,
    nodeMap,
    hierarchyLevels,
    categorizedNodes,
    groupCentersMap,
    selection: {
      selectedNode,
      selectedRelationship,
      connectedNodes
    },
    setSelectedNode,
    setSelectedRelationship,
    setConnectedNodes,
    view: {
      viewMode,
      showCategorized,
      enableFisheye,
      distortionCenter
    },
    setViewMode,
    setShowCategorized,
    setEnableFisheye,
    setDistortionCenter,
    colors: {
      nodeColors,
      isLoadingColors,
      defaultColor,
      getThemeColors
    },
    initialized,
    setInitialized,
    searchHighlight: searchTerm,
    matchingNodeIds: matchingNodeIdsRef.current,
    getThemeColors,
    getNodeRadius,
    isEditing,
    setIsEditing,
    isEditingRelationship,
    setIsEditingRelationship,
    formChanged,
    setFormChanged
  };

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  );
} 