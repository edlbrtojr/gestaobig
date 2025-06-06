"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { getGraphSchema } from "@/lib/schema";
import { toast } from "@/lib/utils";

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

/**
 * Hook para gerenciar cores do grafo baseadas no schema e tema
 * 
 * Este hook é responsável por:
 * 1. Carregar cores do schema
 * 2. Fornecer cores baseadas no tema atual
 * 3. Calcular cores de contraste para texto
 */
export function useGraphColors() {
  // Estados de cores
  const [nodeColors, setNodeColors] = useState<Record<string, string>>(defaultNodeColors);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  
  // Estado de tema
  const { theme, resolvedTheme } = useTheme();

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

  // Função para obter cores baseadas no tema
  const getThemeColors = () => {
    const isDarkTheme =
      resolvedTheme === "dark" ||
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";

    return {
      textColor: isDarkTheme ? "#FFFFFF" : "#0A0A0A", // White for dark, near-black for light
      mutedForegroundColor: isDarkTheme ? "#A0A0A0" : "#707070", // Lighter gray for dark, darker gray for light
      linkColor: isDarkTheme ? "#606060" : "#C0C0C0", // Visible gray for links in dark, lighter gray in light
      nodeBorderColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--border")
        .trim(),
    };
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

  // Função para obter a cor de um nó pelo tipo
  const getNodeColor = (nodeLabel: string): string => {
    return nodeColors[nodeLabel] || defaultColor;
  };

  // Função para obter a cor do texto para um nó
  const getNodeTextColor = (nodeLabel: string): string => {
    const backgroundColor = getNodeColor(nodeLabel);
    return getContrastColor(backgroundColor);
  };

  return {
    nodeColors,
    isLoadingColors,
    getThemeColors,
    getNodeColor,
    getNodeTextColor,
    getContrastColor,
    defaultColor
  };
} 