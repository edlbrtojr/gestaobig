"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import GraphContainer from "@/components/graph-container";
import FilterControls, { FilterState } from "@/components/filter-controls";
import { GraphData } from "@/types/graph";
import AddForm from "@/components/add-form";
import ThemeToggle from "@/components/theme-toggle";

export default function Home() {
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
  // Add filter state to track current filters
  const [currentFilters, setCurrentFilters] = useState<FilterState | null>(
    null
  );

  // Create a ref to track if we're already fetching data to prevent multiple calls
  const isFetchingRef = useRef(false);

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
      // Debugging - log filter application
      console.log("Applying filters:", JSON.stringify(filters));
      console.log(
        "Data nodes:",
        data.nodes.length,
        "relationships:",
        data.relationships.length
      );

      if (!filters || !data.nodes.length) {
        return data;
      }

      // Filter nodes based on search term and node types
      let filteredNodes = data.nodes.filter((node) => {
        // Check if node type is selected in filters
        if (!filters.nodeTypes[node.label]) return false;

        // Check if node name contains search term (case insensitive)
        if (
          filters.search &&
          !node.properties.name
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        ) {
          return false;
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
        // Get all nodes that have connections in filtered relationships
        const connectedNodeIds = new Set<number>();

        filteredRelationships.forEach((rel) => {
          const { sourceId, targetId } = extractRelationshipIds(rel);
          connectedNodeIds.add(sourceId);
          connectedNodeIds.add(targetId);
        });

        // Only keep nodes that have connections
        filteredNodes = filteredNodes.filter((node) => {
          const nodeId = extractNodeId(node.id);
          return connectedNodeIds.has(nodeId);
        });
      }

      const result = {
        nodes: filteredNodes,
        relationships: filteredRelationships,
      };

      console.log(
        "Filtered result:",
        result.nodes.length,
        "nodes,",
        result.relationships.length,
        "relationships"
      );
      return result;
    },
    [extractNodeId, extractRelationshipIds]
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
      // Add cache-busting parameter to prevent browser caching
      const response = await fetch(`/api/graph?t=${Date.now()}`);

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

      // Update the graph data
      setGraphData(data);

      // Apply current filters or use full data if no filters exist
      if (currentFilters) {
        console.log("Applying existing filters to new data");
        const filteredResult = applyFilters(currentFilters, data);
        setFilteredData(filteredResult);
      } else {
        console.log("No filters, using full data");
        setFilteredData(data);
      }

      // Reset first filter update flag to true after refetching data
      isFirstFilterUpdate.current = true;
    } catch (err) {
      console.error("Failed to fetch graph data:", err);
      setError(
        "Falha ao carregar os dados do grafo. Verifique se o Neo4j está em execução."
      );
    } finally {
      setIsLoading(false);
      // Release the lock
      isFetchingRef.current = false;
    }
  }, [currentFilters, applyFilters]); // Only depend on currentFilters and applyFilters

  // Called when the "Gerar Dados de Exemplo" button is clicked
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

  // Fetch graph data on component mount
  useEffect(() => {
    console.log("Component mounted, fetching initial data");
    fetchGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures this only runs once on mount

  // Handler for filter changes with debouncing
  const handleFilterChange = useCallback(
    (filters: FilterState) => {
      console.log("Filter change detected:", JSON.stringify(filters));

      // Immediate application for the first filter update
      if (isFirstFilterUpdate.current) {
        console.log("First filter update - applying immediately");
        isFirstFilterUpdate.current = false;
        setCurrentFilters(filters);

        if (graphData.nodes.length > 0) {
          const filteredResult = applyFilters(filters, graphData);
          setFilteredData(filteredResult);
        }
        return;
      }

      // Clear any existing debounce timer
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }

      // Set a new debounce timer to prevent rapid filter changes
      filterDebounceRef.current = setTimeout(() => {
        console.log("Debounced filter update applied");
        // Update the current filters
        setCurrentFilters(filters);

        // Apply the filters immediately if we have data
        if (graphData.nodes.length > 0) {
          const filteredResult = applyFilters(filters, graphData);
          setFilteredData(filteredResult);
        }

        // Clear the timer reference
        filterDebounceRef.current = null;
      }, 250); // 250ms debounce
    },
    [graphData, applyFilters]
  );

  // Create memoized props for child components to prevent unnecessary rerenders
  const filterControlsProps = useMemo(
    () => ({
      onFilterChange: handleFilterChange,
      nodes: graphData.nodes,
      relationships: graphData.relationships,
    }),
    [handleFilterChange, graphData.nodes, graphData.relationships]
  );

  // Memoize the filtered data prop to prevent unnecessary rerenders
  const graphContainerProps = useMemo(
    () => ({
      data: filteredData,
    }),
    [filteredData]
  );

  // Update filtered data whenever current filters change
  useEffect(() => {
    if (currentFilters && graphData.nodes.length > 0) {
      console.log("Current filters changed, reapplying");
      const filteredResult = applyFilters(currentFilters, graphData);
      setFilteredData(filteredResult);
    }
  }, [currentFilters, graphData, applyFilters]);

  // Cleanup the debounce timers on unmount
  useEffect(() => {
    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="w-full p-4 bg-[var(--card-background)] border-b border-[var(--card-border)]">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Neo4j Visualizer</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={seedDatabase}
              className="text-sm hover:underline"
              disabled={isLoading}
            >
              Gerar Dados de Exemplo
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 container mx-auto p-4 flex flex-col lg:flex-row gap-4">
        {/* Sidebar - Filters only */}
        <div className="w-full lg:w-96 h-[calc(100vh-8rem)]">
          {/* Filter controls */}
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm p-6 h-full">
            <h2 className="text-lg font-semibold mb-4">Filtros</h2>
            {!isLoading && !error && graphData.nodes.length > 0 && (
              <FilterControls {...filterControlsProps} />
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Graph view */}
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm h-[calc(70vh-4rem)] overflow-hidden">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--primary)] border-r-transparent"
                    role="status"
                  >
                    <span className="sr-only">Carregando...</span>
                  </div>
                  <p className="mt-4 text-[var(--muted)]">
                    Carregando dados do grafo...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <div className="text-red-500 text-5xl mb-4">⚠️</div>
                  <h3 className="text-xl font-semibold mb-2">Erro</h3>
                  <p className="text-[var(--muted)]">{error}</p>
                  <button
                    onClick={fetchGraphData}
                    className="mt-6 px-4 py-2 bg-[var(--primary)] text-white rounded-lg"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            ) : filteredData.nodes.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <div className="text-[var(--muted)] text-5xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Grafo Vazio</h3>
                  <p className="text-[var(--muted)]">
                    Não há dados para exibir. Adicione nós e relacionamentos ou
                    use "Gerar Dados de Exemplo".
                  </p>
                  <button
                    onClick={seedDatabase}
                    className="mt-6 px-4 py-2 bg-[var(--primary)] text-white rounded-lg"
                  >
                    Gerar Dados de Exemplo
                  </button>
                </div>
              </div>
            ) : (
              <GraphContainer {...graphContainerProps} />
            )}
          </div>

          {/* Add form - Moved below the graph container */}
          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-lg shadow-sm h-[calc(30vh-4rem)]">
            <AddForm onAdd={fetchGraphData} />
          </div>
        </div>
      </div>
    </main>
  );
}
