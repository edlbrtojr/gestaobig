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
  Departamento: "#009688", // Teal
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
  Departamento: "#FFFFFF", // White on Teal
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
  
  // Check every 5 minutes instead of 30 seconds to reduce refresh frequency
  const interval = setInterval(pollSchema, 300000);
  
  return () => clearInterval(interval);
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

  // Load node colors from schema
  const loadNodeColors = async () => {
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
      
      // Check if colors actually changed before updating state
      let colorsChanged = false;
      
      // Only check keys that exist in either object
      const allKeys = new Set([...Object.keys(nodeColors), ...Object.keys(newColors)]);
      
      for (const key of allKeys) {
        if (nodeColors[key] !== newColors[key]) {
          colorsChanged = true;
          break;
        }
      }
      
      if (colorsChanged) {
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
    // Handler for custom event
    const handleSchemaUpdated = () => {
      loadNodeColors();
    };
    
    // Listen for direct schema update events
    window.addEventListener('schemaUpdated', handleSchemaUpdated);
    
    // Set up polling for schema changes 
    const cleanupPolling = setupSchemaPolling(() => {
      loadNodeColors();
    });
    
    // Initial load of colors
    loadNodeColors();
    
    return () => {
      window.removeEventListener('schemaUpdated', handleSchemaUpdated);
      cleanupPolling();
    };
  }, []);

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
        const minRadius = 18; // Increased from 15 (15 * 1.2 = 18)
        const maxRadius = 54; // Increased from 45 (45 * 1.2 = 54)
        const minConnections = 0;
        const maxConnections = Math.max(
          ...Array.from(connectionCounts.values())
        );
        if (maxConnections === minConnections) return minRadius;

        // Apply non-linear scaling to emphasize differences in connection count
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

      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom as any);

      // Double-click to zoom reset
      svg.on("dblclick.zoom", null);
      svg.on("dblclick", () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      });

      // Configure the simulation with gentler forces
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(validLinks)
            .id((d: any) => d.id)
            .distance(150)
            .strength(0.2) // Reduced strength for gentler animation
        )
        .force("charge", d3.forceManyBody().strength(-500)) // Stronger repulsion for better spacing
        .force(
          "center",
          d3.forceCenter(containerWidth / 2, containerHeight / 2)
        )
        .force(
          "collide",
          d3.forceCollide().radius((d: any) => getNodeRadius(d.id) + 10)
        )
        .alpha(0.3) // Lower alpha for calmer initial animation
        .alphaDecay(0.015); // Slower decay for smoother movement

      simulation.on("tick", () => {
        g.selectAll(".links line")
          .attr("x1", (d: any) => {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            return sourceNode?.x ?? 0; // Fallback to 0 if node not found
          })
          .attr("y1", (d: any) => {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            return sourceNode?.y ?? 0; // Fallback to 0
          })
          .attr("x2", (d: any) => {
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            return targetNode?.x ?? 0; // Fallback to 0
          })
          .attr("y2", (d: any) => {
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            return targetNode?.y ?? 0; // Fallback to 0
          });
        g.selectAll(".links text")
          .attr("x", (d: any) => {
            const sourceNode = nodeMap.get(
              typeof d.source === "object" ? d.source.id : d.source
            ) as D3Node | undefined;
            const targetNode = nodeMap.get(
              typeof d.target === "object" ? d.target.id : d.target
            ) as D3Node | undefined;
            return ((sourceNode?.x ?? 0) + (targetNode?.x ?? 0)) / 2;
          })
          .attr("y", (d: any) => {
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
        .attr("stroke", d3LinkColor)
        .attr("stroke-opacity", 0)
        .attr("stroke-width", 1.5)
        .attr("marker-end", "url(#arrow)")
        .attr("data-id", (d: D3Link) => d.id)
        .style("cursor", "pointer")
        .on("click", (event: MouseEvent, d: D3Link) => {
          event.stopPropagation();
          // Reset node selection and edit states
          setSelectedNode(null);
          setConnectedNodes([]);
          setIsEditing(false);
          // Set relationship selection
          setSelectedRelationship(d);
          setIsEditingRelationship(false);
          if (onRelationshipSelected) {
            onRelationshipSelected(d);
          }
          
          // Highlight only this relationship and its connected nodes
          const t = d3.transition().duration(300);
          const { textColor } = getThemeColors();
          const sourceId = typeof d.source === "object" ? d.source.id : d.source;
          const targetId = typeof d.target === "object" ? d.target.id : d.target;

          // Dim all nodes
          g.selectAll(".nodes g")
            .selectAll(".node-circle")
            .transition(t)
            .attr("opacity", 0.25)
            .attr("stroke-width", 1);
          
          // Dim ALL text elements
          g.selectAll(".nodes g")
            .selectAll("text")
            .transition(t)
            .attr("opacity", 0.2);

          // Dim all relationships
          g.selectAll(".links line")
            .transition(t)
            .attr("stroke-opacity", 0.15)
            .attr("stroke-width", 1);
          
          g.selectAll(".links text")
            .transition(t)
            .attr("opacity", 0.15);

          // Highlight the relationship line (in same group as the text)
          const parentElement = (event.currentTarget as Element).parentNode as Element;
          if (parentElement) {
            d3.select(parentElement)
              .select("line")
              .transition(t)
              .attr("stroke-opacity", 1)
              .attr("stroke-width", 2.5)
              .attr("stroke", textColor);
          }
          
          // Highlight this relationship text
          d3.select(event.currentTarget as Element)
            .transition(t)
            .attr("opacity", 1)
            .attr("font-weight", "bold")
            .attr("fill", textColor);

          // Highlight the connected nodes
          const connectedNodeSelector = g.selectAll(".nodes g")
            .filter(function(d: any) { 
              return d.id === sourceId || d.id === targetId;
            });
            
          connectedNodeSelector.selectAll(".node-circle")
            .transition(t)
            .attr("opacity", 1)
            .attr("stroke-width", 2)
            .attr("stroke", textColor);
          
          connectedNodeSelector.selectAll("text")
            .transition(t)
            .attr("opacity", 1);
        })
        .transition()
        .delay(800)
        .duration(500)
        .attr("stroke-opacity", 0.5);

      svg
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("fill", d3TextColor)
        .attr("d", "M0,-5L10,0L0,5");

      linkElements
        .append("text")
        .text((d: D3Link) => d.type)
        .attr("font-size", "9px")
        .attr("text-anchor", "middle")
        .attr("dy", "-5")
        .attr("fill", textColor)
        .attr("opacity", 0)
        .style("pointer-events", "all")
        .style("cursor", "pointer")
        .on("click", (event: MouseEvent, d: D3Link) => {
          event.stopPropagation();
          // Reset node selection and edit states
          setSelectedNode(null);
          setConnectedNodes([]);
          setIsEditing(false);
          // Set relationship selection
          setSelectedRelationship(d);
          setIsEditingRelationship(false);
          if (onRelationshipSelected) {
            onRelationshipSelected(d);
          }
          
          // Highlight only this relationship and its connected nodes
          const t = d3.transition().duration(300);
          const { textColor } = getThemeColors();
          const sourceId = typeof d.source === "object" ? d.source.id : d.source;
          const targetId = typeof d.target === "object" ? d.target.id : d.target;

          // Dim all nodes
          g.selectAll(".nodes g")
            .selectAll(".node-circle")
            .transition(t)
            .attr("opacity", 0.25)
            .attr("stroke-width", 1);
          
          // Dim ALL text elements
          g.selectAll(".nodes g")
            .selectAll("text")
            .transition(t)
            .attr("opacity", 0.2);

          // Dim all relationships
          g.selectAll(".links line")
            .transition(t)
            .attr("stroke-opacity", 0.15)
            .attr("stroke-width", 1);
          
          g.selectAll(".links text")
            .transition(t)
            .attr("opacity", 0.15);

          // Highlight the relationship line (in same group as the text)
          const parentElement = (event.currentTarget as Element).parentNode as Element;
          if (parentElement) {
            d3.select(parentElement)
              .select("line")
              .transition(t)
              .attr("stroke-opacity", 1)
              .attr("stroke-width", 2.5)
              .attr("stroke", textColor);
          }
          
          // Highlight this relationship text
          d3.select(event.currentTarget as Element)
            .transition(t)
            .attr("opacity", 1)
            .attr("font-weight", "bold")
            .attr("fill", textColor);

          // Highlight the connected nodes
          const connectedNodeSelector = g.selectAll(".nodes g")
            .filter(function(d: any) { 
              return d.id === sourceId || d.id === targetId;
            });
            
          connectedNodeSelector.selectAll(".node-circle")
            .transition(t)
            .attr("opacity", 1)
            .attr("stroke-width", 2)
            .attr("stroke", textColor);
          
          connectedNodeSelector.selectAll("text")
            .transition(t)
            .attr("opacity", 1);
        })
        .transition()
        .delay(1000)
        .duration(500)
        .attr("opacity", 0.7);

      const drag = d3
        .drag<Element, D3Node>()
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

      nodeElements.on("click", (event: MouseEvent, d: D3Node) => {
        event.stopPropagation();
        const newlyConnected = getConnectedNodeIds(d.id);
        // Reset relationship selection and edit states
        setSelectedRelationship(null);
        setIsEditingRelationship(false);
        // Set node selection
        setSelectedNode(d);
        setConnectedNodes(newlyConnected);
        setShowCategorized(true);
        setIsEditing(false);

        if (onNodeSelected) {
          onNodeSelected(d);
        }

        const t = d3.transition().duration(300);
        const { textColor } = getThemeColors();

        // First, dim ALL node elements
        g.selectAll(".nodes g")
          .selectAll(".node-circle")
          .transition(t)
          .attr("opacity", 0.25)
          .attr("stroke-width", 1);
          
        // Forcefully dim ALL text elements by selecting them directly
        g.selectAll(".nodes g")
          .selectAll("text")
          .transition(t)
          .attr("opacity", 0.2);
        
        // Dim all relationships
        g.selectAll(".links line")
          .transition(t)
          .attr("stroke-opacity", 0.15)
          .attr("stroke-width", 1);
        
        g.selectAll(".links text")
          .transition(t)
          .attr("opacity", 0.15);

        // Then highlight the selected node
        const selectedSvgNode = d3.select(event.currentTarget as Element);
        selectedSvgNode.select(".node-circle")
          .transition(t)
          .attr("opacity", 1)
          .attr("stroke-width", 2.5)
          .attr("stroke", textColor);
        
        // Make ALL text elements for selected node visible
        selectedSvgNode.selectAll("text")
          .transition(t)
          .attr("opacity", 1);

        // Highlight connected nodes
        const connectedNodes = g.selectAll(".nodes g")
          .filter(function(n: any) { 
            return newlyConnected.includes(n.id);
          });
        
        connectedNodes.selectAll(".node-circle")
          .transition(t)
          .attr("opacity", 0.9)
          .attr("stroke-width", 2);
        
        // Make ALL text elements for connected nodes partially visible
        connectedNodes.selectAll("text")
          .transition(t)
          .attr("opacity", 0.8);

        // Highlight related relationships
        const relatedLinks = g.selectAll(".links g").filter(
          function(l: any) {
            const sourceId = typeof l.source === "object" ? l.source.id : l.source;
            const targetId = typeof l.target === "object" ? l.target.id : l.target;
            return sourceId === d.id || targetId === d.id;
          }
        );
        
        relatedLinks.selectAll("line")
          .transition(t)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 2)
          .attr("stroke", textColor);
        
        relatedLinks.selectAll("text")
          .transition(t)
          .attr("opacity", 1)
          .attr("font-weight", "bold")
          .attr("fill", textColor);
      });

      svg.on("click", () => {
        setSelectedNode(null);
        setSelectedRelationship(null);
        setConnectedNodes([]);
        setShowCategorized(false);
        setIsEditing(false);
        setIsEditingRelationship(false);

        if (onNodeSelected) {
          onNodeSelected(null);
        }

        const t = d3.transition().duration(300);

        const { textColor, linkColor } = getThemeColors();

        const nodeElements = d3.select(svgRef.current).selectAll(".nodes g");
        nodeElements
          .selectAll(".node-circle")
          .transition(t)
          .attr("opacity", 1)
          .attr(
            "stroke",
            (n: any) =>
              d3
                .color(nodeColors[n.label] || defaultColor)
                ?.darker(0.7)
                .toString() || d3NodeBorderColor
          )
          .attr("stroke-width", 1.5);
        nodeElements
          .selectAll(".node-name-text")
          .transition(t)
          .attr("opacity", 1)
          .attr("fill", "#FFFFFF");
        nodeElements
          .selectAll(".node-type-text")
          .transition(t)
          .attr("opacity", 1);
        d3.select(svgRef.current)
          .selectAll(".links line")
          .transition(t)
          .attr("stroke", linkColor)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", 1.5);
        d3.select(svgRef.current)
          .selectAll(".links text")
          .transition(t)
          .attr("fill", textColor)
          .attr("opacity", 0.7)
          .attr("font-weight", "normal");
      });

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

  // Create a separate useEffect for the SVG click handler that avoids blinking
  useEffect(() => {
    // Skip if not initialized yet or no SVG reference
    if (!initialized || !svgRef.current) return;

    // Create a one-time flag to track if this is the first click
    let isFirstClick = true;

    // Get the SVG element
    const svg = d3.select(svgRef.current);
    
    // Remove any existing click handlers first
    svg.on("click", null);
    
    // Add our new handler
    svg.on("click", () => {
      // If first click and no selection, don't apply visual changes
      if (isFirstClick && !selectedNode && !selectedRelationship) {
        isFirstClick = false;
        
        // Just update state without visual changes
        setSelectedNode(null);
        setSelectedRelationship(null);
        setConnectedNodes([]);
        setShowCategorized(false);
        setIsEditing(false);
        setIsEditingRelationship(false);

        if (onNodeSelected) {
          onNodeSelected(null);
        }
        
        return;
      }
      
      // Not first click, proceed as normal
      setSelectedNode(null);
      setSelectedRelationship(null);
      setConnectedNodes([]);
      setShowCategorized(false);
      setIsEditing(false);
      setIsEditingRelationship(false);

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

      // Apply visual changes
      svg.selectAll(".nodes g")
        .selectAll(".node-circle")
        .transition(t)
        .attr("opacity", 1)
        .attr(
          "stroke",
          (n: any) =>
            d3
              .color(nodeColors[n.label] || defaultColor)
              ?.darker(0.7)
              .toString() || `hsl(${borderColor})`
        )
        .attr("stroke-width", 1.5);

      svg.selectAll(".nodes g")
        .selectAll(".node-name-text")
        .transition(t)
        .attr("opacity", 1)
        .attr("fill", "#FFFFFF");

      svg.selectAll(".nodes g")
        .selectAll(".node-type-text")
        .transition(t)
        .attr("opacity", 1);

      svg.selectAll(".links line")
        .transition(t)
        .attr("stroke", linkColor)
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.5);

      svg.selectAll(".links text")
        .transition(t)
        .attr("fill", textColor)
        .attr("opacity", 0.7)
        .attr("font-weight", "normal");
    });
    
    // Cleanup handler when component unmounts or re-initializes
    return () => {
      svg.on("click", null);
    };
  }, [initialized, nodeColors, onNodeSelected, selectedNode, selectedRelationship, resolvedTheme]);

  // First, let's fix the updateThemeColors function to avoid unnecessary repaints
  useEffect(() => {
    if (!initialized || !svgRef.current) return;

    const updateThemeColors = () => {
      const { textColor, mutedForegroundColor, linkColor } = getThemeColors();

      const svg = d3.select(svgRef.current!);

      // Instead of immediately updating colors, check if we need to update
      const currentNodeNameColor = svg.select(".node-name-text").attr("fill");
      const currentLinkTextColor = svg.select(".links text").attr("fill");
      
      // Only update if colors are actually different or undefined
      if (!currentLinkTextColor || currentLinkTextColor !== textColor) {
        svg.selectAll(".links text").attr("fill", textColor);
      }

      // For node name text, we'll always keep it white regardless of theme
      svg.selectAll(".node-name-text").attr("fill", "#FFFFFF");

      // Type text and other elements should update with theme
      svg.selectAll(".node-type-text").attr("fill", mutedForegroundColor);
      svg.select("#arrow path").attr("fill", textColor);
      svg.selectAll(".links line").attr("stroke", linkColor);
    };

    // Use a timeout instead of requestAnimationFrame to reduce the chance of flickering
    const updateTimeout = setTimeout(updateThemeColors, 50);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" ||
            mutation.attributeName === "data-theme")
        ) {
          // Again, use timeout instead of requestAnimationFrame
          const themeChangeTimeout = setTimeout(updateThemeColors, 50);
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
      return;
    }

    // Skip if node or relationship is selected
    if (selectedNode || selectedRelationship) {
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

    // If no matching nodes, exit early
    if (matchingNodeIds.size === 0) {
      return;
    }

    // Small delay to ensure D3 has finished rendering
    setTimeout(() => {
      try {
        const { textColor } = getThemeColors();
        
        // Use D3 to select elements for better control
        const svg = d3.select(svgEl);
        
        // First, dim all nodes
        svg.selectAll('.nodes g .node-circle')
          .attr('opacity', 0.25)
          .attr('stroke-width', 1);
        
        // Dim ALL text elements using a direct selection
        svg.selectAll('.nodes g .node-name-text')
          .attr('opacity', 0.2)
          .attr('fill', '#FFFFFF'); // Keep white color for all node names
        
        svg.selectAll('.nodes g .node-type-text')
          .attr('opacity', 0.2);
        
        // Dim relationships
        svg.selectAll('.links line')
          .attr('stroke-opacity', 0.15)
          .attr('stroke-width', 1);
        
        svg.selectAll('.links text')
          .attr('opacity', 0.15);
        
        // Highlight matching nodes
        svg.selectAll('.nodes g')
          .filter(function() {
            const nodeId = Number(d3.select(this).attr('data-id'));
            return matchingNodeIds.has(nodeId);
          })
          .each(function() {
            const node = d3.select(this);
            
            // Highlight the circle
            node.select('.node-circle')
              .attr('opacity', 1)
              .attr('stroke-width', 2.5)
              .attr('stroke', textColor);
            
            // Highlight name text (keeping white color)
            node.select('.node-name-text')
              .attr('opacity', 1)
              .attr('fill', '#FFFFFF');
            
            // Highlight type text
            node.select('.node-type-text')
              .attr('opacity', 1);
          });
        
      } catch (error) {
        console.error("Error applying search highlighting:", error);
      }
    }, 100);

    // Clean up function to restore normal appearance
    return () => {
      if (!svgEl || selectedNode || selectedRelationship) return;
      
      setTimeout(() => {
        try {
          const { textColor, linkColor } = getThemeColors();
          const svg = d3.select(svgEl);
          
          // Restore node appearance
          svg.selectAll('.nodes g').each(function() {
            const node = d3.select(this);
            const label = node.attr('data-label') || '';
            
            // Restore circle
            node.select('.node-circle')
              .attr('opacity', 1)
              .attr('stroke-width', 1.5);
            
            // Restore original stroke color
            const strokeColor = d3.color(nodeColors[label] || defaultColor)?.darker(0.7).toString() || 
                              getComputedStyle(document.documentElement).getPropertyValue("--border").trim();
            node.select('.node-circle').attr('stroke', strokeColor);
            
            // Restore name text with white color
            node.select('.node-name-text')
              .attr('opacity', 1)
              .attr('fill', '#FFFFFF');
            
            // Restore type text
            node.select('.node-type-text')
              .attr('opacity', 1);
          });
          
          // Restore relationship appearance
          svg.selectAll('.links line')
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', 1.5)
            .attr('stroke', linkColor);
            
          svg.selectAll('.links text')
            .attr('opacity', 0.7)
            .attr('font-weight', 'normal')
            .attr('fill', textColor);
        } catch (error) {
          console.error("Error resetting search highlighting:", error);
        }
      }, 100);
    };
  }, [searchHighlight, initialized, data.nodes, selectedNode, selectedRelationship, nodeColors]);

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
