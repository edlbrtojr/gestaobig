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

  // Handle search input
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({
        ...prev,
        search: e.target.value,
      }));
    },
    []
  );

  // Toggle showing isolated nodes
  const toggleIsolatedNodes = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      showIsolatedNodes: !prev.showIsolatedNodes,
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    // Create a new filters object with original default values
    const newFilters = {
      search: "",
      nodeTypes: defaultNodeTypesFilter,
      connectionsRange: connectionsRange,
      showIsolatedNodes: true,
    };

    // Update internal state
    setFilters(newFilters);
    setWarningMessage(null);

    // Notify parent component directly
    applyFilters(newFilters);
  }, [defaultNodeTypesFilter, connectionsRange, applyFilters]);

  return (
    <div className="space-y-3">
      {/* Warning message */}
      {warningMessage && (
        <div className="p-2 bg-[var(--warning-background)] border border-[var(--warning)] rounded-md text-xs text-[var(--warning-foreground)]">
          ⚠️ {warningMessage}
        </div>
      )}

      {/* Search */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Pesquisar por Nome
        </label>
        <input
          type="text"
          className="w-full p-2 border border-[var(--card-border)] rounded-md bg-[var(--background)]"
          placeholder="Digite para pesquisar..."
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Node Types */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Tipos de Nós</label>
          <div className="space-x-2">
            <button
              className="text-xs px-2 py-1 rounded-md bg-[var(--muted-background)]"
              onClick={() => toggleAllNodeTypes(true)}
            >
              Todos
            </button>
            <button
              className="text-xs px-2 py-1 rounded-md bg-[var(--muted-background)]"
              onClick={() => toggleAllNodeTypes(false)}
            >
              Nenhum
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          {Object.entries(NODE_TYPES_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`filter-${type}`}
                checked={filters.nodeTypes[type]}
                onChange={() => toggleNodeTypeFilter(type)}
                className="rounded"
              />
              <label
                htmlFor={`filter-${type}`}
                className="flex items-center text-sm truncate"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: config.color }}
                ></span>
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Other Filters */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            id="isolated-nodes"
            checked={filters.showIsolatedNodes}
            onChange={toggleIsolatedNodes}
            className="rounded"
          />
          <label htmlFor="isolated-nodes" className="text-sm">
            Mostrar nós isolados
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      <button
        className="w-full mt-2 px-4 py-2 bg-[var(--muted-background)] hover:bg-[var(--card-border)] rounded-md transition-colors text-sm"
        onClick={resetFilters}
      >
        Limpar Filtros
      </button>
    </div>
  );
}
