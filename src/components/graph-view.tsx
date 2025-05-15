"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { D3Node, D3Link, GraphData } from "@/types/graph";
import { useTheme } from "./theme-provider";

interface GraphViewProps {
  data: GraphData;
}

// Mapping node types to colors
const nodeColors: Record<string, string> = {
  Risco: "#FF5252", // Red
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
  Stakeholder: "#9E9E9E", // Gray
  Tecnologia: "#00BCD4", // Cyan
  Produto: "#8BC34A", // Light Green
  Mercado: "#FFEB3B", // Yellow
  Competidor: "#FF5722", // Deep Orange
};

// Default color for unknown node types
const defaultColor = "#607D8B"; // Gray

// Interface for categorized nodes
interface CategorizedNodes {
  [category: string]: D3Node[];
}

export default function GraphView({ data }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<number[]>([]);
  const [categorizedNodes, setCategorizedNodes] = useState<CategorizedNodes>(
    {}
  );
  const [showCategorized, setShowCategorized] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Get theme colors
    const backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--card-background")
      .trim();
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim();
    const mutedColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted")
      .trim();
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--card-border")
      .trim();

    // Convert data to D3 compatible format
    // Create a map of nodes by their ID for fast lookup
    const nodeMap = new Map();
    const nodes: D3Node[] = data.nodes.map((node) => {
      // Extract the low part of Neo4j ID or use the ID directly if it's a number
      const nodeId =
        typeof node.id === "object" && node.id !== null ? node.id.low : node.id;

      const d3Node = {
        ...node,
        id: nodeId, // Use the extracted ID
      };

      // Store in map for relationship lookup
      nodeMap.set(nodeId, d3Node);

      return d3Node;
    });

    // Process relationships to use the correct node references
    const links: D3Link[] = data.relationships.map((rel) => {
      // Extract the source and target IDs from Neo4j format
      const sourceId =
        typeof rel.source === "object" && rel.source !== null
          ? rel.source.low
          : rel.source;

      const targetId =
        typeof rel.target === "object" && rel.target !== null
          ? rel.target.low
          : rel.target;

      return {
        ...rel,
        id: typeof rel.id === "object" && rel.id !== null ? rel.id.low : rel.id,
        source: sourceId,
        target: targetId,
      };
    });

    // Create a helper to find connected nodes
    const getConnectedNodeIds = (nodeId: number): number[] => {
      const connected = new Set<number>();

      links.forEach((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;

        if (sourceId === nodeId) {
          connected.add(targetId);
        } else if (targetId === nodeId) {
          connected.add(sourceId);
        }
      });

      return Array.from(connected);
    };

    // Categorize nodes by label
    const categorizeNodes = () => {
      const categorized: CategorizedNodes = {};

      nodes.forEach((node) => {
        if (!categorized[node.label]) {
          categorized[node.label] = [];
        }
        categorized[node.label].push(node);
      });

      // Sort each category by name
      Object.keys(categorized).forEach((category) => {
        categorized[category].sort((a, b) =>
          a.properties.name.localeCompare(b.properties.name)
        );
      });

      setCategorizedNodes(categorized);
    };

    categorizeNodes();

    // Clear previous svg content
    d3.select(svgRef.current).selectAll("*").remove();

    // Get the dimensions of the container - IMPORTANT: Get actual size, not just clientWidth
    const containerWidth =
      svgRef.current.parentElement?.clientWidth || window.innerWidth;
    const containerHeight =
      svgRef.current.parentElement?.clientHeight || window.innerHeight;

    // Explicitly set SVG dimensions
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .style("background", backgroundColor);

    // Add zoom functionality
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Create a container group for the graph
    const g = svg.append("g");

    // Define forces
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(120) // Increased distance for better visibility
      )
      .force("charge", d3.forceManyBody().strength(-250)) // Increased repulsion
      .force("center", d3.forceCenter(containerWidth / 2, containerHeight / 2))
      .force("collision", d3.forceCollide().radius(40)); // Increased collision radius

    // Create links (relationships)
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("g");

    link
      .append("line")
      .attr("stroke", mutedColor)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)")
      .attr("data-id", (d: D3Link) => d.id);

    // Add arrow markers for directed edges
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Offset so arrow doesn't overlap with the node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", mutedColor)
      .attr("d", "M0,-5L10,0L0,5");

    // Add relationship type labels
    const linkText = link
      .append("text")
      .attr("font-size", "11px")
      .attr("fill", textColor)
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .attr("opacity", 0.8)
      .text((d: D3Link) => d.type);

    // Type the drag behavior to fix linting errors
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

    // Create nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("g")
      .call(drag as any)
      .attr("data-id", (d: D3Node) => d.id);

    // Add a white background behind nodes for better visibility
    node
      .append("circle")
      .attr("r", 14)
      .attr("fill", backgroundColor)
      .attr("stroke", borderColor)
      .attr("stroke-width", 1);

    // Actual colored node
    node
      .append("circle")
      .attr("r", 12)
      .attr("fill", (d: D3Node) => nodeColors[d.label] || defaultColor)
      .attr("stroke", backgroundColor)
      .attr("stroke-width", 1.5);

    // Add node labels with background for better readability
    const labels = node.append("g").attr("class", "node-label");

    // Text background
    labels
      .append("rect")
      .attr("x", 15)
      .attr("y", -7)
      .attr("width", (d: D3Node) => d.properties.name.length * 6 + 4) // Approximate width based on text length
      .attr("height", 16)
      .attr("rx", 3)
      .attr("fill", backgroundColor)
      .attr("opacity", 0.8);

    // Node name text
    labels
      .append("text")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("dx", 17)
      .attr("dy", 4)
      .attr("fill", textColor)
      .text((d: D3Node) => d.properties.name);

    // Add node type labels above the node
    node
      .append("text")
      .attr("font-size", "9px")
      .attr("dx", 0)
      .attr("dy", -18)
      .attr("text-anchor", "middle")
      .attr("fill", textColor)
      .text((d: D3Node) => d.label);

    // Handle node click events
    node.on("click", (event: MouseEvent, d: D3Node) => {
      event.stopPropagation();
      const connected = getConnectedNodeIds(d.id);
      setConnectedNodes(connected);
      setSelectedNode(d);
      setShowCategorized(true);

      // Highlight the selected node and its connections
      node
        .selectAll("circle")
        .attr("opacity", 0.3)
        .attr("stroke", backgroundColor)
        .attr("stroke-width", 1.5);

      // Dim labels
      node.selectAll(".node-label").attr("opacity", 0.3);

      // Highlight the selected node
      d3.select(event.currentTarget as Element)
        .selectAll("circle")
        .attr("opacity", 1)
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

      // Highlight selected node label
      d3.select(event.currentTarget as Element)
        .select(".node-label")
        .attr("opacity", 1);

      // Highlight connected nodes
      node
        .filter((n: D3Node) => connected.includes(n.id))
        .selectAll("circle")
        .attr("opacity", 1)
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5);

      // Highlight connected node labels
      node
        .filter((n: D3Node) => connected.includes(n.id))
        .select(".node-label")
        .attr("opacity", 1);

      // Dim all links
      link
        .selectAll("line")
        .attr("stroke-opacity", 0.1)
        .attr("stroke-width", 1);

      // Dim all link labels
      link.selectAll("text").attr("opacity", 0.1);

      // Highlight links connected to the selected node
      link
        .filter((l: D3Link) => {
          const sourceId =
            typeof l.source === "object" ? l.source.id : l.source;
          const targetId =
            typeof l.target === "object" ? l.target.id : l.target;
          return sourceId === d.id || targetId === d.id;
        })
        .select("line")
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 2)
        .attr("stroke", "#000");

      // Highlight link labels for connected links
      link
        .filter((l: D3Link) => {
          const sourceId =
            typeof l.source === "object" ? l.source.id : l.source;
          const targetId =
            typeof l.target === "object" ? l.target.id : l.target;
          return sourceId === d.id || targetId === d.id;
        })
        .select("text")
        .attr("opacity", 1)
        .attr("font-weight", "bold");
    });

    // Clear selection when clicking on the background
    svg.on("click", () => {
      setSelectedNode(null);
      setConnectedNodes([]);
      setShowCategorized(false);

      // Reset all visual states
      node
        .selectAll("circle")
        .attr("opacity", 1)
        .attr("stroke", backgroundColor)
        .attr("stroke-width", 1.5);

      node.selectAll(".node-label").attr("opacity", 1);

      link
        .selectAll("line")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        .attr("stroke", mutedColor);

      link.selectAll("text").attr("opacity", 0.8).attr("font-weight", "normal");
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .selectAll("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkText
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, theme]); // Add theme as dependency to redraw when theme changes

  return (
    <div className="flex flex-col h-full w-full relative">
      <svg
        ref={svgRef}
        className="w-full h-full bg-[var(--card-background)] text-[var(--foreground)]"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      />

      {selectedNode && (
        <div className="absolute bottom-4 right-4 p-6 bg-[var(--card-background)] shadow-lg rounded-lg max-w-sm z-10 border border-[var(--card-border)]">
          <h3 className="text-lg font-semibold">
            {selectedNode.properties.name}
          </h3>
          <p className="text-xs text-[var(--muted)] mb-2">
            {selectedNode.label}
            <span
              className="inline-block w-3 h-3 rounded-full ml-2 align-middle"
              style={{
                backgroundColor: nodeColors[selectedNode.label] || defaultColor,
              }}
            ></span>
          </p>
          <div className="mt-3 space-y-2">
            {Object.entries(selectedNode.properties)
              .filter(([key]) => key !== "name")
              .map(([key, value]) => (
                <div key={key} className="flex text-sm">
                  <span className="font-medium mr-2 text-[var(--muted)]">
                    {key}:
                  </span>
                  <span>{value}</span>
                </div>
              ))}
          </div>
          <button
            className="mt-4 px-4 py-2 text-sm bg-[var(--muted-background)] hover:bg-[var(--card-border)] rounded-md transition-colors"
            onClick={() => {
              setSelectedNode(null);
              setConnectedNodes([]);
              setShowCategorized(false);
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {showCategorized && (
        <div className="absolute top-4 left-4 w-72 max-h-[80vh] overflow-auto bg-[var(--card-background)] shadow-lg rounded-lg p-6 z-10 border border-[var(--card-border)]">
          <h3 className="text-lg font-semibold mb-3">Nós Conectados</h3>

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
                <div key={category} className="mb-4">
                  <div
                    className="flex items-center pb-2 mb-2 border-b"
                    style={{
                      borderColor: nodeColors[category] || defaultColor,
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full mr-2"
                      style={{
                        backgroundColor: nodeColors[category] || defaultColor,
                      }}
                    ></span>
                    <h4 className="font-medium">
                      {category} ({filteredNodes.length})
                    </h4>
                  </div>
                  <ul className="space-y-2 pl-5">
                    {filteredNodes.map((node) => (
                      <li
                        key={node.id}
                        className={`text-sm hover:bg-[var(--muted-background)] px-2 py-1 rounded cursor-pointer transition-colors ${
                          node.id === selectedNode?.id
                            ? "font-bold bg-[var(--muted-background)]"
                            : ""
                        }`}
                      >
                        {node.properties.name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

          <button
            className="mt-4 w-full px-4 py-2 text-sm bg-[var(--muted-background)] hover:bg-[var(--card-border)] rounded-md transition-colors"
            onClick={() => setShowCategorized(false)}
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
