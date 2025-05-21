"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Node, Relationship } from "@/types/graph";

// Node types with their colors for filtering
const NODE_TYPES_CONFIG: Record<string, { color: string }> = {
  Risco: { color: "#FF5252" }, // Red
  PlanoDeAcao: { color: "#4CAF50" }, // Green
  Acao: { color: "#2196F3" }, // Blue
  Estrategia: { color: "#FFC107" }, // Amber
  Visao: { color: "#9C27B0" }, // Purple
  Missao: { color: "#673AB7" }, // Deep Purple
  Oportunidade: { color: "#FF9800" }, // Orange
  Departamento: { color: "#009688" }, // Teal
  Projeto: { color: "#3F51B5" }, // Indigo
  Objetivo: { color: "#E91E63" }, // Pink
  KPI: { color: "#795548" }, // Brown
  Stakeholder: { color: "#9E9E9E" }, // Gray
  Tecnologia: { color: "#00BCD4" }, // Cyan
  Produto: { color: "#8BC34A" }, // Light Green
  Mercado: { color: "#FFEB3B" }, // Yellow
  Competidor: { color: "#FF5722" }, // Deep Orange
};

interface FilterControlsProps {
  onFilterChange: (filters: FilterState) => void;
  nodes: Node[];
  relationships: Relationship[];
}

export interface FilterState {
  search: string;
  nodeTypes: Record<string, boolean>;
  connectionsRange: [number, number];
  showIsolatedNodes: boolean;
  company: string;
}

export default function FilterControls({
  onFilterChange,
  nodes,
  relationships,
}: FilterControlsProps) {
  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if filters have been initialized
  const initialized = useRef(false);

  // Extract unique companies from nodes
  const availableCompanies = useMemo(() => {
    if (!nodes || nodes.length === 0) return ["SISTEMA FIEAC"]; // Default to SISTEMA FIEAC even if no nodes

    const companies = new Set<string>();
    // Don't add empty option anymore

    nodes.forEach((node) => {
      if (node.properties && node.properties.company) {
        // Handle cases where a node belongs to multiple companies (comma-separated)
        const nodeCompanies = node.properties.company.split(",");
        nodeCompanies.forEach((company: string) =>
          companies.add(company.trim())
        );
      }
    });

    // Always ensure SISTEMA FIEAC is included
    companies.add("SISTEMA FIEAC");

    return Array.from(companies).sort();
  }, [nodes]);

  // Memoize default node types filter to prevent recreating on every render
  const defaultNodeTypesFilter = useMemo(() => {
    return Object.keys(NODE_TYPES_CONFIG).reduce((acc, type) => {
      acc[type] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, []);

  // Find the range of connections - memoized to prevent recalculation on every render
  const connectionsRange = useMemo((): [number, number] => {
    if (!nodes || nodes.length === 0) return [0, 0];

    // For simplicity, we'll just use the node count as max range
    // In a real scenario, we'd count actual relationships
    return [0, nodes.length > 0 ? nodes.length : 10];
  }, [nodes]);

  // State for filters
  const [filters, setFilters] = useState<FilterState>(() => ({
    search: "",
    nodeTypes: defaultNodeTypesFilter,
    connectionsRange: connectionsRange,
    showIsolatedNodes: true,
    company: "SISTEMA FIEAC", // Default to SISTEMA FIEAC
  }));

  // Track warning message state
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Helper function to check if a filter change would result in no relationships
  const wouldFilterHaveRelationships = useCallback(
    (updatedNodeTypes: Record<string, boolean>): boolean => {
      if (!relationships || relationships.length === 0) return true;

      // Quick check - if all node types are deselected, there would be no relationships
      if (Object.values(updatedNodeTypes).every((selected) => !selected)) {
        return false;
      }

      // Get the set of node IDs that would be visible with the updated filter
      const visibleNodeIds = new Set<number>();

      nodes.forEach((node) => {
        if (updatedNodeTypes[node.label]) {
          const nodeId =
            typeof node.id === "object" && node.id !== null
              ? node.id.low
              : Number(node.id);
          visibleNodeIds.add(nodeId);
        }
      });

      // Check if any relationships would be visible with these visible nodes
      for (const rel of relationships) {
        const sourceId =
          typeof rel.source === "object" && rel.source !== null
            ? rel.source.low
            : Number(rel.source);
        const targetId =
          typeof rel.target === "object" && rel.target !== null
            ? rel.target.low
            : Number(rel.target);

        if (visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)) {
          // Found at least one visible relationship
          return true;
        }
      }

      // No visible relationships found
      return false;
    },
    [nodes, relationships]
  );

  // Initialize filters once nodes and relationships are loaded
  useEffect(() => {
    if (initialized.current) return;

    if (nodes.length > 0) {
      initialized.current = true;
      setFilters((prev) => ({
        ...prev,
        connectionsRange: connectionsRange,
      }));
    }
  }, [nodes, connectionsRange]);

  // Debounced filter application function to reduce unnecessary updates
  const applyFilters = useCallback(
    (newFilters: FilterState) => {
      // Skip the initial render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      // Clear previous warning
      setWarningMessage(null);

      // Apply the filters to the parent component
      onFilterChange(newFilters);
    },
    [onFilterChange]
  );

  // Handle debounced filter changes
  const debouncedFilterChange = useCallback(
    (newFilters: FilterState) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        applyFilters(newFilters);
        // Clear the timer reference
        debounceTimerRef.current = null;
      }, 250); // 250ms debounce
    },
    [applyFilters]
  );

  // Effect for when filters change
  useEffect(() => {
    // Don't return early on first render, we need to apply initial filters
    // if (isFirstRender.current) return;

    // Apply filters directly on first render to ensure initial state is applied
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Apply initial filters directly
      onFilterChange(filters);
      return;
    }

    debouncedFilterChange(filters);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, debouncedFilterChange, onFilterChange]);

  // Toggle a node type filter with safeguards
  const toggleNodeTypeFilter = useCallback(
    (type: string) => {
      // Create the updated node types filter
      const updatedNodeTypes = {
        ...filters.nodeTypes,
        [type]: !filters.nodeTypes[type],
      };

      // Check if toggling this filter would result in no visible relationships
      if (!wouldFilterHaveRelationships(updatedNodeTypes)) {
        setWarningMessage(
          "Esta seleção resultaria em nenhum relacionamento visível. Selecione pelo menos um par de nós conectados."
        );
        return; // Don't apply the filter
      }

      // Apply the filter if it would still show relationships
      setFilters((prev) => ({
        ...prev,
        nodeTypes: updatedNodeTypes,
      }));
    },
    [filters.nodeTypes, wouldFilterHaveRelationships]
  );

  // Toggle all node type filters with safeguards
  const toggleAllNodeTypes = useCallback((value: boolean) => {
    // If we're trying to deselect all, show warning and don't allow
    if (!value) {
      setWarningMessage(
        "Não é possível desmarcar todos os tipos de nós. Pelo menos um par de nós conectados deve estar visível."
      );
      return;
    }

    // If we're selecting all, that's always safe
    setFilters((prev) => ({
      ...prev,
      nodeTypes: Object.keys(prev.nodeTypes).reduce((acc, type) => {
        acc[type] = value;
        return acc;
      }, {} as Record<string, boolean>),
    }));
  }, []);

  // Handle search filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  // Reset filters to default state
  const resetFilters = () => {
    setFilters({
      search: "",
      nodeTypes: defaultNodeTypesFilter,
      connectionsRange: connectionsRange,
      showIsolatedNodes: true,
      company: "SISTEMA FIEAC", // Reset to SISTEMA FIEAC
    });
  };

  // Handle company filter change
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      company: e.target.value,
    }));
  };

  // Apply filters to parent component (actual filtering logic happens in the parent)
  useEffect(() => {
    // Only consider company property if the node has one
    // Special case: SISTEMA FIEAC should show all nodes
    onFilterChange({
      ...filters,
      company: filters.company,
    });
  }, [filters, onFilterChange]);

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="space-y-1.5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Filtros
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Refine a visualização do grafo
        </p>
      </div>

      {/* Search Filter */}
      <div className="space-y-1.5">
        <label
          htmlFor="search-filter"
          className="block text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          Pesquisar por Nome
        </label>
        <div className="relative">
          <input
            type="text"
            id="search-filter"
            placeholder="Digite para pesquisar..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-800"></div>
      
      {/* Company Filter Dropdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Empresas</h3>
        </div>
        <select
          className="w-full rounded-md border bg-background border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filters.company}
          onChange={handleCompanyChange}
        >
          {availableCompanies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </select>
      </div>



      {/* Node Types Filter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Tipos de Nós
          </label>
          <button
            onClick={() => {
              // Always select all nodes
              const newNodeTypes = Object.keys(filters.nodeTypes).reduce(
                (acc, type) => {
                  acc[type] = true;
                  return acc;
                },
                {} as Record<string, boolean>
              );

              setWarningMessage(null);
              setFilters((prev) => ({
                ...prev,
                nodeTypes: newNodeTypes,
              }));
            }}
            className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
          >
            Marcar todos
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 max-h-[240px] overflow-y-auto pr-1 py-1">
          {Object.keys(filters.nodeTypes)
            .sort()
            .map((type) => (
              <div key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`node-type-${type}`}
                  checked={filters.nodeTypes[type]}
                  onChange={() => toggleNodeTypeFilter(type)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:ring-offset-0"
                />
                <label
                  htmlFor={`node-type-${type}`}
                  className="text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        NODE_TYPES_CONFIG[type]?.color || "#9E9E9E",
                    }}
                  ></span>
                  {type}
                </label>
              </div>
            ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-800"></div>

      {/* Show Isolated Nodes Toggle */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="show-isolated-nodes"
          className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          Mostrar nós isolados
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="show-isolated-nodes"
            checked={filters.showIsolatedNodes}
            onChange={() => {
              console.log(
                "Toggle clicked, current value:",
                filters.showIsolatedNodes
              );
              setFilters((prev) => {
                const newState = {
                  ...prev,
                  showIsolatedNodes: !prev.showIsolatedNodes,
                };
                console.log(
                  "Setting new isolated nodes state:",
                  newState.showIsolatedNodes
                );
                return newState;
              });
            }}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 dark:peer-checked:bg-blue-500"></div>
        </label>
      </div>

      {/* Warning message */}
      {warningMessage && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/30 dark:text-yellow-300 flex items-start gap-2">
          <svg
            className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mt-0.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Reset filters button */}
      <div className="flex justify-end mt-2">
        <button
          onClick={resetFilters}
          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 transition-colors"
        >
          Redefinir filtros
        </button>
      </div>
    </div>
  );
}
