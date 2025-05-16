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

// Default color for unknown node types
const defaultColor = "#757575"; // Darker Gray for unknowns

// Interface for categorized nodes
interface CategorizedNodes {
  [category: string]: D3Node[];
}

export default function GraphView({ data }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<number[]>([]);
  const [categorizedNodes, setCategorizedNodes] = useState<CategorizedNodes>(
    {}
  );
  const [showCategorized, setShowCategorized] = useState(false);
  const { theme } = useTheme();

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

      // Define colors directly based on theme for critical D3 elements
      // This bypasses potential issues with CSS var propagation into D3 if --foreground isn't updating as expected for D3
      const d3TextColor = theme === "dark" ? "#FFFFFF" : "#0A0A0A"; // White for dark, near-black for light
      const d3MutedForegroundColor = theme === "dark" ? "#A0A0A0" : "#707070"; // Lighter gray for dark, darker gray for light
      const d3LinkColor = theme === "dark" ? "#606060" : "#C0C0C0"; // Visible gray for links in dark, lighter gray in light
      const d3NodeBorderColor = `hsl(${rawBorderColor})`; // Keep using CSS var for less critical borders

      const containerWidth =
        svgRef.current!.parentElement?.clientWidth || window.innerWidth;
      const containerHeight =
        svgRef.current!.parentElement?.clientHeight || window.innerHeight;

      const extractId = (id: any): number => {
        if (id === null || id === undefined) return -1;
        if (typeof id === "object" && "low" in id) return id.low;
        return Number(id);
      };

      const nodeMap = new Map();
      const spiralPosition = (index: number, total: number) => {
        const theta = index * 2.4;
        const radiusScale = Math.min(containerWidth, containerHeight) * 0.2;
        const radius = radiusScale * Math.sqrt(index / total);
        return {
          x: containerWidth / 2 + radius * Math.cos(theta),
          y: containerHeight / 2 + radius * Math.sin(theta),
        };
      };

      const nodes: D3Node[] = data.nodes.map((node, i) => {
        const nodeId = extractId(node.id);
        const position = spiralPosition(i, data.nodes.length);
        const d3Node = {
          ...node,
          id: nodeId,
          x: position.x,
          y: position.y,
        };
        nodeMap.set(nodeId, d3Node);
        return d3Node;
      });

      const links: D3Link[] = data.relationships.map((rel) => ({
        ...rel,
        id: extractId(rel.id),
        source: extractId(rel.source),
        target: extractId(rel.target),
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
        const minRadius = 10;
        const maxRadius = 25;
        const minConnections = 0;
        const maxConnections = Math.max(
          ...Array.from(connectionCounts.values())
        );
        if (maxConnections === minConnections) return minRadius;
        return (
          minRadius +
          ((connectionCount - minConnections) * (maxRadius - minRadius)) /
            (maxConnections - minConnections)
        );
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
        .select(svgRef.current!)
        .attr("width", containerWidth)
        .attr("height", containerHeight);
      const g = svg.append("g");

      const zoom = d3
        .zoom()
        .scaleExtent([0.05, 10])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });
      svg.call(zoom as any);
      const initialTransform = d3.zoomIdentity
        .translate(containerWidth / 2, containerHeight / 2)
        .scale(0.85);
      svg.call(zoom.transform as any, initialTransform);

      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(validLinks)
            .id((d: any) => d.id)
            .distance(120)
            .strength(0.5)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force(
          "center",
          d3.forceCenter(containerWidth / 2, containerHeight / 2).strength(0.05)
        )
        .force(
          "collision",
          d3.forceCollide().radius((d: any) => getNodeRadius(d.id) + 25)
        )
        .alpha(0.6)
        .alphaDecay(0.015);

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
        .attr("stroke", d3LinkColor) // Use d3LinkColor for link lines
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1.5)
        .attr("marker-end", "url(#arrow)")
        .attr("data-id", (d: D3Link) => d.id);

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
        .attr("fill", d3TextColor) // Use d3TextColor for arrowheads
        .attr("d", "M0,-5L10,0L0,5");

      linkElements
        .append("text")
        .attr("font-size", "10px")
        .attr("fill", d3TextColor) // Use d3TextColor for link labels
        .attr("text-anchor", "middle")
        .attr("dy", -4)
        .attr("opacity", 0.7)
        .text((d: D3Link) => d.type);

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

      const defs = svg.select("defs"); // Reuse or create defs
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
        .attr("r", (d: D3Node) => getNodeRadius(d.id))
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
        .style("filter", "url(#node-shadow)");

      nodeElements
        .append("text")
        .attr("class", "node-name-text")
        .attr("font-size", "10px")
        .attr("font-weight", "500")
        .attr("dy", (d: D3Node) => getNodeRadius(d.id) + 12)
        .attr("text-anchor", "middle")
        .attr("fill", d3TextColor) // Node names use d3TextColor
        .style("pointer-events", "none")
        .text((d: D3Node) =>
          (d.properties?.name || `Node ${d.id}`).length > 15
            ? (d.properties?.name || `Node ${d.id}`).substring(0, 13) + "..."
            : d.properties?.name || `Node ${d.id}`
        )
        .append("title")
        .text((d: D3Node) => d.properties?.name || `Node ${d.id}`);

      nodeElements
        .append("text")
        .attr("class", "node-type-text")
        .attr("font-size", "8px")
        .attr("font-style", "italic")
        .attr("dy", (d: D3Node) => -getNodeRadius(d.id) + 8)
        .attr("text-anchor", "middle")
        .attr("fill", d3MutedForegroundColor) // Node types use d3MutedForegroundColor
        .style("pointer-events", "none")
        .text((d: D3Node) => d.label || "Unknown");

      nodeElements
        .append("text")
        .attr("class", "node-connection-count")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("dy", (d: D3Node) => (getNodeRadius(d.id) > 15 ? 4 : 3))
        .attr("fill", (d: D3Node) => {
          const c = d3.hsl(nodeColors[d.label] || defaultColor);
          return c && c.l > 0.55 ? "#000000" : "#FFFFFF";
        })
        .style("pointer-events", "none")
        .text((d: D3Node) => connectionCounts.get(d.id) || 0);

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
        setSelectedNode(d);
        setConnectedNodes(newlyConnected);
        setShowCategorized(true);
        const t = d3.transition().duration(300);
        nodeElements
          .selectAll(".node-circle")
          .transition(t)
          .attr("opacity", 0.25)
          .attr("stroke-width", 1);
        nodeElements
          .selectAll(".node-name-text, .node-type-text, .node-connection-count")
          .transition(t)
          .attr("opacity", 0.3);
        linkElements
          .selectAll("line")
          .transition(t)
          .attr("stroke-opacity", 0.15)
          .attr("stroke-width", 1);
        linkElements.selectAll("text").transition(t).attr("opacity", 0.15);

        const selectedSvgNode = d3.select(event.currentTarget as Element);
        selectedSvgNode
          .select(".node-circle")
          .transition(t)
          .attr("opacity", 1)
          .attr("stroke-width", 2.5)
          .attr("stroke", theme === "dark" ? "#FFFFFF" : "#000000");
        selectedSvgNode
          .selectAll(".node-name-text, .node-type-text, .node-connection-count")
          .transition(t)
          .attr("opacity", 1);

        nodeElements
          .filter((n: D3Node) => newlyConnected.includes(n.id))
          .selectAll(".node-circle")
          .transition(t)
          .attr("opacity", 0.9)
          .attr("stroke-width", 2);
        nodeElements
          .filter((n: D3Node) => newlyConnected.includes(n.id))
          .selectAll(".node-name-text, .node-type-text, .node-connection-count")
          .transition(t)
          .attr("opacity", 0.9);

        linkElements
          .filter(
            (l: D3Link) =>
              (typeof l.source === "object" ? l.source.id : l.source) ===
                d.id ||
              (typeof l.target === "object" ? l.target.id : l.target) === d.id
          )
          .selectAll("line")
          .transition(t)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 2)
          .attr("stroke", d3TextColor);
        linkElements
          .filter(
            (l: D3Link) =>
              (typeof l.source === "object" ? l.source.id : l.source) ===
                d.id ||
              (typeof l.target === "object" ? l.target.id : l.target) === d.id
          )
          .selectAll("text")
          .transition(t)
          .attr("opacity", 1)
          .attr("font-weight", "bold");
      });

      svg.on("click", () => {
        setSelectedNode(null);
        setConnectedNodes([]);
        setShowCategorized(false);
        const t = d3.transition().duration(300);
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
          .selectAll(".node-name-text, .node-type-text, .node-connection-count")
          .transition(t)
          .attr("opacity", 1);
        linkElements
          .selectAll("line")
          .transition(t)
          .attr("stroke", d3LinkColor)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", 1.5);
        linkElements
          .selectAll("text")
          .transition(t)
          .attr("fill", d3TextColor)
          .attr("opacity", 0.7)
          .attr("font-weight", "normal");
      });

      simulationRef.current = simulation;
    }); // End of requestAnimationFrame

    return () => {
      cancelAnimationFrame(frameId);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, theme]); // Keep theme to re-render on theme change

  return (
    <div className="flex flex-col h-full w-full relative isolate">
      <svg
        ref={svgRef}
        className="w-full h-full bg-background text-foreground"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden", // Keep overflow hidden on SVG itself
          cursor: "grab",
        }}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-5 right-5 p-4 bg-card text-card-foreground shadow-xl rounded-lg max-w-md w-full sm:w-auto z-20 border border-border transition-all duration-300 ease-in-out transform-gpu motion-safe:animate-fadeInUp">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-lg font-semibold truncate pr-2"
              title={selectedNode.properties?.name || `Node ${selectedNode.id}`}
            >
              {selectedNode.properties?.name || `Node ${selectedNode.id}`}
            </h3>
            <span
              className="inline-block w-4 h-4 rounded-full flex-shrink-0"
              style={{
                backgroundColor: nodeColors[selectedNode.label] || defaultColor,
              }}
            ></span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Tipo: {selectedNode.label || "Unknown"}
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-sm mb-3 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-card-background">
            {selectedNode.properties &&
              Object.entries(selectedNode.properties)
                .filter(([key]) => key !== "name") // Already shown in title
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
              // Simulate background click to reset everything
              svgRef.current?.dispatchEvent(
                new MouseEvent("click", { bubbles: true })
              );
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Categorized/Connected Nodes Panel */}
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
                          // Find the corresponding SVG element and dispatch a click
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
                          e.stopPropagation(); // Prevent triggering SVG background click
                        }}
                        tabIndex={0} // Make it focusable
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
    </div>
  );
}
