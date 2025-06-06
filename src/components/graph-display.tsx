"use client";

import { useEffect, useState, useRef, MutableRefObject } from "react";
import * as d3 from "d3";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, Move } from "lucide-react";

// Interfaces para dados do grafo
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  labels?: string[];
  properties?: {
    name?: string;
    title?: string;
    [key: string]: any;
  };
  x?: number;
  y?: number;
}

interface GraphRelationship {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

// Função para buscar dados do grafo sem verificação de permissões
async function fetchGraphData(): Promise<GraphData> {
  const response = await fetch('/api/graph');
  if (!response.ok) {
    throw new Error('Failed to fetch graph data');
  }
  return await response.json();
}

const GraphDisplay = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], relationships: [] });
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const graphRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  // Load graph data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Use standard data fetching without permissions
        const data = await fetchGraphData();
        setGraphData(data as GraphData);
      } catch (error) {
        console.error("Error fetching graph data:", error);
        toast.error("Failed to load graph data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize and update graph visualization
  useEffect(() => {
    if (isLoading || !graphData.nodes.length) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 100;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current) as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Create a group for the graph elements
    const g = svg.append("g");
    graphRef.current = g;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any); // Cast to any para resolver incompatibilidade de tipos

    // Create a force simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force("link", d3.forceLink<GraphNode, d3.SimulationLinkDatum<GraphNode>>(
        graphData.relationships as d3.SimulationLinkDatum<GraphNode>[]
      ).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Add links (relationships)
    const link = g.append("g")
      .selectAll("line")
      .data(graphData.relationships)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    // Add nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", d => getNodeColor(d))
      .call(drag(simulation) as any); // Cast to any to resolve type incompatibility

    // Add node labels
    const labels = g.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .enter()
      .append("text")
      .text(d => getNodeLabel(d))
      .attr("font-size", "8px")
      .attr("dx", 12)
      .attr("dy", 4);

    // Add relationship labels
    const relationshipLabels = g.append("g")
      .selectAll("text")
      .data(graphData.relationships)
      .enter()
      .append("text")
      .text(d => d.type)
      .attr("font-size", "6px")
      .attr("fill", "#666")
      .attr("text-anchor", "middle");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x || 0)
        .attr("y1", d => (d.source as GraphNode).y || 0)
        .attr("x2", d => (d.target as GraphNode).x || 0)
        .attr("y2", d => (d.target as GraphNode).y || 0);

      node
        .attr("cx", d => d.x || 0)
        .attr("cy", d => d.y || 0);

      labels
        .attr("x", d => d.x || 0)
        .attr("y", d => d.y || 0);

      relationshipLabels
        .attr("x", d => (((d.source as GraphNode).x || 0) + ((d.target as GraphNode).x || 0)) / 2)
        .attr("y", d => (((d.source as GraphNode).y || 0) + ((d.target as GraphNode).y || 0)) / 2);
    });

    // Drag functionality
    function drag(simulation: d3.Simulation<GraphNode, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag<SVGCircleElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Helper functions
    function getNodeColor(node: GraphNode): string {
      // Determine node color based on labels
      const labels = node.labels || [];
      if (labels.includes("Risk")) return "#FF5733";
      if (labels.includes("Opportunity")) return "#33FF57";
      if (labels.includes("Strategy")) return "#3357FF";
      if (labels.includes("Action")) return "#F3FF33";
      return "#999";
    }

    function getNodeLabel(node: GraphNode): string {
      return node.properties?.name || node.properties?.title || `Node ${node.id}`;
    }

    // Clean up
    return () => {
      simulation.stop();
    };
  }, [graphData, isLoading]);

  // Zoom controls
  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom() as any).scaleBy, 1.5
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom() as any).scaleBy, 0.75
    );
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      (d3.zoom() as any).transform,
      d3.zoomIdentity
    );
  };

  return (
    <div className="relative w-full h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando grafo...</span>
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button size="icon" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={handleResetZoom}>
              <Move className="h-4 w-4" />
            </Button>
          </div>
          
          <svg ref={svgRef} className="w-full h-[calc(100vh-200px)] bg-background"></svg>
          
          {/* Node count indicator */}
          <div className="absolute bottom-4 right-4 bg-card p-2 rounded-md text-xs border border-border shadow-sm">
            <p className="text-muted-foreground">
              Visualizando: <span className="font-medium">{graphData.nodes.length}</span> nós e{' '}
              <span className="font-medium">{graphData.relationships.length}</span> conexões
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default GraphDisplay; 