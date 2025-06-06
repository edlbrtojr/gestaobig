"use client";

import React, { createContext, useContext, useRef, RefObject } from "react";
import * as d3 from "d3";
import { D3Node, D3Link, GraphData } from "@/types/graph";

// Tipo para armazenar o estado de seleção
export interface GraphSelectionState {
  selectedNode: D3Node | null;
  selectedRelationship: D3Link | null;
  connectedNodes: number[];
}

// Tipo para armazenar o estado de visualização
export interface GraphViewState {
  viewMode: "standard" | "search" | "selection";
  showCategorized: boolean;
  enableFisheye: boolean;
  distortionCenter: { x: number; y: number } | null;
}

// Tipo para o estado de cores e temas
export interface GraphColorsState {
  nodeColors: Record<string, string>;
  isLoadingColors: boolean;
  defaultColor: string;
  getThemeColors: () => {
    textColor: string;
    mutedForegroundColor: string;
    linkColor: string;
    nodeBorderColor: string;
  };
}

// Interface principal do contexto do grafo
export interface GraphContextType {
  // Referências - corrigidas para permitir null explicitamente
  svgRef: RefObject<SVGSVGElement | null>;
  simulationRef: RefObject<d3.Simulation<D3Node, D3Link> | null>;
  
  // Dados
  data: GraphData;
  processedData: { nodes: D3Node[]; relationships: D3Link[] } | null;
  nodeMap: Map<number, D3Node>;
  hierarchyLevels: Record<number, number>;
  categorizedNodes: Record<string, D3Node[]>;
  groupCentersMap: Record<string, { x: number; y: number; r: number }>;
  
  // Estado de seleção
  selection: GraphSelectionState;
  setSelectedNode: (node: D3Node | null) => void;
  setSelectedRelationship: (relationship: D3Link | null) => void;
  setConnectedNodes: (nodes: number[]) => void;
  
  // Estado de visualização
  view: GraphViewState;
  setViewMode: (mode: "standard" | "search" | "selection") => void;
  setShowCategorized: (show: boolean) => void;
  setEnableFisheye: (enable: boolean) => void;
  setDistortionCenter: (center: { x: number; y: number } | null) => void;
  
  // Estado de cores
  colors: GraphColorsState;
  
  // Estado de inicialização
  initialized: boolean;
  setInitialized: (initialized: boolean) => void;
  
  // Estado de busca
  searchHighlight?: string;
  matchingNodeIds: Set<number>;
  
  // Funções auxiliares
  getThemeColors: () => {
    textColor: string;
    mutedForegroundColor: string;
    linkColor: string;
    nodeBorderColor: string;
  };
  getNodeRadius: (nodeId: number) => number;
  
  // Estado de edição
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isEditingRelationship: boolean;
  setIsEditingRelationship: (editing: boolean) => void;
  formChanged: boolean;
  setFormChanged: (changed: boolean) => void;
}

// Criar o contexto com valor inicial undefined
export const GraphContext = createContext<GraphContextType | undefined>(undefined);

// Hook personalizado para acessar o contexto
export function useGraphContext() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphContext deve ser usado dentro de um GraphProvider");
  }
  return context;
} 