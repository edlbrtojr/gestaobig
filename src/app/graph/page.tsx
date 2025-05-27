"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import GraphContainer from "@/components/graph-container";
import FilterControls, { FilterState } from "@/components/filter-controls";
import { GraphData } from "@/types/graph";
import AddForm from "@/components/add-form";
import {
  Waypoints,
  Filter,
  Plus,
  X,
  GitBranch,
  Shield,
  Compass,
} from "lucide-react";
import Image from "next/image";
import { fetchGraphDataWithPermissions } from "@/lib/graph-with-permissions";

// Utility function to get node color based on node type
const getNodeColor = (nodeType: string): string => {
  const colorMap: Record<string, string> = {
    Person: "#4f46e5", // indigo-600
    Organization: "#0891b2", // cyan-600
    Location: "#16a34a", // green-600
    Event: "#d97706", // amber-600
    Resource: "#dc2626", // red-600
    Concept: "#8b5cf6", // violet-600
    // Add more node types and colors as needed
  };

  return colorMap[nodeType] || "#6b7280"; // Default to gray-500
};

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    relationships: [],
  });
  const [filteredData, setFilteredData] = useState<GraphData>({
    nodes: [],
    relationships: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  // Node selection states
  const [selectedNode, setSelectedNode] = useState<any>(null);
  // Add relationship selection state
  const [selectedRelationship, setSelectedRelationship] = useState<any>(null);
  // Add nodeConnections state to track connections of the selected node
  const [nodeConnections, setNodeConnections] = useState<
    Array<{
      node: any;
      type: string;
      direction: "incoming" | "outgoing";
    }>
  >([]);
  // Add filter state to track current filters
  const [currentFilters, setCurrentFilters] = useState<FilterState | null>(
    null
  );

  // Create a ref to track if we're already fetching data to prevent multiple calls
  const isFetchingRef = useRef(false);
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Flag to track if this is the first filter update
  const isFirstFilterUpdate = useRef(true);

  // Debounce timer for filter changes
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to extract node ID from Neo4j format
  const extractNodeId = useCallback((nodeId: any): number => {
    return typeof nodeId === "object" && nodeId !== null
      ? nodeId.low
      : Number(nodeId);
  }, []);

  // Extract relationship IDs consistently
  const extractRelationshipIds = useCallback(
    (rel: any) => {
      const sourceId = extractNodeId(rel.source);
      const targetId = extractNodeId(rel.target);
      return { sourceId, targetId };
    },
    [extractNodeId]
  );

  // Apply filters function - use a stable implementation that doesn't depend on currentFilters
  const applyFilters = useCallback(
    (filters: FilterState, data: GraphData): GraphData => {
      // Avoid unnecessary filter application if data is empty
      if (!data.nodes.length) {
        return data;
      }

      // Filter nodes based on node types and company (NOT search term anymore)
      let filteredNodes = data.nodes.filter((node) => {
        // Check if node type is selected in filters
        if (!filters.nodeTypes[node.label]) return false;

        // Handle company filter: if SISTEMA FIEAC is selected, show all nodes
        // Otherwise only show nodes that have the selected company (accounting for comma-separated values)
        if (filters.company && filters.company !== "SISTEMA FIEAC") {
          // Guard against undefined company property
          if (!node.properties?.company) return false;

          // Handle comma-separated company values
          const nodeCompanies = node.properties.company
            .split(",")
            .map((c: string) => c.trim());
          if (!nodeCompanies.includes(filters.company)) {
            return false;
          }
        }

        return true;
      });

      // Get IDs of filtered nodes for relationship filtering
      const filteredNodeIds = new Set(
        filteredNodes.map((node) => extractNodeId(node.id))
      );

      // Filter relationships to only include those between filtered nodes
      let filteredRelationships = data.relationships.filter((rel) => {
        const { sourceId, targetId } = extractRelationshipIds(rel);
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });

      // If we don't want to show isolated nodes, filter out nodes with no connections
      if (!filters.showIsolatedNodes) {
        console.log(
          "Filtering out isolated nodes, showIsolatedNodes =",
          filters.showIsolatedNodes
        );

        // Get all nodes that have connections in filtered relationships
        const connectedNodeIds = new Set<number>();

        // We need to check the original relationships to find all nodes that have any connections
        // This ensures we're correctly identifying isolated nodes
        data.relationships.forEach((rel) => {
          const { sourceId, targetId } = extractRelationshipIds(rel);

          // Only add nodes that are in our filtered node set
          // This maintains the other filters while correctly identifying "isolated" status
          const sourceNode = filteredNodeIds.has(sourceId);
          const targetNode = filteredNodeIds.has(targetId);

          if (sourceNode) connectedNodeIds.add(sourceId);
          if (targetNode) connectedNodeIds.add(targetId);
        });

        // Only keep nodes that have connections
        const connectedNodes = filteredNodes.filter((node) => {
          const nodeId = extractNodeId(node.id);
          return connectedNodeIds.has(nodeId);
        });

        filteredNodes = connectedNodes;
      }

      const result = {
        nodes: filteredNodes,
        relationships: filteredRelationships,
      };

      return result;
    },
    [extractNodeId, extractRelationshipIds]
  );

  // Memoize filtered data to prevent unnecessary recalculations
  const computeFilteredData = useCallback(
    (filters: FilterState) => {
      const filteredResult = applyFilters(filters, graphData);
      return filteredResult;
    },
    [applyFilters, graphData]
  );

  // Fetch graph data function wrapped in useCallback to prevent unnecessary recreations
  const fetchGraphData = useCallback(async () => {
    // Prevent multiple concurrent fetch requests
    if (isFetchingRef.current) {
      console.log("Already fetching data, skipping request");
      return;
    }

    // Set the lock to prevent further calls
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching graph data...");
      
      // Build URL with cache-busting parameter
      const params = new URLSearchParams();
      params.append('t', Date.now().toString());
      
      // Make the API request with the parameters
      const response = await fetch(`/api/graph?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Received data:",
        data.nodes.length,
        "nodes,",
        data.relationships.length,
        "relationships"
      );

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        console.log("Component unmounted, skipping state update");
        return;
      }

      // Update the graph data
      setGraphData(data);

      // Apply current filters or use full data if no filters exist
      if (currentFilters) {
        console.log("Applying existing filters to new data");
        const filteredResult = computeFilteredData(currentFilters);
        setFilteredData(filteredResult);
      } else {
        console.log("No filters, using full data");
        setFilteredData(data);
      }

      // Reset first filter update flag to true after refetching data
      isFirstFilterUpdate.current = true;
    } catch (err) {
      console.error("Failed to fetch graph data:", err);
      if (isMountedRef.current) {
        setError(
          "Falha ao carregar os dados do grafo. Verifique se o Neo4j está em execução."
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      // Release the lock
      isFetchingRef.current = false;
    }
  }, [currentFilters, computeFilteredData]); // Only depend on currentFilters and computeFilteredData

  // Called when the "Generate Sample Data" button is clicked
  const seedDatabase = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Seeding database...");
      const response = await fetch("/api/seed", { method: "POST" });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // After seeding, fetch the graph data
      await fetchGraphData();
    } catch (err) {
      console.error("Failed to seed database:", err);
      setError(
        "Falha ao gerar dados de exemplo. Verifique se o Neo4j está em execução."
      );
      setIsLoading(false);
    }
  }, [fetchGraphData]);

  // Track component mount/unmount to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false; 
      // Clear any pending timeouts
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, []);

  // Fetch graph data on component mount
  useEffect(() => {
    console.log("Component mounted, fetching initial data");
    fetchGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures this only runs once on mount

  // Handler for filter changes with debouncing
  const handleFilterChange = useCallback(
    (filters: FilterState) => {
      // Clear any existing debounce timer
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }

      // Apply filter changes with an appropriate debounce time
      filterDebounceRef.current = setTimeout(() => {
        // Update the current filters
        setCurrentFilters(filters);

        // Apply the filters locally
        if (graphData.nodes.length > 0) {
          const filteredResult = computeFilteredData(filters);
          setFilteredData(filteredResult);
        }
      }, 250); // 250ms debounce
    },
    [graphData, computeFilteredData]
  );
  
  // Listen for search cleared events
  useEffect(() => {
    // Add event listener for searchCleared event
    const handleSearchCleared = () => {
      // Only update if we have current filters
      if (currentFilters) {
        // Create a new filters object with search cleared but other properties preserved
        const updatedFilters = {
          ...currentFilters,
          search: ''
        };
        
        // Update filters using the existing handler
        handleFilterChange(updatedFilters);
      }
    };
    
    // Add event listener
    window.addEventListener('searchCleared', handleSearchCleared);
    
    return () => {
      // Remove event listener
      window.removeEventListener('searchCleared', handleSearchCleared);
    };
  }, [currentFilters, handleFilterChange]);

  // Handle node selection in the graph
  const handleNodeSelected = useCallback(
    (node: any) => {
      setSelectedNode(node);
      // Clear any selected relationship when a node is selected
      setSelectedRelationship(null);

      // Find all connections (relationships) for this node
      if (node && graphData.relationships.length > 0) {
        const nodeId = extractNodeId(node.id);

        // Find all relationships where this node is source or target
        const connections: Array<{
          node: any;
          type: string;
          direction: "incoming" | "outgoing";
        }> = [];

        graphData.relationships.forEach((rel) => {
          const { sourceId, targetId } = extractRelationshipIds(rel);

          // If this node is the source of the relationship
          if (sourceId === nodeId) {
            // Find the target node
            const targetNode = graphData.nodes.find(
              (n) => extractNodeId(n.id) === targetId
            );
            if (targetNode) {
              connections.push({
                node: targetNode,
                type: rel.type,
                direction: "outgoing",
              });
            }
          }

          // If this node is the target of the relationship
          if (targetId === nodeId) {
            // Find the source node
            const sourceNode = graphData.nodes.find(
              (n) => extractNodeId(n.id) === sourceId
            );
            if (sourceNode) {
              connections.push({
                node: sourceNode,
                type: rel.type,
                direction: "incoming",
              });
            }
          }
        });

        setNodeConnections(connections);
      } else {
        setNodeConnections([]);
      }
    },
    [graphData, extractNodeId, extractRelationshipIds]
  );

  // Handle relationship selection in the graph
  const handleRelationshipSelected = useCallback(
    (relationship: any) => {
      setSelectedRelationship(relationship);
      // Clear any selected node when a relationship is selected
      setSelectedNode(null);
      setNodeConnections([]);
    },
    []
  );

  // Get unique node types for filter controls
  const nodeTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.nodes.forEach((node) => {
      if (node.label) {
        types.add(node.label);
      }
    });
    return Array.from(types);
  }, [graphData.nodes]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <main className="flex-1 relative p-4 md:p-6">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02] dark:opacity-[0.03]">
          {/* Connecting lines */}
          <div className="absolute top-[10%] left-0 w-full h-px bg-blue-600/20"></div>
          <div className="absolute top-[90%] left-0 w-full h-px bg-blue-600/20"></div>
          <div className="absolute top-0 left-[10%] w-px h-full bg-blue-600/20"></div>
          <div className="absolute top-0 left-[90%] w-px h-full bg-blue-600/20"></div>

          {/* Heptagon corners (simplified) */}
          <div className="absolute top-[10%] left-[10%] w-3 h-3 border-2 border-blue-600/30 rotate-45 transform-gpu"></div>
          <div className="absolute top-[10%] left-[90%] w-3 h-3 border-2 border-blue-600/30 rotate-45 transform-gpu"></div>
          <div className="absolute top-[90%] left-[10%] w-3 h-3 border-2 border-blue-600/30 rotate-45 transform-gpu"></div>
          <div className="absolute top-[90%] left-[90%] w-3 h-3 border-2 border-blue-600/30 rotate-45 transform-gpu"></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Waypoints className="text-blue-600 dark:text-blue-400" />O Tear
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Visualização das conexões estratégicas
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3 md:mt-0">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded mb-4">
            <p className="font-medium flex items-center gap-2">
              <X className="text-red-500" />
              {error}
            </p>
            <div className="mt-3">
              <button
                onClick={seedDatabase}
                className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Gerar Dados de Exemplo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-1">
                <FilterControls
                  nodes={graphData.nodes}
                  relationships={graphData.relationships}
                  onFilterChange={handleFilterChange}
                />

                {/* Node and relationship counts */}
                <div className="mt-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Estatísticas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 border border-blue-100 dark:border-blue-800/30">
                      <div className="text-xs text-blue-500 dark:text-blue-300 font-medium mb-0.5">
                        Nós
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {filteredData.nodes.length}
                        <span className="text-xs font-normal text-blue-400 dark:text-blue-500 ml-1">
                          / {graphData.nodes.length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-3 border border-purple-100 dark:border-purple-800/30">
                      <div className="text-xs text-purple-500 dark:text-purple-300 font-medium mb-0.5">
                        Conexões
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {filteredData.relationships.length}
                        <span className="text-xs font-normal text-purple-400 dark:text-purple-500 ml-1">
                          / {graphData.relationships.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden h-[83vh] relative">
                {/* Loading overlay with blur effect */}
                {isLoading && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-blue-200 dark:border-blue-500 dark:border-t-blue-400 animate-spin"></div>
                      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Carregando grafo...
                      </p>
                    </div>
                  </div>
                )}
                {!isLoading && (
                  <GraphContainer
                    key={`graph-${filteredData.nodes.length}-${filteredData.relationships.length}`}
                    data={filteredData}
                    onNodeSelected={handleNodeSelected}
                    onRelationshipSelected={handleRelationshipSelected}
                    searchTerm={currentFilters?.search}
                    onFilterChange={handleFilterChange}
                  />
                )}
              </div>
            </div>

            {/* Selected node info panel */}
            {selectedNode && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getNodeColor(selectedNode.label),
                      }}
                    ></span>
                    {selectedNode.properties.name}
                    <span className="text-sm font-normal text-gray-500">
                      ({selectedNode.label})
                    </span>
                  </h2>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Propriedades
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      {Object.entries(selectedNode.properties).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-3 gap-2 mb-1 text-sm"
                          >
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {key}:
                            </span>
                            <span className="col-span-2">{String(value)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Conexões
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      {nodeConnections.length > 0 ? (
                        <div className="space-y-2">
                          {nodeConnections.map((connection, index) => (
                            <div
                              key={index}
                              className="text-sm border-b last:border-b-0 pb-2 last:pb-0 border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">
                                  {connection.direction === "outgoing"
                                    ? "→"
                                    : "←"}
                                </span>
                                <span className="font-medium">
                                  {connection.type}
                                </span>
                              </div>
                              <div className="ml-4 mt-1">
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                                  style={{
                                    backgroundColor: getNodeColor(
                                      connection.node.label
                                    ),
                                  }}
                                ></span>
                                <span>
                                  {connection.node.properties.name}{" "}
                                  <span className="text-xs text-gray-500">
                                    ({connection.node.label})
                                  </span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma conexão encontrada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Adicionar ao Grafo</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X />
              </button>
            </div>
            <AddForm
              onAdd={() => {
                setShowAddForm(false);
                fetchGraphData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export async function getGraphData() {
  try {
    // Use the permissions-aware version that filters based on user role
    return await fetchGraphDataWithPermissions();
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return { nodes: [], relationships: [] };
  }
}
