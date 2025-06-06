"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Node, Relationship } from "@/types/graph";
import { getGraphSchema } from "@/lib/schema";
import { fetchCompanies, fetchUnits, fetchNodeTypes, fetchConnectionsRange, fetchGraphData } from "@/lib/filter-data";
import { resetConnectionError } from "@/lib/neo4j";

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
  unit: string; // New unit filter
}

// Add helper function to translate node type labels
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
  
  // State for node types and their colors from schema
  const [nodeTypesConfig, setNodeTypesConfig] = useState<Record<string, { color: string }>>({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State para os dados dos filtros carregados do banco de dados
  const [availableCompanies, setAvailableCompanies] = useState<string[]>(["SISTEMA FIEAC"]);
  const [availableUnits, setAvailableUnits] = useState<string[]>(["Todas"]);
  const [connectionsRange, setConnectionsRange] = useState<[number, number]>([0, 0]);
  const [isLoadingFilterData, setIsLoadingFilterData] = useState(true);
  
  // Estado para controlar erros de conexão
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // State para os dados do grafo carregados do banco de dados
  const [graphData, setGraphData] = useState<{ nodes: Node[], relationships: Relationship[] }>({ nodes: [], relationships: [] });

  // Load node types from schema
  useEffect(() => {
    const loadNodeTypes = async () => {
      try {
        setIsLoadingSchema(true);
        setError(null);
        const schema = await getGraphSchema();
        const nodeTypesFromSchema: Record<string, { color: string }> = {};
        
        // Extract colors from schema
        Object.entries(schema.nodeTypes).forEach(([key, nodeType]) => {
          nodeTypesFromSchema[key] = { 
            color: nodeType.color || "#9E9E9E" // Default to gray if no color specified
          };
        });
        
        setNodeTypesConfig(nodeTypesFromSchema);
      } catch (error) {
        console.error("Failed to load node types from schema:", error);
        setError("Failed to load node types. Please try again later.");
        // Fallback to empty object which will be populated from available nodes
      } finally {
        setIsLoadingSchema(false);
      }
    };
    
    loadNodeTypes();
    
    // Listen for schema updates
    const handleSchemaUpdated = () => {
      loadNodeTypes();
    };
    window.addEventListener('schemaUpdated', handleSchemaUpdated);
    
    return () => {
      window.removeEventListener('schemaUpdated', handleSchemaUpdated);
    };
  }, []);
  
  // Carregar dados dos filtros do banco de dados
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setIsLoadingFilterData(true);
        setConnectionError(null);
        
        // Carregar dados em paralelo para melhor performance
        const [companies, units, range, graphDataResult] = await Promise.all([
          fetchCompanies(),
          fetchUnits(),
          fetchConnectionsRange(),
          fetchGraphData()
        ]);
        
        // Verificar se os dados retornados são os padrões (indicando falha de conexão)
        if (
          companies.length === 1 && companies[0] === "SISTEMA FIEAC" &&
          units.length === 1 && units[0] === "Todas" &&
          range[0] === 0 && range[1] === 10 &&
          graphDataResult.nodes.length === 0
        ) {
          setConnectionError("Não foi possível conectar ao banco de dados. Usando valores padrão.");
        }
        
        setAvailableCompanies(companies);
        setAvailableUnits(units);
        setConnectionsRange(range);
        setGraphData(graphDataResult);
      } catch (error) {
        console.error("Erro ao carregar dados dos filtros:", error);
        setConnectionError("Erro ao conectar ao banco de dados. Usando valores padrão.");
      } finally {
        setIsLoadingFilterData(false);
      }
    };
    
    loadFilterData();
  }, []);

  // Função para tentar reconectar ao banco de dados
  const handleRetryConnection = useCallback(() => {
    resetConnectionError();
    setConnectionError(null);
    setIsLoadingFilterData(true);
    
    // Recarregar os dados após um pequeno delay
    setTimeout(() => {
      const loadFilterData = async () => {
        try {
          // Carregar dados em paralelo para melhor performance
          const [companies, units, range, graphDataResult] = await Promise.all([
            fetchCompanies(),
            fetchUnits(),
            fetchConnectionsRange(),
            fetchGraphData()
          ]);
          
          setAvailableCompanies(companies);
          setAvailableUnits(units);
          setConnectionsRange(range);
          setGraphData(graphDataResult);
          
          if (graphDataResult.nodes.length > 0) {
            setConnectionError(null);
          } else {
            setConnectionError("Não foi possível conectar ao banco de dados. Usando valores padrão.");
          }
        } catch (error) {
          console.error("Erro ao recarregar dados dos filtros:", error);
          setConnectionError("Erro ao conectar ao banco de dados. Usando valores padrão.");
        } finally {
          setIsLoadingFilterData(false);
        }
      };
      
      loadFilterData();
    }, 1000);
  }, []);

  // Discover node types from actual nodes if schema doesn't have them
  const discoveredNodeTypes = useMemo(() => {
    // Preferir usar os nós do graphData carregado do banco em vez dos nós passados como prop
    const nodesForDiscovery = graphData.nodes.length > 0 ? graphData.nodes : nodes;
    
    if (!nodesForDiscovery || nodesForDiscovery.length === 0) return {};
    
    // Create a combined set of node types from schema and actual nodes
    const combinedNodeTypes: Record<string, { color: string }> = {...nodeTypesConfig};
    
    // System node types that should never be displayed
    const systemNodeTypes = ["NodeVisibility", "NodePermission"];
    
    // Add any node types from the data that aren't in the schema
    nodesForDiscovery.forEach(node => {
      // Skip system node types and nodes with labels starting with underscore
      if (node.label && 
          !systemNodeTypes.includes(node.label) && 
          !node.label.startsWith('_') && 
          !combinedNodeTypes[node.label]) {
        combinedNodeTypes[node.label] = { color: "#9E9E9E" }; // Default gray
      }
    });
    
    // Also remove any system node types that might be in the nodeTypesConfig
    systemNodeTypes.forEach(type => {
      if (combinedNodeTypes[type]) {
        delete combinedNodeTypes[type];
      }
    });
    
    return combinedNodeTypes;
  }, [graphData.nodes, nodes, nodeTypesConfig]);
  
  // Use either schema node types or discovered node types
  const effectiveNodeTypes = useMemo(() => {
    return Object.keys(discoveredNodeTypes).length > 0 ? discoveredNodeTypes : nodeTypesConfig;
  }, [discoveredNodeTypes, nodeTypesConfig]);

  // Memoize default node types filter to prevent recreating on every render
  const defaultNodeTypesFilter = useMemo(() => {
    return Object.keys(effectiveNodeTypes).reduce((acc, type) => {
      acc[type] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [effectiveNodeTypes]);

  // State for filters
  const [filters, setFilters] = useState<FilterState>(() => ({
    search: "",
    nodeTypes: defaultNodeTypesFilter,
    connectionsRange: connectionsRange,
    showIsolatedNodes: true,
    company: "SISTEMA FIEAC", // Default to SISTEMA FIEAC
    unit: "Todas", // Default to show all units
  }));
  
  // Update filters when node types change
  useEffect(() => {
    if (Object.keys(defaultNodeTypesFilter).length > 0) {
      setFilters(prev => ({
        ...prev,
        nodeTypes: defaultNodeTypesFilter
      }));
    }
  }, [defaultNodeTypesFilter]);
  
  // Atualizar filtros quando os dados do banco forem carregados
  useEffect(() => {
    if (!isLoadingFilterData) {
      setFilters(prev => ({
        ...prev,
        connectionsRange: connectionsRange,
        company: availableCompanies[0] || "SISTEMA FIEAC",
        unit: "Todas"
      }));
    }
  }, [isLoadingFilterData, connectionsRange, availableCompanies]);

  // Track warning message state
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Helper function to check if a filter change would result in no relationships
  const wouldFilterHaveRelationships = useCallback(
    (updatedNodeTypes: Record<string, boolean>): boolean => {
      // Preferir usar os relacionamentos do graphData carregado do banco em vez dos relacionamentos passados como prop
      const relationshipsToCheck = graphData.relationships.length > 0 ? graphData.relationships : relationships;
      const nodesToCheck = graphData.nodes.length > 0 ? graphData.nodes : nodes;
      
      if (!relationshipsToCheck || relationshipsToCheck.length === 0) return true;

      // Quick check - if all node types are deselected, there would be no relationships
      if (Object.values(updatedNodeTypes).every((selected) => !selected)) {
        return false;
      }

      // Get the set of node IDs that would be visible with the updated filter
      const visibleNodeIds = new Set<number>();

      nodesToCheck.forEach((node) => {
        if (updatedNodeTypes[node.label]) {
          const nodeId =
            typeof node.id === "object" && node.id !== null
              ? node.id.low
              : Number(node.id);
          visibleNodeIds.add(nodeId);
        }
      });

      // Check if any relationships would be visible with these visible nodes
      for (const rel of relationshipsToCheck) {
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
    [graphData.nodes, graphData.relationships, nodes, relationships]
  );

  // Initialize filters once nodes and relationships are loaded
  useEffect(() => {
    if (initialized.current) return;

    const nodesToCheck = graphData.nodes.length > 0 ? graphData.nodes : nodes;
    
    if (nodesToCheck.length > 0) {
      initialized.current = true;
      setFilters((prev) => ({
        ...prev,
        connectionsRange: connectionsRange,
      }));
    }
  }, [nodes, graphData.nodes, connectionsRange]);

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

  // Handle company filter change
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompany = e.target.value;
    console.log("Company filter changed to:", newCompany);
    
    setFilters((prev) => {
      const updated = {
        ...prev,
        company: newCompany,
      };
      
      // Apply the filters immediately without debouncing for dropdown changes
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      onFilterChange(updated);
      
      return updated;
    });
  };

  // Handle unit filter change
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    console.log("Unit filter changed to:", newUnit);
    
    setFilters((prev) => {
      const updated = {
        ...prev,
        unit: newUnit,
      };
      
      // Apply the filters immediately without debouncing for dropdown changes
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      onFilterChange(updated);
      
      return updated;
    });
  };

  // Reset filters to default state
  const resetFilters = () => {
    setFilters({
      search: "",
      nodeTypes: defaultNodeTypesFilter,
      connectionsRange: connectionsRange,
      showIsolatedNodes: true,
      company: availableCompanies[0] || "SISTEMA FIEAC",
      unit: "Todas",
    });
  };

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

      {/* Exibir erro de conexão se houver */}
      {connectionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{connectionError}</p>
          </div>
          <button 
            onClick={handleRetryConnection}
            className="mt-2 px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isLoadingFilterData}
          >
            {isLoadingFilterData ? "Tentando reconectar..." : "Tentar reconectar"}
          </button>
        </div>
      )}

      {/* Search Filter */}
      <div className="space-y-1.5">
        <label
          htmlFor="search-filter"
          className="block text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          Pesquisar por Nome, Sigla ou Tipo
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

      {/* Company and Unit Filters (side by side) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Company Filter Dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Empresas</h3>
          </div>
          {isLoadingFilterData ? (
            <div className="w-full h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
          ) : (
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
          )}
        </div>

        {/* Unit Filter Dropdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Unidades</h3>
          </div>
          {isLoadingFilterData ? (
            <div className="w-full h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md"></div>
          ) : (
            <select
              className="w-full rounded-md border bg-background border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={filters.unit}
              onChange={handleUnitChange}
            >
              {availableUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          )}
        </div>
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

        {error ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300">
            {error}
          </div>
        ) : isLoadingSchema ? (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-800 dark:bg-gray-900/20 dark:border-gray-800/30 dark:text-gray-300">
            Carregando tipos de nós...
          </div>
        ) : (
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
                          effectiveNodeTypes[type]?.color || "#9E9E9E",
                      }}
                    ></span>
                    {getNodeTypeLabel(type)}
                  </label>
                </div>
              ))}
          </div>
        )}
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
