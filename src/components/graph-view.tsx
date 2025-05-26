"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { D3Node, D3Link, GraphData } from "@/types/graph";
import { useTheme } from "./theme-provider";
import { Pencil, Save, X, GitBranch, Shield, Compass } from "lucide-react";
import NodeEditForm from "@/components/node-edit-form";
import RelationshipEditForm from "@/components/relationship-edit-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getGraphSchema } from "@/lib/schema"; // Import the schema utility

interface GraphViewProps {
  data: GraphData;
  onNodeSelected?: (node: any) => void;
  onRelationshipSelected?: (relationship: any) => void;
  searchHighlight?: string;
}

// Default fallback colors for nodes (will be overridden by schema values when available)
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
  Stakeholder: "#BDBDBD", // Lighter Gray for better contrast with dark themes
  Tecnologia: "#00BCD4", // Cyan
  Produto: "#8BC34A", // Light Green
  Mercado: "#FFEB3B", // Yellow
  Competidor: "#FF5722", // Deep Orange
};

// Define label colors based on the color contrast matrix
const labelColors: Record<string, string> = {
  Risco: "#FFFFFF", // White on Red
  PlanoDeAcao: "#FFFFFF", // White on Green
  Acao: "#FFFFFF", // White on Blue
  Estrategia: "#FFFFFF", // White on Amber/Yellow
  Visao: "#FFFFFF", // White on Purple
  Missao: "#FFFFFF", // White on Deep Purple
  Oportunidade: "#FFFFFF", // White on Orange
  Unidade: "#FFFFFF", // White on Teal
  Projeto: "#FFFFFF", // White on Indigo
  Objetivo: "#FFFFFF", // White on Pink
  KPI: "#FFFFFF", // White on Brown
  Stakeholder: "#FFFFFF", // White on Light Gray
  Tecnologia: "#FFFFFF", // White on Cyan
  Produto: "#FFFFFF", // White on Light Green
  Mercado: "#FFFFFF", // White on Yellow
  Competidor: "#FFFFFF", // White on Deep Orange
};

// Default color for unknown node types
const defaultColor = "#757575"; // Darker Gray for unknowns
// Default label color for unknown node types
const defaultLabelColor = "#FFFFFF"; // White for unknown types

// Function to poll schema from the API endpoint
const setupSchemaPolling = (callback: () => void) => {
  // Poll the schema API endpoint
  const pollSchema = async () => {
    try {
      const response = await fetch('/api/schema');
      if (response.ok) {
        callback();
      }
    } catch (error) {
      console.error("Error polling schema:", error);
    }
  };
  
  // Instead of polling frequently, check only once every 5 minutes
  // This should drastically reduce the number of API calls
  const interval = setInterval(pollSchema, 300000);
  
  // Don't call pollSchema immediately on component mount
  // The initial load will be handled by the loadNodeColors call later
  
  return () => clearInterval(interval);
};

// Define group centers for semantic clustering
// Each label type will have its own orbital radius and angle
const calculateGroupCenters = (width: number, height: number, labels: string[]): Record<string, {x: number, y: number, r: number}> => {
  const centers: Record<string, {x: number, y: number, r: number}> = {};
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Base distance from center for the group orbits
  const baseRadius = Math.min(width, height) * 0.25;
  
  // Distribute the labels evenly in a circle
  labels.forEach((label, i) => {
    // Calculate angle based on position in array
    const angle = (i / labels.length) * 2 * Math.PI;
    // Calculate position using polar coordinates
    const x = centerX + baseRadius * Math.cos(angle);
    const y = centerY + baseRadius * Math.sin(angle);
    // Different radius for each group's internal clustering
    const r = baseRadius * 0.4;
    
    centers[label] = { x, y, r };
  });
  
  return centers;
};

// Interface for categorized nodes
interface CategorizedNodes {
  [category: string]: D3Node[];
}

// Helper function to format property values for display
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  
  // Handle Neo4j integer objects
  if (typeof value === "object" && value !== null && "low" in value && "high" in value) {
    return value.low.toString();
  }
  
  // Handle other objects by converting to JSON
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  
  // Return string representation for other types
  return String(value);
};

// Helper function to safely extract node IDs from Neo4j objects
const safeExtractNodeId = (id: any): number => {
  if (id === null || id === undefined) return -1;
  if (typeof id === "object" && id !== null && "low" in id) return id.low;
  return Number(id);
};

export default function GraphView({ 
  data, 
  onNodeSelected,
  onRelationshipSelected,
  searchHighlight 
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<D3Link | null>(null);
  const selectedNodeRef = useRef<D3Node | null>(null);
  const selectedRelationshipRef = useRef<D3Link | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<number[]>([]);
  const [categorizedNodes, setCategorizedNodes] = useState<CategorizedNodes>({});
  const [showCategorized, setShowCategorized] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [initialized, setInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const dataRef = useRef(data); // Store previous data reference
  const renderingRef = useRef(false); // Track if we're currently rendering
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [nodeColors, setNodeColors] = useState<Record<string, string>>(defaultNodeColors);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  // Track view mode: 'standard', 'search', or 'selection'
  const [viewMode, setViewMode] = useState<'standard' | 'search' | 'selection'>('standard');
  // Store search matching node IDs
  const matchingNodeIdsRef = useRef<Set<number>>(new Set());
  // Add new state for hierarchical levels
  const [hierarchyLevels, setHierarchyLevels] = useState<Record<number, number>>({});
  // Add state for fisheye distortion center
  const [distortionCenter, setDistortionCenter] = useState<{x: number, y: number} | null>(null);
  const [enableFisheye, setEnableFisheye] = useState(false); // Keep this off by default
  const [groupCentersMap, setGroupCentersMap] = useState<Record<string, {x: number, y: number, r: number}>>({});

  // Load node colors from schema
  const loadNodeColors = async () => {
    // Skip if already loading
    if (isLoadingColors) return;
    
    try {
      setIsLoadingColors(true);
      
      const schema = await getGraphSchema();
      const newColors: Record<string, string> = { ...defaultNodeColors };
      
      // Extract colors from schema
      Object.entries(schema.nodeTypes).forEach(([key, nodeType]) => {
        if (nodeType.color) {
          // Map both the key and label to the color (in case they differ)
          newColors[key] = nodeType.color;
          newColors[nodeType.label] = nodeType.color;
        }
      });
      
      // Deep comparison to check if colors actually changed
      let colorsChanged = false;
      
      // Use stable algorithm for comparison
      const allKeys = Array.from(new Set([...Object.keys(nodeColors), ...Object.keys(newColors)]));
      
      for (const key of allKeys) {
        if (nodeColors[key] !== newColors[key]) {
          colorsChanged = true;
          break;
        }
      }
      
      // Only update state if colors actually changed to prevent rerenders
      if (colorsChanged) {
        console.log("Node colors changed, updating state");
        setNodeColors(newColors);
        // Only force re-initialization if colors actually changed
        setInitialized(false);
      }
    } catch (error) {
      console.error("Failed to load node colors from schema:", error);
    } finally {
      setIsLoadingColors(false);
    }
  };

  // Add an effect to update node colors when schema changes
  useEffect(() => {
    // Prevent multiple calls when data hasn't changed
    if (isLoadingColors) return;
    
    // Initialize loading flag
    let isMounted = true;
    
    // Handler for custom event
    const handleSchemaUpdated = () => {
      if (isMounted) loadNodeColors();
    };
    
    // Listen for direct schema update events
    window.addEventListener('schemaUpdated', handleSchemaUpdated);
    
    // Set up polling for schema changes - but only call loadNodeColors once at initialization
    const cleanupPolling = setupSchemaPolling(() => {
      if (isMounted) loadNodeColors();
    });
    
    // Initial load of colors - only if we haven't loaded them yet
    if (!Object.keys(nodeColors).length || Object.keys(nodeColors).length === Object.keys(defaultNodeColors).length) {
      loadNodeColors();
    }
    
    return () => {
      isMounted = false;
      window.removeEventListener('schemaUpdated', handleSchemaUpdated);
      cleanupPolling();
    };
  }, []);  // Empty dependency array to ensure this only runs once on mount

  // Use memo for expensive graph data processing
  const [processedData, nodeMap] = useMemo(() => {
    if (!data.nodes.length) return [null, new Map()];

    const map = new Map();
    // Process nodes
    const processedNodes = data.nodes.map((node) => {
      const nodeId =
        typeof node.id === "object" && node.id !== null
          ? node.id.low
          : Number(node.id);

      const d3Node = {
        ...node,
        id: nodeId,
      };
      map.set(nodeId, d3Node);
      return d3Node;
    });

    return [
      {
        nodes: processedNodes,
        relationships: data.relationships,
      },
      map,
    ];
  }, [data]);

  // Function to determine text and UI colors based on theme
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

  // Force reinitialization when theme changes
  useEffect(() => {
    setInitialized((prev) => {
      // Only set to false if we've already been initialized once
      return prev ? false : prev;
    });
  }, [theme, resolvedTheme]);

  // Only reinitialize when data actually changes
  useEffect(() => {
    // Skip if data is the same reference or has same nodes/relationships
    if (
      dataRef.current === data ||
      (dataRef.current.nodes.length === data.nodes.length &&
        dataRef.current.relationships.length === data.relationships.length)
    ) {
      return;
    }

    // Update the data reference
    dataRef.current = data;

    if (data.nodes.length > 0) {
      // Use a smoother transition for data changes
      const handleDataChange = () => {
        setInitialized(false);

        // Reset any selected state when data changes
        setSelectedNode(null);
        setSelectedRelationship(null);
        setConnectedNodes([]);
        setShowCategorized(false);

        // Clear any existing simulation with a smooth fade-out
        if (simulationRef.current) {
          simulationRef.current.stop();
          simulationRef.current = null;
        }

        // Clear SVG contents with a transition
        if (svgRef.current) {
          d3.select(svgRef.current)
            .selectAll("g.nodes, g.links")
            .transition()
            .duration(300)
            .style("opacity", 0)
            .on("end", () => {
              // After fade-out completes, remove elements
              d3.select(svgRef.current).selectAll("*").remove();
            });
        }
      };

      // Use requestAnimationFrame to ensure smoother handling of data changes
      requestAnimationFrame(handleDataChange);
    }
  }, [data]);

  // New effect to calculate hierarchy levels based on relationships
  useEffect(() => {
    if (!data.nodes.length || !data.relationships.length) return;
    
    // Start by finding potential root nodes (nodes with outgoing but no incoming relationships)
    const incomingEdges: Record<number, number> = {};
    const outgoingEdges: Record<number, number> = {};
    
    // Count incoming and outgoing edges for each node
    data.relationships.forEach(rel => {
      const sourceId = safeExtractNodeId(rel.source);
      const targetId = safeExtractNodeId(rel.target);
      
      incomingEdges[targetId] = (incomingEdges[targetId] || 0) + 1;
      outgoingEdges[sourceId] = (outgoingEdges[sourceId] || 0) + 1;
    });
    
    // Identify root nodes (nodes with outgoing edges but no incoming edges)
    const rootNodeIds = data.nodes
      .filter(node => {
        const nodeId = safeExtractNodeId(node.id);
        return outgoingEdges[nodeId] && !incomingEdges[nodeId];
      })
      .map(node => safeExtractNodeId(node.id));
    
    // If no clear root nodes, use nodes with more outgoing than incoming edges
    if (rootNodeIds.length === 0) {
      rootNodeIds.push(...data.nodes
        .filter(node => {
          const nodeId = safeExtractNodeId(node.id);
          return (outgoingEdges[nodeId] || 0) > (incomingEdges[nodeId] || 0);
        })
        .map(node => safeExtractNodeId(node.id))
      );
    }
    
    // Still no roots? Use any node with the most connections
    if (rootNodeIds.length === 0 && data.nodes.length > 0) {
      const nodeWithMostConnections = data.nodes.reduce((max, node) => {
        const nodeId = safeExtractNodeId(node.id);
        const connections = (outgoingEdges[nodeId] || 0) + (incomingEdges[nodeId] || 0);
        return connections > max.connections ? { id: nodeId, connections } : max;
      }, { id: -1, connections: -1 });
      
      if (nodeWithMostConnections.id !== -1) {
        rootNodeIds.push(nodeWithMostConnections.id);
      }
    }
    
    // Build adjacency list for the graph
    const adjList: Record<number, number[]> = {};
    data.relationships.forEach(rel => {
      const sourceId = safeExtractNodeId(rel.source);
      const targetId = safeExtractNodeId(rel.target);
      
      if (!adjList[sourceId]) adjList[sourceId] = [];
      if (!adjList[targetId]) adjList[targetId] = [];
      
      adjList[sourceId].push(targetId);
    });
    
    // Assign hierarchy levels using BFS from root nodes
    const newHierarchyLevels: Record<number, number> = {};
    const visited = new Set<number>();
    
    // Queue for BFS with [nodeId, level]
    const queue: [number, number][] = rootNodeIds.map(id => [id, 0]);
    
    while (queue.length > 0) {
      const [nodeId, level] = queue.shift()!;
      
      if (visited.has(nodeId)) {
        // If we've seen this node before, keep the minimum level
        newHierarchyLevels[nodeId] = Math.min(level, newHierarchyLevels[nodeId] || Infinity);
        continue;
      }
      
      visited.add(nodeId);
      newHierarchyLevels[nodeId] = level;
      
      // Add neighbors to the queue
      const neighbors = adjList[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([neighbor, level + 1]);
        }
      }
    }
    
    // For any unvisited nodes, assign a middle level
    const maxLevel = Math.max(...Object.values(newHierarchyLevels), 0);
    const defaultLevel = Math.ceil(maxLevel / 2);
    
    data.nodes.forEach(node => {
      const nodeId = safeExtractNodeId(node.id);
      if (!visited.has(nodeId)) {
        newHierarchyLevels[nodeId] = defaultLevel;
      }
    });
    
    setHierarchyLevels(newHierarchyLevels);
    
    // Get all unique node labels for group centers
    const uniqueLabels = Array.from(new Set(data.nodes.map(node => node.label)));
    
    // Calculate group centers
    if (svgRef.current) {
      const containerWidth = svgRef.current.parentElement?.clientWidth || window.innerWidth;
      const containerHeight = svgRef.current.parentElement?.clientHeight || window.innerHeight;
      const centers = calculateGroupCenters(containerWidth, containerHeight, uniqueLabels);
      setGroupCentersMap(centers);
    }
    
  }, [data.nodes, data.relationships]);

  // Main graph initialization effect that should not depend on node selection
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
      return;
    }

    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }

    d3.select(svgRef.current).selectAll("*").remove();

    const frameId = requestAnimationFrame(() => {
      if (!svgRef.current) return;

      const rawForegroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim();
      const rawMutedForegroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--muted-foreground")
        .trim();
      const rawMutedColor = getComputedStyle(document.documentElement) // For link lines, borders etc.
        .getPropertyValue("--muted")
        .trim();
      const rawBorderColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--border")
        .trim();

      // Get theme-aware colors
      const { textColor, mutedForegroundColor, linkColor, nodeBorderColor } =
        getThemeColors();

      // Define colors directly based on theme for critical D3 elements
      const d3TextColor = textColor;
      const d3MutedForegroundColor = mutedForegroundColor;
      const d3LinkColor = linkColor;
      const d3NodeBorderColor = `hsl(${nodeBorderColor})`;

      const containerWidth =
        svgRef.current!.parentElement?.clientWidth || window.innerWidth;
      const containerHeight =
        svgRef.current!.parentElement?.clientHeight || window.innerHeight;

      const extractNodeId = (id: any): number => {
        if (id === null || id === undefined) return -1;
        if (typeof id === "object" && "low" in id) return id.low;
        return Number(id);
      };

      const nodes: D3Node[] = data.nodes.map((node, i) => {
        const nodeId = extractNodeId(node.id);
        // All nodes start at the center with a tiny random offset
        const d3Node = {
          ...node,
          id: nodeId,
          x: containerWidth / 2 + (Math.random() - 0.5) * 5, // tiny random offset to prevent perfect overlapping
          y: containerHeight / 2 + (Math.random() - 0.5) * 5,
        };
        nodeMap.set(nodeId, d3Node);
        return d3Node;
      });

      const links: D3Link[] = data.relationships.map((rel) => ({
        ...rel,
        id: extractNodeId(rel.id),
        source: extractNodeId(rel.source),
        target: extractNodeId(rel.target),
      }));

      const validLinks: D3Link[] = links.filter((rel) => {
        const sourceId =
          typeof rel.source === "object"
            ? (rel.source as D3Node).id
            : (rel.source as number);
        const targetId =
          typeof rel.target === "object"
            ? (rel.target as D3Node).id
            : (rel.target as number);
        return nodeMap.has(sourceId) && nodeMap.has(targetId);
      });

      const connectionCounts = new Map<number, number>();
      nodes.forEach((node) => connectionCounts.set(node.id, 0));
      validLinks.forEach((link) => {
        const sourceId =
          typeof link.source === "object"
            ? (link.source as D3Node).id
            : (link.source as number);
        const targetId =
          typeof link.target === "object"
            ? (link.target as D3Node).id
            : (link.target as number);
        connectionCounts.set(
          sourceId,
          (connectionCounts.get(sourceId) || 0) + 1
        );
        connectionCounts.set(
          targetId,
          (connectionCounts.get(targetId) || 0) + 1
        );
      });

      const getNodeRadius = (nodeId: number): number => {
        const connectionCount = connectionCounts.get(nodeId) || 0;
        const minRadius = 22; // Increased from 18 for better visibility
        const maxRadius = 60; // Increased from 54 for more prominent nodes
        const minConnections = 0;
        const maxConnections = Math.max(
          ...Array.from(connectionCounts.values())
        );
        if (maxConnections === minConnections) return minRadius;

        // Use a smoother scaling function with square root for more even distribution
        const connectionFactor =
          Math.sqrt(connectionCount - minConnections) /
          Math.sqrt(maxConnections - minConnections);
        return minRadius + (maxRadius - minRadius) * connectionFactor;
      };

      const getConnectedNodeIds = (nodeId: number): number[] => {
        const connected = new Set<number>();
        validLinks.forEach((link) => {
          const sourceId =
            typeof link.source === "object"
              ? (link.source as D3Node).id
              : (link.source as number);
          const targetId =
            typeof link.target === "object"
              ? (link.target as D3Node).id
              : (link.target as number);
          if (sourceId === nodeId) connected.add(targetId);
          else if (targetId === nodeId) connected.add(sourceId);
        });
        return Array.from(connected);
      };

      const internalCategorizeNodes = () => {
        const categorized: CategorizedNodes = {};
        nodes.forEach((node) => {
          if (!categorized[node.label]) categorized[node.label] = [];
          categorized[node.label].push(node);
        });
        Object.keys(categorized).forEach((category) => {
          categorized[category].sort((a, b) =>
            a.properties.name.localeCompare(b.properties.name)
          );
        });
        setCategorizedNodes(categorized);
      };
      internalCategorizeNodes();

      const svg = d3
        .select(svgRef.current)
        .attr("width", containerWidth)
        .attr("height", containerHeight);

      // Add a fade-in effect for all elements
      const containerGroup = svg.append("g");
      containerGroup
        .style("opacity", 0)
        .transition()
        .duration(700) // Longer duration for smoother fade in
        .style("opacity", 1);

      const g = containerGroup.append("g");

      // Enhanced zoom with fisheye effect support
      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
          
          // Update distortion center for fisheye effect when zooming
          if (enableFisheye && distortionCenter) {
            // Convert mouse coordinates to simulation space
            const transform = d3.zoomTransform(svg.node() as Element);
            const x = (distortionCenter.x - transform.x) / transform.k;
            const y = (distortionCenter.y - transform.y) / transform.k;
            setDistortionCenter({ x, y });
          }
        });

      svg.call(zoom as any);
      
      // Mouse move handler for fisheye distortion
      svg.on("mousemove", (event) => {
        if (enableFisheye) {
          const [x, y] = d3.pointer(event);
          setDistortionCenter({ x, y });
        }
      });

      // Double-click to zoom reset
      svg.on("dblclick.zoom", null);
      svg.on("dblclick", () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      });

      // Direct click handler on SVG for better event capturing
      svg.on("click", (event) => {
        // Prevent click handler from firing when clicking on a node or relationship
        if (event.defaultPrevented) return;
        
        console.log("SVG click, current mode:", viewMode);
        
        // Two-stage clearing behavior
        if (viewMode === 'selection') {
          console.log("Selection mode, returning to search mode");
          // If we're in selection mode, go back to search mode if we have search results
          if (searchHighlight && matchingNodeIdsRef.current.size > 0) {
            // Clear node selection
            setSelectedNode(null);
            selectedNodeRef.current = null;
            setSelectedRelationship(null);
            selectedRelationshipRef.current = null;
            setConnectedNodes([]);
            setShowCategorized(false);
            setIsEditing(false);
            setIsEditingRelationship(false);
            
            // Change to search mode
            setViewMode('search');
            
            if (onNodeSelected) {
              onNodeSelected(null);
            }
            
            // Apply search highlighting
            const t = d3.transition().duration(300);
            
            // Get theme colors directly to avoid dependency issues
            const isDarkTheme =
              resolvedTheme === "dark" ||
              document.documentElement.classList.contains("dark") ||
              document.documentElement.getAttribute("data-theme") === "dark";
            
            const textColor = isDarkTheme ? "#FFFFFF" : "#0A0A0A";
            
            // First dim all nodes
            svg.selectAll('.nodes g .node-circle')
              .transition(t)
              .attr('opacity', 0.15)
              .style('opacity', 0.15)
              .attr('stroke-width', 1);
            
            // Dim all text elements
            svg.selectAll('.nodes g .node-name-text')
              .transition(t)
              .attr('opacity', 0.08)
              .style('opacity', 0.08)
              .attr('fill', '#FFFFFF');
            
            svg.selectAll('.nodes g .node-type-text')
              .transition(t)
              .attr('opacity', 0.08)
              .style('opacity', 0.08);
            
            // Dim relationships
            svg.selectAll('.links line')
              .transition(t)
              .attr('stroke-opacity', 0.15)
              .style('stroke-opacity', 0.15)
              .attr('stroke-width', 1);
            
            svg.selectAll('.links text')
              .transition(t)
              .attr('opacity', 0.1)
              .style('opacity', 0.1);
            
            // Highlight matching nodes again
            svg.selectAll('.nodes g')
              .filter(function() {
                const nodeId = Number(d3.select(this).attr('data-id'));
                return matchingNodeIdsRef.current.has(nodeId);
              })
              .each(function() {
                const node = d3.select(this);
                
                // Highlight the circle
                node.select('.node-circle')
                  .transition(t)
                  .attr('opacity', 1)
                  .style('opacity', 1)
                  .attr('stroke-width', 2.5)
                  .attr('stroke', textColor);
                
                // Highlight name text with better forced visibility
                node.select('.node-name-text')
                  .transition(t)
                  .attr('opacity', 1)
                  .style('opacity', 1)
                  .attr('fill', '#FFFFFF');
                
                // Highlight type text
                node.select('.node-type-text')
                  .transition(t)
                  .attr('opacity', 1)
                  .style('opacity', 1);
              });
              
            event.stopPropagation();
            return; // Exit early after restoring search results
          }
        } else if (viewMode === 'search') {
          console.log("Search mode, clearing search");
          // If we're in search mode, clear search and go to standard mode
          setViewMode('standard');
          // Clear the search term by dispatching a custom event that the parent can listen for
          window.dispatchEvent(new CustomEvent('clearSearchTerm', {}));
          // Also ensure the search results counter is removed
          window.dispatchEvent(new CustomEvent('searchResultsCount', { 
            detail: { count: 0, term: '' } 
          }));
          
          event.stopPropagation();
        }
        
        // Standard behavior - clear all selections and restore standard view
        console.log("Standard mode, clearing all selections");
        setSelectedNode(null);
        selectedNodeRef.current = null;
        setSelectedRelationship(null);
        selectedRelationshipRef.current = null;
        setConnectedNodes([]);
        setShowCategorized(false);
        setIsEditing(false);
        setIsEditingRelationship(false);
        setViewMode('standard');

        if (onNodeSelected) {
          onNodeSelected(null);
        }

        const t = d3.transition().duration(300);
        
        // Get theme colors directly to avoid reference issues
        const isDarkTheme =
          resolvedTheme === "dark" ||
          document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark";

        const textColor = isDarkTheme ? "#FFFFFF" : "#0A0A0A";
        const linkColor = isDarkTheme ? "#606060" : "#C0C0C0";
        const borderColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--border")
          .trim();

        // Reset node circles
        svg.selectAll(".nodes g .node-circle")
          .transition(t)
          .attr("opacity", 1)
          .style("opacity", 1)
          .attr(
            "stroke",
            (n: any) =>
              d3
                .color(nodeColors[n.label] || defaultColor)
                ?.darker(0.7)
                .toString() || `hsl(${borderColor})`
          )
          .attr("stroke-width", 1.5);

        // Reset node name text
        svg.selectAll(".nodes g .node-name-text")
          .transition(t)
          .attr("opacity", 1)
          .style("opacity", 1)
          .attr("fill", "#FFFFFF");

        // Reset node type text
        svg.selectAll(".nodes g .node-type-text")
          .transition(t)
          .attr("opacity", 1)
          .style("opacity", 1);

        // Reset relationship lines
        svg.selectAll(".links line")
          .transition(t)
          .attr("stroke", linkColor)
          .attr("stroke-opacity", 0.5)
          .style("stroke-opacity", 0.5)
          .attr("stroke-width", 1.5);

        // Reset relationship text
        svg.selectAll(".links text")
          .transition(t)
          .attr("fill", textColor)
          .attr("opacity", 0.7)
          .style("opacity", 0.7)
          .attr("font-weight", "normal");
          
        // Also ensure the search results counter is removed when clicking elsewhere
        window.dispatchEvent(new CustomEvent('searchResultsCount', { 
          detail: { count: 0, term: '' } 
        }));
      });

      // Get unique labels for node group definitions
      const uniqueLabels = Array.from(new Set(nodes.map(node => node.label)));
      
      // Calculate group centers for clustering if not already calculated
      const groupCenters = Object.keys(groupCentersMap).length > 0 
        ? groupCentersMap 
        : calculateGroupCenters(containerWidth, containerHeight, uniqueLabels);
      
      // Configure the simulation with improved forces for better node positioning
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(validLinks)
            .id((d: any) => d.id)
            .distance(250) // Increased from 180 to spread nodes further apart
            .strength(0.15) // Reduced from dynamic value to a constant lower value for looser connections
        )
        .force("charge", d3.forceManyBody()
          .strength(-1200) // Stronger repulsion to push nodes further apart
          .distanceMax(800) // Increased from 500 to extend the effective range of the charge
        )
        .force(
          "center",
          d3.forceCenter(containerWidth / 2, containerHeight / 2).strength(0.03) // Reduced centering force
        )
        .force(
          "collide",
          d3.forceCollide().radius((d: any) => getNodeRadius(d.id) + 50).strength(0.7) // Increased spacing and reduced strength
        )
        // Remove type-based clustering and hierarchy constraints
        // Add a simple radial force to distribute isolated nodes
        .force("radial", d3.forceRadial(
          (d) => {
            const count = connectionCounts.get((d as D3Node).id) || 0;
            // Give isolated nodes a slight outward push
            return count === 0 ? containerWidth * 0.4 : containerWidth * 0.2;
          },
          containerWidth / 2,
          containerHeight / 2
        ).strength(0.05)) // Very gentle force
        .alpha(0.6) // Higher initial energy for more dynamic movement
        .alphaDecay(0.008); // Slightly faster decay for quicker stabilization

      // Add a velocity decay parameter to slow down node movement more gradually
      simulation.velocityDecay(0.3); // Default is 0.4, lower value = more fluid movement

      // Apply fisheye distortion if enabled
      const applyFisheyeDistortion = () => {
        if (!enableFisheye || !distortionCenter) return;
        
        // Simple fisheye implementation
        const distortionRadius = 200; // Radius of effect
        const distortionFactor = 2.5; // Magnification factor
        
        nodes.forEach(node => {
          if (node.fx !== null || node.fy !== null) return; // Skip fixed nodes
          
          // Calculate distance from distortion center
          const dx = (node.x || 0) - distortionCenter.x;
          const dy = (node.y || 0) - distortionCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < distortionRadius) {
            // Calculate distortion factor (decreasing with distance)
            const factor = 1 + (distortionFactor * (1 - distance / distortionRadius));
            
            // Apply distortion from the center point
            node.x = distortionCenter.x + dx * factor;
            node.y = distortionCenter.y + dy * factor;
          }
        });
      };

      simulation.on("tick", () => {
        // Apply fisheye distortion if enabled
        if (enableFisheye && distortionCenter) {
          applyFisheyeDistortion();
        }
        
        g.selectAll(".links line")
          .attr("x1", function(d: any): number {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            if (!sourceNode) return 0;
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            if (!targetNode) return sourceNode.x ?? 0;
            
            // Calculate source radius
            const sourceRadius = getNodeRadius(sourceNode.id);
            const sx = sourceNode.x ?? 0;
            const sy = sourceNode.y ?? 0;
            const tx = targetNode.x ?? 0;
            const ty = targetNode.y ?? 0;
            
            // Calculate angle
            const dx = tx - sx;
            const dy = ty - sy;
            const angle = Math.atan2(dy, dx);
            
            // Start line at edge of source node
            return sx + (sourceRadius * Math.cos(angle));
          })
          .attr("y1", function(d: any): number {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            if (!sourceNode) return 0;
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            if (!targetNode) return sourceNode.y ?? 0;
            
            // Calculate source radius
            const sourceRadius = getNodeRadius(sourceNode.id);
            const sx = sourceNode.x ?? 0;
            const sy = sourceNode.y ?? 0;
            const tx = targetNode.x ?? 0;
            const ty = targetNode.y ?? 0;
            
            // Calculate angle
            const dx = tx - sx;
            const dy = ty - sy;
            const angle = Math.atan2(dy, dx);
            
            // Start line at edge of source node
            return sy + (sourceRadius * Math.sin(angle));
          })
          .attr("x2", function(d: any): number {
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            if (!targetNode) return 0;
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            if (!sourceNode) return targetNode.x ?? 0;
            
            // Calculate target radius
            const targetRadius = getNodeRadius(targetNode.id);
            const sx = sourceNode.x ?? 0;
            const sy = sourceNode.y ?? 0;
            const tx = targetNode.x ?? 0;
            const ty = targetNode.y ?? 0;
            
            // Calculate angle
            const dx = sx - tx;
            const dy = sy - ty;
            const angle = Math.atan2(dy, dx);
            
            // End line at edge of target node
            return tx + (targetRadius * Math.cos(angle));
          })
          .attr("y2", function(d: any): number {
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            if (!targetNode) return 0;
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            if (!sourceNode) return targetNode.y ?? 0;
            
            // Calculate target radius
            const targetRadius = getNodeRadius(targetNode.id);
            const sx = sourceNode.x ?? 0;
            const sy = sourceNode.y ?? 0;
            const tx = targetNode.x ?? 0;
            const ty = targetNode.y ?? 0;
            
            // Calculate angle
            const dx = sx - tx;
            const dy = sy - ty;
            const angle = Math.atan2(dy, dx);
            
            // End line at edge of target node
            return ty + (targetRadius * Math.sin(angle));
          });

        // ... rest of the existing code ...

        g.selectAll(".links text")
          .attr("x", function(d: any): number {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            return ((sourceNode?.x ?? 0) + (targetNode?.x ?? 0)) / 2;
          })
          .attr("y", function(d: any): number {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            return ((sourceNode?.y ?? 0) + (targetNode?.y ?? 0)) / 2;
          });
        g.selectAll(".nodes g").attr(
          "transform",
          (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`
        );
      });

      const linkElements = g
        .append("g")
        .attr("class", "links")
        .selectAll("g")
        .data(validLinks)
        .enter()
        .append("g");

      linkElements
        .append("line")
        .attr("stroke", getThemeColors().linkColor) // Use theme link color
        .attr("stroke-opacity", 0)
        .attr("stroke-width", 2.5) // Increased from 2 for better visibility
        .attr("marker-end", "url(#arrow)")
        .attr("data-id", (d: D3Link) => d.id)
        .style("cursor", "pointer")
        .on("click", (event: MouseEvent, d: D3Link) => {
          event.stopPropagation();
          // Reset node selection and edit states
          setSelectedNode(null);
          selectedNodeRef.current = null;
          setConnectedNodes([]);
          setIsEditing(false);
          // Set relationship selection
          setSelectedRelationship(d);
          selectedRelationshipRef.current = d;
          setIsEditingRelationship(false);
          if (onRelationshipSelected) {
            onRelationshipSelected(d);
          }
          
          const t = d3.transition().duration(300);
          const { textColor } = getThemeColors();
          const sourceId = typeof d.source === "object" ? d.source.id : d.source;
          const targetId = typeof d.target === "object" ? d.target.id : d.target;

          // First dim ALL elements
          // Dim all nodes and circles
          g.selectAll(".nodes g .node-circle")
            .transition(t)
            .attr("opacity", 0.15)
            .style("opacity", 0.15)
            .attr("stroke-width", 1);
            
          // Forcefully dim ALL text elements with both attr and style
          g.selectAll(".nodes g .node-name-text")
            .transition(t)
            .attr("opacity", 0.08)
            .style("opacity", 0.08);
            
          g.selectAll(".nodes g .node-type-text")
            .transition(t)
            .attr("opacity", 0.08)
            .style("opacity", 0.08);
          
          // Dim all relationships
          g.selectAll(".links line")
            .transition(t)
            .attr("stroke-opacity", 0.15)
            .style("stroke-opacity", 0.15)
            .attr("stroke-width", 1);
            
          g.selectAll(".links text")
            .transition(t)
            .attr("opacity", 0.1)
            .style("opacity", 0.1);
          
          // Highlight this relationship line
          const parentElement = (event.currentTarget as Element).parentNode as Element;
          if (parentElement) {
            d3.select(parentElement)
              .select("line")
              .transition(t)
              .attr("stroke-opacity", 1)
              .style("stroke-opacity", 1)
              .attr("stroke-width", 2.5)
              .attr("stroke", textColor);
              
            d3.select(parentElement)
              .select("text")
              .transition(t)
              .attr("opacity", 1)
              .style("opacity", 1)
              .attr("font-weight", "bold")
              .attr("fill", textColor);
          }

          // Highlight the connected nodes
          g.selectAll(".nodes g")
            .filter(function(nodeData: any) {
              return nodeData.id === sourceId || nodeData.id === targetId;
            })
            .each(function() {
              const node = d3.select(this);
              
              // Highlight circle
              node.select(".node-circle")
                .transition(t)
                .attr("opacity", 0.9)
                .style("opacity", 0.9)
                .attr("stroke-width", 2);
              
              // Highlight text - force with both attr and style
              node.select(".node-name-text")
                .transition(t)
                .attr("opacity", 0.8)
                .style("opacity", 0.8)
                .attr("fill", "#FFFFFF");
                
              node.select(".node-type-text")
                .transition(t)
                .attr("opacity", 0.8)
                .style("opacity", 0.8);
            });
        })
        .transition()
        .delay(800)
        .duration(500)
        .attr("stroke-opacity", 0.6); // Increased from 0.5 for better visibility

      svg
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 17 17")
        .attr("refX", 15) // Reduced from 28 to account for lines ending at node edges
        .attr("refY", 0)
        .attr("markerWidth", 5) // Increased from 5
        .attr("markerHeight", 5) // Increased from 5
        .attr("orient", "auto")
        .append("path")
        .attr("fill", getThemeColors().textColor) // Use the theme color function
        .attr("d", "M0,-5L10,0L0,5Z"); // Added Z to close the path for a solid arrowhead

      linkElements
        .append("text")
        .text((d: D3Link) => d.type)
        .attr("font-size", "11px") // Increased from 9px for better readability
        .attr("text-anchor", "middle")
        .attr("dy", "-7") // Increased from -5 to move away from the line
        .attr("fill", textColor)
        .attr("opacity", 0)
        .style("opacity", 0)
        .style("pointer-events", "all")
        .style("cursor", "pointer")
        .style("font-weight", "600") // Add font-weight for better visibility
        .on("click", (event: MouseEvent, d: D3Link) => {
          event.stopPropagation();
          // Reset node selection and edit states
          setSelectedNode(null);
          selectedNodeRef.current = null;
          setConnectedNodes([]);
          setIsEditing(false);
          // Set relationship selection
          setSelectedRelationship(d);
          selectedRelationshipRef.current = d;
          setIsEditingRelationship(false);
          if (onRelationshipSelected) {
            onRelationshipSelected(d);
          }
          
          const t = d3.transition().duration(300);
          const { textColor } = getThemeColors();
          const sourceId = typeof d.source === "object" ? d.source.id : d.source;
          const targetId = typeof d.target === "object" ? d.target.id : d.target;

          // First dim ALL elements
          // Dim all nodes and circles
          g.selectAll(".nodes g .node-circle")
            .transition(t)
            .attr("opacity", 0.15)
            .style("opacity", 0.15)
            .attr("stroke-width", 1);
            
          // Forcefully dim ALL text elements with both attr and style
          g.selectAll(".nodes g .node-name-text")
            .transition(t)
            .attr("opacity", 0.08)
            .style("opacity", 0.08);
            
          g.selectAll(".nodes g .node-type-text")
            .transition(t)
            .attr("opacity", 0.08)
            .style("opacity", 0.08);
          
          // Dim all relationships
          g.selectAll(".links line")
            .transition(t)
            .attr("stroke-opacity", 0.15)
            .style("stroke-opacity", 0.15)
            .attr("stroke-width", 1);
            
          g.selectAll(".links text")
            .transition(t)
            .attr("opacity", 0.1)
            .style("opacity", 0.1);
          
          // Highlight this relationship line
          const parentElement = (event.currentTarget as Element).parentNode as Element;
          if (parentElement) {
            d3.select(parentElement)
              .select("line")
              .transition(t)
              .attr("stroke-opacity", 1)
              .style("stroke-opacity", 1)
              .attr("stroke-width", 2.5)
              .attr("stroke", textColor);
              
            d3.select(parentElement)
              .select("text")
              .transition(t)
              .attr("opacity", 1)
              .style("opacity", 1)
              .attr("font-weight", "bold")
              .attr("fill", textColor);
          }

          // Highlight the connected nodes
          g.selectAll(".nodes g")
            .filter(function(nodeData: any) {
              return nodeData.id === sourceId || nodeData.id === targetId;
            })
            .each(function() {
              const node = d3.select(this);
              
              // Highlight circle
              node.select(".node-circle")
                .transition(t)
                .attr("opacity", 0.9)
                .style("opacity", 0.9)
                .attr("stroke-width", 2);
              
              // Highlight text - force with both attr and style
              node.select(".node-name-text")
                .transition(t)
                .attr("opacity", 0.8)
                .style("opacity", 0.8)
                .attr("fill", "#FFFFFF");
                
              node.select(".node-type-text")
                .transition(t)
                .attr("opacity", 0.8)
                .style("opacity", 0.8);
            });
        })
        .transition()
        .delay(1000)
        .duration(500)
        .attr("opacity", 0.8) // Increased from 0.7
        .style("opacity", 0.8); // Increased from 0.7

      const drag = d3
        .drag<Element, D3Node>()
        .clickDistance(5) // Allow clicks up to 5 pixels of movement
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      const nodeElements = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .call(drag as any)
        .attr("data-id", (d: D3Node) => d.id)
        .attr("data-label", (d: D3Node) => d.label)
        .attr("data-name", (d: D3Node) => d.properties.name)
        .attr(
          "data-connections",
          (d: D3Node) => connectionCounts.get(d.id) || 0
        );

      const defs = svg.select("defs");
      const filter = defs
        .append("filter")
        .attr("id", "node-shadow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 2.5)
        .attr("result", "blur");
      filter
        .append("feOffset")
        .attr("in", "blur")
        .attr("dx", 0)
        .attr("dy", 1)
        .attr("result", "offsetBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "offsetBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      nodeElements
        .append("circle")
        .attr("class", "node-circle")
        .attr("r", 0)
        .attr("fill", (d: D3Node) => nodeColors[d.label] || defaultColor)
        .attr(
          "stroke",
          (d: D3Node) =>
            d3
              .color(nodeColors[d.label] || defaultColor)
              ?.darker(0.7)
              .toString() || d3NodeBorderColor
        )
        .attr("stroke-width", 1.5)
        .style("filter", "url(#node-shadow)")
        .transition()
        .duration(1000)
        .ease(d3.easeElasticOut.amplitude(0.5))
        .attr("r", (d: D3Node) => getNodeRadius(d.id));

      // Create a filter for text shadow
      const textShadowFilter = defs
        .append("filter")
        .attr("id", "text-shadow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      
      // Add a stronger drop shadow for better readability against light backgrounds
      textShadowFilter
        .append("feDropShadow")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("stdDeviation", 1.5)
        .attr("flood-opacity", 0.5)
        .attr("flood-color", "#000000");

      nodeElements
        .append("text")
        .attr("class", "node-name-text")
        .attr("font-size", (d: D3Node) => {
          const radius = getNodeRadius(d.id);
          // Scale font size based on node radius, capped for readability
          // Reduced by 25% to fit better within the node
          return Math.min(Math.max(radius * 0.3, 7), 10) + "px";
        })
        .attr("font-weight", "600")
        .attr("dy", "-0.2em")
        .attr("text-anchor", "middle")
        .attr("fill", "#FFFFFF") // Always use white for all node labels
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("filter", "url(#text-shadow)")
        .each(function (d: D3Node) {
          const name = d.properties?.name || `Node ${d.id}`;
          const radius = getNodeRadius(d.id);
          const fontSize = Math.min(Math.max(radius * 0.3, 7), 10);
          
          // Get SVG text element
          const textElement = d3.select(this);
          
          // Calculate how many characters can fit per line based on radius
          const charsPerLine = Math.max(Math.floor(radius * 1.6 / (fontSize * 0.6)), 5);
          
          // Clear any existing content first
          textElement.text("");
          
          // If name is short enough, just set it directly
          if (name.length <= charsPerLine) {
            textElement.text(name);
          } else {
            // Split text into two lines if needed
            const firstLine = name.substring(0, charsPerLine);
            let secondLine = "";
            
            // If name is longer than what can fit in two lines, truncate with ellipsis
            if (name.length > charsPerLine * 2) {
              secondLine = name.substring(charsPerLine, charsPerLine * 2 - 3) + "...";
            } else {
              secondLine = name.substring(charsPerLine);
            }
            
            // Add first line
            textElement.append("tspan")
                      .attr("x", 0)
                      .attr("dy", "-0.6em")
                      .text(firstLine);
            
            // Add second line
            textElement.append("tspan")
                      .attr("x", 0)
                      .attr("dy", "1.2em")
                      .text(secondLine);
          }
          
          // Add title for tooltip
          textElement.append("title")
                    .text(name);
        })
        .transition()
        .delay(600)
        .duration(800)
        .style("opacity", 1);

      nodeElements
        .append("text")
        .attr("class", "node-type-text")
        .attr("font-size", "8px")
        .attr("font-style", "italic")
        .attr("dy", (d: D3Node) => getNodeRadius(d.id) + 14) // Position it back outside the node
        .attr("text-anchor", "middle")
        .attr("fill", d3MutedForegroundColor) // Revert to original color
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("filter", "url(#text-shadow)")
        .text((d: D3Node) => d.label || "Unknown") // Revert to original display
        .transition()
        .delay(700)
        .duration(800)
        .style("opacity", 1);

      nodeElements.each(function (d: D3Node) {
        d3.select(this)
          .append("title")
          .text(
            () =>
              `${d.properties?.name || `Node ${d.id}`} (${
                d.label || "Unknown"
              })`
          );
      });

      nodeElements.on("click", (event: MouseEvent, clickedNode: D3Node) => {
        // Stop propagation and prevent default to ensure the SVG click handler doesn't fire
        event.stopPropagation();
        event.preventDefault();
        
        console.log("Node clicked:", clickedNode.id);
        
        const newlyConnected = getConnectedNodeIds(clickedNode.id);
        
        // Reset relationship selection and edit states
        setSelectedRelationship(null);
        selectedRelationshipRef.current = null;
        setIsEditingRelationship(false);
        
        // Set node selection
        setSelectedNode(clickedNode);
        selectedNodeRef.current = clickedNode;
        setConnectedNodes(newlyConnected);
        setShowCategorized(true);
        setIsEditing(false);
        
        // Set view mode to selection
        setViewMode('selection');

        if (onNodeSelected) {
          onNodeSelected(clickedNode);
        }

        const t = d3.transition().duration(300);
        
        // Get theme colors directly to avoid dependency issues
        const isDarkTheme =
          resolvedTheme === "dark" ||
          document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark";
        
        const textColor = isDarkTheme ? "#FFFFFF" : "#0A0A0A";

        // IMPORTANT: Create sets for faster lookup
        const selectedNodeId = clickedNode.id;
        const connectedNodeIds = new Set(newlyConnected);

        // First dim ALL nodes and text to create a clean slate
        g.selectAll(".nodes g .node-circle")
          .transition(t)
          .attr("opacity", 0.15)
          .style("opacity", 0.15)
          .attr("stroke-width", 1);
        
        // Dim ALL text elements using direct selection and double styling
        // Use very low opacity (0.08) for better contrast with highlighted nodes
        g.selectAll(".nodes g .node-name-text")
          .transition(t)
          .attr("opacity", 0.08)
          .style("opacity", 0.08)
          .attr("fill", "#FFFFFF"); // Keep white color but very dim
        
        g.selectAll(".nodes g .node-type-text")
          .transition(t)
          .attr("opacity", 0.08)
          .style("opacity", 0.08);

        // Dim relationships
        g.selectAll(".links line")
          .transition(t)
          .attr("stroke-opacity", 0.15)
          .style("stroke-opacity", 0.15)
          .attr("stroke-width", 1);
        
        g.selectAll(".links text")
          .transition(t)
          .attr("opacity", 0.1)
          .style("opacity", 0.1);
          
        // THEN highlight the selected node and its connected nodes
        // Apply highlighting to selected node 
        g.selectAll(".nodes g")
          .filter(function(d: any) { return d.id === selectedNodeId; })
          .each(function() {
            const node = d3.select(this);
            
            // Circle
            node.select(".node-circle")
              .transition(t)
              .attr("opacity", 1)
              .style("opacity", 1) // Force with style too
              .attr("stroke-width", 2.5)
              .attr("stroke", textColor);
              
            // Text elements - force with both attr and style
            node.select(".node-name-text")
              .transition(t)
              .attr("opacity", 1)
              .style("opacity", 1)
              .attr("fill", "#FFFFFF");
              
            node.select(".node-type-text")
              .transition(t)
              .attr("opacity", 1)
              .style("opacity", 1);
          });
          
        // Apply highlighting to connected nodes
        g.selectAll(".nodes g")
          .filter(function(d: any) { return connectedNodeIds.has(d.id); })
          .each(function() {
            const node = d3.select(this);
            
            // Circle
            node.select(".node-circle")
              .transition(t)
              .attr("opacity", 0.8)
              .style("opacity", 0.8)
              .attr("stroke-width", 1.5);
              
            // Text elements - force with both attr and style
            node.select(".node-name-text")
              .transition(t)
              .attr("opacity", 0.7)
              .style("opacity", 0.7)
              .attr("fill", "#FFFFFF");
              
            node.select(".node-type-text")
              .transition(t)
              .attr("opacity", 0.7)
              .style("opacity", 0.7);
          });
          
        // Highlight related relationships
        g.selectAll(".links g").each(function(d: any) {
          const relationship = d3.select(this);
          const sourceId = typeof d.source === "object" ? d.source.id : d.source;
          const targetId = typeof d.target === "object" ? d.target.id : d.target;
          
          // Check if this relationship is connected to the selected node
          const isRelated = (sourceId === selectedNodeId || targetId === selectedNodeId);
          
          if (isRelated) {
            // Highlight related relationship
            relationship.select("line")
              .transition(t)
              .attr("stroke-opacity", 0.8)
              .style("stroke-opacity", 0.8)
              .attr("stroke-width", 2)
              .attr("stroke", textColor);
            
            relationship.select("text")
              .transition(t)
              .attr("opacity", 1)
              .style("opacity", 1)
              .attr("font-weight", "bold")
              .attr("fill", textColor);
          }
        });
      });

      // Create a transition for following svg operations
      const t = d3.transition().duration(300);
      
      svg.selectAll(".links text")
        .transition(t)
        .attr("fill", textColor)
        .attr("opacity", 0.7)
        .style("opacity", 0.7)
        .attr("font-weight", "normal");

      simulationRef.current = simulation;

      setInitialized(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, theme, resolvedTheme, initialized, nodeColors]);

  // First, let's fix the updateThemeColors function to avoid unnecessary repaints
  useEffect(() => {
    if (!initialized || !svgRef.current) return;

    const updateThemeColors = () => {
      const { textColor, mutedForegroundColor, linkColor } = getThemeColors();

      const svg = d3.select(svgRef.current!);

      // Safely select elements and check if they exist before calling .attr
      const nodeNameEl = svg.select(".node-name-text").node();
      const linkTextEl = svg.select(".links text").node();
      
      // Only update node name color if elements exist
      if (nodeNameEl) {
        svg.selectAll(".node-name-text").attr("fill", "#FFFFFF");
      }

      // Only update link text if elements exist
      if (linkTextEl) {
        const currentLinkTextColor = linkTextEl ? d3.select(linkTextEl).attr("fill") : null;
        if (!currentLinkTextColor || currentLinkTextColor !== textColor) {
          svg.selectAll(".links text").attr("fill", textColor);
        }
      }

      // Safely select and update other elements
      svg.selectAll(".node-type-text").attr("fill", mutedForegroundColor);
      
      const arrowEl = svg.select("#arrow path").node();
      if (arrowEl) {
        svg.select("#arrow path").attr("fill", textColor);
      }
      
      const linksEl = svg.selectAll(".links line").node();
      if (linksEl) {
        svg.selectAll(".links line").attr("stroke", linkColor);
      }
    };

    // Use a timeout instead of requestAnimationFrame to reduce the chance of flickering
    const updateTimeout = setTimeout(() => {
      try {
        updateThemeColors();
      } catch (err) {
        console.error("Error updating theme colors:", err);
      }
    }, 150);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" ||
            mutation.attributeName === "data-theme")
        ) {
          // Again, use timeout instead of requestAnimationFrame
          const themeChangeTimeout = setTimeout(() => {
            try {
              updateThemeColors();
            } catch (err) {
              console.error("Error updating theme colors on theme change:", err);
            }
          }, 150);
          return () => clearTimeout(themeChangeTimeout);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      observer.disconnect();
      clearTimeout(updateTimeout);
    };
  }, [theme, resolvedTheme, initialized]);

  const handleNodeUpdate = async (updatedNode: any) => {
    setIsEditing(false);
    if (selectedNode) {
      const updatedNodes = data.nodes.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      );
      setSelectedNode(updatedNode);
      if (onNodeSelected) {
        onNodeSelected(updatedNode);
      }
    }
  };

  const handleRelationshipUpdate = async (updatedRelationship: any) => {
    setIsEditingRelationship(false);
    
    // Clear the selected relationship
    setSelectedRelationship(null);

    // If the relationship has a new ID (type was changed, which creates a new relationship in Neo4j)
    if (updatedRelationship.oldId && updatedRelationship.id !== updatedRelationship.oldId) {
      // First remove the old relationship visually
      if (svgRef.current) {
        const oldRelationshipId = updatedRelationship.oldId;
        
        // Remove the old relationship from the visualization
        d3.select(svgRef.current)
          .selectAll(".links line")
          .filter((d: any) => d.id === parseInt(oldRelationshipId, 10))
          .transition()
          .duration(300)
          .style("opacity", 0)
          .remove();
        
        d3.select(svgRef.current)
          .selectAll(".links text")
          .filter((d: any) => d.id === parseInt(oldRelationshipId, 10))
          .transition()
          .duration(300)
          .style("opacity", 0)
          .remove();
      }
      
      // Inform the parent component to refresh the graph data
      if (onRelationshipSelected) {
        onRelationshipSelected(null);
      }
    } else {
      // Just a property update, update the selected relationship to reflect the changes
      if (selectedRelationship) {
        setSelectedRelationship(updatedRelationship);
        
        // Update relationship type label in the visualization
        if (svgRef.current && selectedRelationship.id) {
          d3.select(svgRef.current)
            .selectAll(".links text")
            .filter((d: any) => d.id === selectedRelationship.id)
            .text(updatedRelationship.type);
        }
        
        if (onRelationshipSelected) {
          onRelationshipSelected(updatedRelationship);
        }
      }
    }
  };

  const handleRelationshipDelete = async (deletedRelationship: any) => {
    // Close the edit form
    setIsEditingRelationship(false);
    // Clear the selected relationship
    setSelectedRelationship(null);
    
    // Optionally, update the graph to remove the relationship visually
    // This could involve removing the relationship line from the D3 visualization
    if (svgRef.current) {
      const relationshipId = deletedRelationship.id;
      d3.select(svgRef.current)
        .selectAll(".links line")
        .filter((d: any) => d.id === relationshipId)
        .transition()
        .duration (300)
        .style("opacity", 0)
        .remove();
      
      d3.select(svgRef.current)
        .selectAll(".links text")
        .filter((d: any) => d.id === relationshipId)
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();
    }
  };
  
  const handleNodeDelete = async (deletedNode: any) => {
    // Close the edit form
    setIsEditing(false);
    // Clear the selected node
    setSelectedNode(null);
    
    // Update the graph to remove the node visually
    if (svgRef.current) {
      const nodeId = deletedNode.id;
      
      // Remove the node from the visualization
      d3.select(svgRef.current)
        .selectAll(".nodes g")
        .filter((d: any) => d.id === nodeId)
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();
        
      // Also remove any connected relationships
      d3.select(svgRef.current)
        .selectAll(".links line")
        .filter((d: any) => d.source.id === nodeId || d.target.id === nodeId)
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();
        
      d3.select(svgRef.current)
        .selectAll(".links text")
        .filter((d: any) => d.source.id === nodeId || d.target.id === nodeId)
        .transition()
        .duration(300)
        .style("opacity", 0)
        .remove();
    }
    
    // Notify parent component
    if (onNodeSelected) {
      onNodeSelected(null);
    }
  };

  // Update the search highlighting function
  useEffect(() => {
    // Exit early if nothing to do
    if (!searchHighlight || !initialized || !svgRef.current || !data.nodes.length) {
      // If search is cleared, update view mode only if we're in search mode
      if (viewMode === 'search' && !searchHighlight) {
        setViewMode('standard');
        matchingNodeIdsRef.current = new Set();
      }
      return;
    }

    // Skip if we have a relationship selected
    if (selectedRelationship) {
      return;
    }

    const svgEl = svgRef.current;
    const searchTerm = searchHighlight.toLowerCase();

    // Find matching node IDs
    const matchingNodeIds = new Set<number>();

    data.nodes.forEach(node => {
      const nodeName = String(node.properties?.name || '').toLowerCase();
      if (nodeName.includes(searchTerm)) {
        const nodeId = typeof node.id === "object" && node.id !== null 
          ? node.id.low 
          : Number(node.id);
        matchingNodeIds.add(nodeId);
      }
    });

    // Store matching nodes in ref for other handlers to access
    matchingNodeIdsRef.current = matchingNodeIds;

    // If no matching nodes, exit early
    if (matchingNodeIds.size === 0) {
      setViewMode('standard');
      // Dispatch event to indicate no results were found
      window.dispatchEvent(new CustomEvent('searchResultsCount', { 
        detail: { count: 0, term: searchHighlight } 
      }));
      return;
    }

    // Set view mode to search unless we're already in selection mode
    if (viewMode !== 'selection') {
      setViewMode('search');
    }

    // Create an event to signal the count of matched nodes
    window.dispatchEvent(new CustomEvent('searchResultsCount', { 
      detail: { count: matchingNodeIds.size, term: searchHighlight } 
    }));

    // Small delay to ensure D3 has finished rendering, then apply search highlighting
    setTimeout(() => {
      try {
        // Skip if we're already in selection mode (a node is selected)
        if (viewMode === 'selection' || selectedNode) return;

        // Get theme colors directly instead of using function from deps
        const isDarkTheme =
          resolvedTheme === "dark" ||
          document.documentElement.classList.contains("dark") ||
          document.documentElement.getAttribute("data-theme") === "dark";

        const textColor = isDarkTheme ? "#FFFFFF" : "#0A0A0A";
        
        // Use D3 to select elements for better control
        const svg = d3.select(svgEl);
        
        // Setup zoom behavior that matches the original zoom behavior
        const zoom = d3.zoom()
          .scaleExtent([0.1, 8])
          .on("zoom", (event) => {
            // Find the container group
            const g = svg.select("g g");
            if (g.size() > 0) {
              g.attr("transform", event.transform);
            }
          });
          
        // Make sure the SVG has zoom behavior
        svg.call(zoom as any);
        
        // Calculate appropriate zoom level based on number of matches
        // More nodes = more zoomed out
        const zoomScale = matchingNodeIds.size > 10 ? 0.3 : 
                         matchingNodeIds.size > 5 ? 0.4 : 
                         matchingNodeIds.size > 2 ? 0.5 : 0.7;
                        
        // Use a smoother transition for better UX
        svg.transition()
          .duration(850)
          .ease(d3.easeCubicOut)
          .call(
            zoom.transform as any, 
            d3.zoomIdentity.scale(zoomScale).translate(
              window.innerWidth / 4, 
              window.innerHeight / 4
            )
          );
        
        // Remove any previous search indicators (avoid duplicates)
        svg.selectAll('.search-indicator').remove();
        
        // Create transitions for all elements (same as in click handler)
        const t = d3.transition().duration(300);
        
        // First, dim all nodes with transitions
        svg.selectAll('.nodes g .node-circle')
          .transition(t)
          .attr('opacity', 0.15)
          .style('opacity', 0.15)
          .attr('stroke-width', 1);
        
        // Dim ALL text elements using transitions and the same approach as click handler
        svg.selectAll('.nodes g .node-name-text')
          .transition(t)
          .attr('opacity', 0.08)
          .style('opacity', 0.08)
          .attr('fill', '#FFFFFF'); // Keep white color but very dim
        
        svg.selectAll('.nodes g .node-type-text')
          .transition(t)
          .attr('opacity', 0.08)
          .style('opacity', 0.08);
        
        // Dim relationships with transitions
        svg.selectAll('.links line')
          .transition(t)
          .attr('stroke-opacity', 0.15)
          .style('stroke-opacity', 0.15)
          .attr('stroke-width', 1);
        
        svg.selectAll('.links text')
          .transition(t)
          .attr('opacity', 0.1)
          .style('opacity', 0.1);
        
        // Highlight matching nodes with transitions
        svg.selectAll('.nodes g')
          .filter(function() {
            const nodeId = Number(d3.select(this).attr('data-id'));
            return matchingNodeIds.has(nodeId);
          })
          .each(function() {
            const node = d3.select(this);
            
            // Highlight the circle
            node.select('.node-circle')
              .transition(t)
              .attr('opacity', 1)
              .style('opacity', 1)
              .attr('stroke-width', 2.5)
              .attr('stroke', textColor);
            
            // Highlight name text with better forced visibility
            node.select('.node-name-text')
              .transition(t)
              .attr('opacity', 1)
              .style('opacity', 1)
              .attr('fill', '#FFFFFF');
            
            // Highlight type text
            node.select('.node-type-text')
              .transition(t)
              .attr('opacity', 1)
              .style('opacity', 1);
          });
        
      } catch (error) {
        console.error("Error applying search highlighting:", error);
      }
    }, 100);

  }, [searchHighlight, initialized, svgRef, data.nodes, selectedNode, selectedRelationship, viewMode, resolvedTheme]);

  return (
    <div className="flex flex-col h-full w-full relative isolate">
      <svg
        ref={svgRef}
        className="w-full h-full bg-transparent text-foreground"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          cursor: "grab",
        }}
        preserveAspectRatio="xMidYMid meet"
      />

      {selectedNode && (
        <div 
          className="absolute bottom-5 right-5 p-4 bg-card text-card-foreground shadow-xl rounded-lg max-w-md w-full sm:w-auto border border-border transition-all duration-300 ease-in-out transform-gpu motion-safe:animate-fadeInUp"
          style={{ 
            zIndex: selectedRelationship ? 20 : 30, 
            display: selectedRelationship ? 'none' : 'block'
          }}
        >
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-lg font-semibold truncate pr-2"
                  title={
                    selectedNode.properties?.name || `Node ${selectedNode.id}`
                  }
                >
                  {selectedNode.properties?.name || `Node ${selectedNode.id}`}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    title="Editar Nó"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <span
                    className="inline-block w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        nodeColors[selectedNode.label] || defaultColor,
                    }}
                  ></span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Tipo: {selectedNode.label || "Unknown"}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 text-sm mb-3 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-card-background">
                {selectedNode.properties &&
                  Object.entries(selectedNode.properties)
                    .filter(([key]) => key !== "name")
                    .map(([key, value]) => (
                      <div key={key} className="flex ">
                        <span className="font-medium mr-2 text-muted-foreground capitalize whitespace-nowrap">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="truncate" title={String(value)}>
                          {typeof value === "object" && value !== null
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Conexões: {connectedNodes.length}
                </span>
              </div>
              <button
                className="mt-4 w-full px-4 py-2 text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-card"
                onClick={() => {
                  svgRef.current?.dispatchEvent(
                    new MouseEvent("click", { bubbles: true })
                  );
                }}
              >
                Fechar
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Editar Nó</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (formChanged) {
                        setShowExitConfirmation(true);
                      } else {
                        setIsEditing(false);
                      }
                    }}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <span
                    className="inline-block w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        nodeColors[selectedNode.label] || defaultColor,
                    }}
                  ></span>
                </div>
              </div>
              <NodeEditForm
                node={selectedNode}
                onSave={handleNodeUpdate}
                onCancel={() => setIsEditing(false)}
                onFormChanged={setFormChanged}
                onDelete={handleNodeDelete}
              />
            </div>
          )}
        </div>
      )}

      {selectedRelationship && (
        <div
          className={`absolute bottom-0 right-0 mb-8 mr-8 w-80 p-4 bg-card border rounded-lg shadow-lg transition-all duration-300 ${
            isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ 
            zIndex: selectedNode ? 20 : 30,
            display: selectedNode ? 'none' : 'block'
          }}
        >
          {isEditingRelationship ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Editar Relacionamento</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (formChanged) {
                        setShowExitConfirmation(true);
                      } else {
                        setIsEditingRelationship(false);
                      }
                    }}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <RelationshipEditForm
                relationship={selectedRelationship}
                onSave={handleRelationshipUpdate}
                onCancel={() => setIsEditingRelationship(false)}
                onFormChanged={setFormChanged}
                onDelete={handleRelationshipDelete}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Relacionamento</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingRelationship(true)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    title="Editar Relacionamento"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedRelationship(null)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-muted rounded-md">
                <div className="text-xs uppercase text-muted-foreground mb-1">Tipo</div>
                <div className="font-medium">{selectedRelationship.type}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs uppercase text-muted-foreground mb-1">De</div>
                  <div className="font-medium truncate">
                    {typeof selectedRelationship.source === "object" 
                      ? selectedRelationship.source.properties?.name || `Node ID: ${selectedRelationship.source.id}` 
                      : `Node ID: ${selectedRelationship.source}`}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Para</div>
                  <div className="font-medium truncate">
                    {typeof selectedRelationship.target === "object" 
                      ? selectedRelationship.target.properties?.name || `Node ID: ${selectedRelationship.target.id}` 
                      : `Node ID: ${selectedRelationship.target}`}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Propriedades</h4>
                
                {Object.keys(selectedRelationship.properties || {}).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedRelationship.properties || {}).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}:
                        </div>
                        <div className="col-span-2 font-mono break-all">
                          {formatValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Nenhuma propriedade
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showCategorized && (
        <div className="absolute top-5 left-5 w-72 max-h-[calc(100vh-40px)] overflow-y-auto bg-card text-card-foreground shadow-xl rounded-lg p-4 z-20 border border-border transition-all duration-300 ease-in-out transform-gpu motion-safe:animate-fadeInDown scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-card-background">
          <h3 className="text-base font-semibold mb-3 text-center">
            Nós Próximos
          </h3>

          {Object.entries(categorizedNodes)
            .filter(([_, nodes]) =>
              nodes.some(
                (node) =>
                  node.id === selectedNode?.id ||
                  connectedNodes.includes(node.id)
              )
            )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, nodes]) => {
              const filteredNodes = nodes.filter(
                (node) =>
                  node.id === selectedNode?.id ||
                  connectedNodes.includes(node.id)
              );

              if (filteredNodes.length === 0) return null;

              return (
                <div key={category} className="mb-3.5 last:mb-0">
                  <div
                    className="flex items-center pb-1.5 mb-1.5 border-b text-sm"
                    style={{
                      borderColor: nodeColors[category] || defaultColor,
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{
                        backgroundColor: nodeColors[category] || defaultColor,
                      }}
                    ></span>
                    <h4 className="font-medium truncate" title={category}>
                      {category} ({filteredNodes.length})
                    </h4>
                  </div>
                  <ul className="space-y-1 pl-1">
                    {filteredNodes.map((node) => (
                      <li
                        key={node.id}
                        className={`text-xs truncate hover:bg-muted/50 px-2 py-1 rounded cursor-pointer transition-colors focus-visible:ring-1 focus-visible:ring-ring ${
                          node.id === selectedNode?.id
                            ? "font-semibold bg-muted"
                            : ""
                        }`}
                        title={node.properties.name}
                        onClick={(e) => {
                          const nodeElement = d3
                            .select(svgRef.current)
                            .selectAll(".nodes g")
                            .filter((d: any) => d.id === node.id)
                            .node() as SVGElement | null;
                          if (nodeElement) {
                            nodeElement.dispatchEvent(
                              new MouseEvent("click", { bubbles: true })
                            );
                          }
                          e.stopPropagation();
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            const nodeElement = d3
                              .select(svgRef.current)
                              .selectAll(".nodes g")
                              .filter((d: any) => d.id === node.id)
                              .node() as SVGElement | null;
                            if (nodeElement) {
                              nodeElement.dispatchEvent(
                                new MouseEvent("click", { bubbles: true })
                              );
                            }
                          }
                        }}
                      >
                        {node.properties.name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      )}

      <Dialog
        open={showExitConfirmation}
        onOpenChange={setShowExitConfirmation}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to exit the
              editor?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExitConfirmation(false)}
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitConfirmation(false);
                setFormChanged(false);
                setIsEditing(false);
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
