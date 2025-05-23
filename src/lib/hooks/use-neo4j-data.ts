"use client";

import { useState, useEffect } from "react";

interface Node {
  id: string;
  label: string;
  properties: Record<string, any>;
}

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
  loading: boolean;
  error: string | null;
}

export interface FilterOptions {
  nodeLabels?: string[];
  relationshipTypes?: string[];
  propertyFilters?: {
    property: string;
    value: any;
    operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "CONTAINS" | "STARTS WITH" | "ENDS WITH";
  }[];
}

const defaultGraphData: GraphData = {
  nodes: [],
  relationships: [],
  loading: false,
  error: null,
};

export function useNeo4jData(options?: FilterOptions): GraphData & { refresh: () => Promise<void> } {
  const [graphData, setGraphData] = useState<GraphData>(defaultGraphData);

  const fetchData = async () => {
    setGraphData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Build URL with filter parameters if provided
      let url = "/api/graph";
      const params = new URLSearchParams();
      
      if (options?.nodeLabels?.length) {
        params.set("nodeLabels", options.nodeLabels.join(","));
      }
      
      if (options?.relationshipTypes?.length) {
        params.set("relationshipTypes", options.relationshipTypes.join(","));
      }
      
      if (options?.propertyFilters?.length) {
        params.set("propertyFilters", JSON.stringify(options.propertyFilters));
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch graph data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setGraphData({
        nodes: data.nodes || [],
        relationships: data.relationships || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching Neo4j data:", error);
      setGraphData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    options?.nodeLabels?.join(","),
    options?.relationshipTypes?.join(","),
    JSON.stringify(options?.propertyFilters),
  ]);

  return {
    ...graphData,
    refresh: fetchData,
  };
} 