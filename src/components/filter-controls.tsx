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
  nodePriorities: string[]; // Ordem de prioridade dos tipos de nós
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
    const systemNodeTypes = ["NodeVisibility", "NodePermission", "User", "UserPermission", "AccessRole", "__inAppSchemaConfig", "AdminResetEvent"];
    
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
    // Criar uma cópia profunda para não modificar os originais
    let nodeTypes = Object.keys(discoveredNodeTypes).length > 0 ? {...discoveredNodeTypes} : {...nodeTypesConfig};
    
    // Remover explicitamente quaisquer tipos com prefixo underscore
    Object.keys(nodeTypes).forEach(key => {
      if (key.startsWith('_')) {
        delete nodeTypes[key];
      }
    });
    
    return nodeTypes;
  }, [discoveredNodeTypes, nodeTypesConfig]);

  // Memoize default node types filter to prevent recreating on every render
  const defaultNodeTypesFilter = useMemo(() => {
    return Object.keys(effectiveNodeTypes)
      .filter(type => !type.startsWith('_')) // Filtrar explicitamente nós que começam com underscore
      .reduce((acc, type) => {
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
    nodePriorities: [], // Lista vazia inicialmente
  }));
  
  // Update filters when node types change
  useEffect(() => {
    if (Object.keys(defaultNodeTypesFilter).length > 0) {
      setFilters(prev => ({
        ...prev,
        nodeTypes: defaultNodeTypesFilter
      }));
      
      // Inicializar as prioridades com os tipos disponíveis se ainda não estiverem definidas
      setNodePriorities(prevPriorities => {
        if (prevPriorities.length === 0) {
          return Object.keys(defaultNodeTypesFilter).filter(type => !type.startsWith('_'));
        }
        
        // Manter prioridades existentes e adicionar novos tipos ao final
        const existingSet = new Set(prevPriorities);
        const updatedPriorities = [...prevPriorities];
        
        Object.keys(defaultNodeTypesFilter)
          .filter(type => !type.startsWith('_') && !existingSet.has(type))
          .forEach(newType => updatedPriorities.push(newType));
          
        return updatedPriorities;
      });
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
  
  // Estado para controlar o editor de prioridades
  const [showPriorityEditor, setShowPriorityEditor] = useState<boolean>(false);
  
  // Estado para armazenar a ordem de prioridade dos tipos de nós
  const [nodePriorities, setNodePriorities] = useState<string[]>([]);

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
      nodePriorities: nodePriorities, // Manter as prioridades atuais
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
          <div className="flex gap-2">
            <button
              onClick={() => setShowPriorityEditor(!showPriorityEditor)}
              className={`text-xs px-2.5 py-1.5 flex items-center gap-1.5 ${showPriorityEditor ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/70'} rounded-md border transition-colors`}
              title="Configurar prioridade de estilos para nós com múltiplos tipos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h.01"></path>
                <path d="M7 20v-4"></path>
                <path d="M12 20v-8"></path>
                <path d="M17 20v-6"></path>
                <path d="M22 20V8"></path>
              </svg>
              Prioridades
              {nodePriorities.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 w-4 h-4 text-[10px] font-medium text-white">
                  {nodePriorities.length}
                </span>
              )}
            </button>
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
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 max-h-[240px] overflow-y-auto pr-1 py-1">
            {Object.keys(filters.nodeTypes)
              .filter(type => !type.startsWith('_')) // Filtrar explicitamente nós que começam com underscore
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
          
          {showPriorityEditor && (
            <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-indigo-900 rounded-md shadow-sm">
              <div className="mb-3 flex justify-between items-center">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 20h.01"></path>
                    <path d="M7 20v-4"></path>
                    <path d="M12 20v-8"></path>
                    <path d="M17 20v-6"></path>
                    <path d="M22 20V8"></path>
                  </svg>
                  Prioridade de Estilos
                </h4>
                <button
                  onClick={() => setShowPriorityEditor(false)}
                  className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
              <div className="p-3 mb-3 bg-white dark:bg-gray-800 rounded-md border border-blue-100 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <strong className="font-medium">Como funciona:</strong> Quando um nó possui múltiplos tipos, o tipo com maior prioridade (mais próximo do topo) determinará a aparência visual do nó no grafo.
                </p>
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {nodePriorities.map((type, index) => {
                  // Verificar se o tipo ainda existe nos nodeTypes filtrados
                  if (!effectiveNodeTypes[type]) return null;
                  
                  return (
                    <div 
                      key={type}
                      className={`flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-900 border ${index === 0 ? 'border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'} rounded-md cursor-move transition-all hover:shadow-md ${index === 0 ? 'shadow-sm' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', type);
                        e.dataTransfer.effectAllowed = 'move';
                        e.currentTarget.classList.add('opacity-50');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50');
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
                        const draggedType = e.dataTransfer.getData('text/plain');
                        if (draggedType !== type) {
                          const newPriorities = [...nodePriorities];
                          const draggedIndex = newPriorities.indexOf(draggedType);
                          const targetIndex = newPriorities.indexOf(type);
                          newPriorities.splice(draggedIndex, 1);
                          newPriorities.splice(targetIndex, 0, draggedType);
                          
                          setNodePriorities(newPriorities);
                          
                          // Atualizar o filtro com as novas prioridades
                          setFilters(prev => ({
                            ...prev,
                            nodePriorities: newPriorities
                          }));
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-center justify-center w-6">
                          <span className={`text-xs font-medium ${index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            {index === 0 ? '1º' : `${index + 1}º`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="inline-block w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600" 
                            style={{ backgroundColor: effectiveNodeTypes[type]?.color || "#9E9E9E" }}
                          ></span>
                          <span className={`${index === 0 ? 'font-medium' : ''}`}>{getNodeTypeLabel(type)}</span>
                          {index === 0 && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            if (index > 0) {
                              const newPriorities = [...nodePriorities];
                              [newPriorities[index], newPriorities[index - 1]] = 
                                [newPriorities[index - 1], newPriorities[index]];
                              
                              setNodePriorities(newPriorities);
                              
                              // Atualizar o filtro com as novas prioridades
                              setFilters(prev => ({
                                ...prev,
                                nodePriorities: newPriorities
                              }));
                            }
                          }}
                          className="text-xs p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                          disabled={index === 0}
                          title="Mover para cima"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15-6-6-6 6"/>
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            if (index < nodePriorities.length - 1) {
                              const newPriorities = [...nodePriorities];
                              [newPriorities[index], newPriorities[index + 1]] = 
                                [newPriorities[index + 1], newPriorities[index]];
                              
                              setNodePriorities(newPriorities);
                              
                              // Atualizar o filtro com as novas prioridades
                              setFilters(prev => ({
                                ...prev,
                                nodePriorities: newPriorities
                              }));
                            }
                          }}
                          className="text-xs p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                          disabled={index === nodePriorities.length - 1}
                          title="Mover para baixo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-2 border-t border-blue-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <p className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  Arraste para reordenar ou use os botões para ajustar a prioridade
                </p>
              </div>
            </div>
          )}
        </>
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
