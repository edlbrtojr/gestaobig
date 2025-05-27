"use client";

import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { toast } from "sonner";
import { fetchGraphDataWithPermissions } from "@/lib/graph-with-permissions";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, Move } from "lucide-react";

const GraphDisplay = () => {
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] });
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef(null);
  const graphRef = useRef(null);
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes('admin');

  // Load graph data with permissions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Use permission-aware data fetching
        const data = await fetchGraphDataWithPermissions();
        setGraphData(data);
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
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Create a group for the graph elements
    const g = svg.append("g");
    graphRef.current = g;

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.relationships)
        .id(d => d.id)
        .distance(100))
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
      .call(drag(simulation));

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
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);

      relationshipLabels
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);
    });

    // Drag functionality
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Helper functions
    function getNodeColor(node) {
      // Determine node color based on labels
      const labels = node.labels || [];
      if (labels.includes("Risk")) return "#FF5733";
      if (labels.includes("Opportunity")) return "#33FF57";
      if (labels.includes("Strategy")) return "#3357FF";
      if (labels.includes("Action")) return "#F3FF33";
      return "#999";
    }

    function getNodeLabel(node) {
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
      d3.zoom().scaleBy, 1.5
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleBy, 0.75
    );
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().transform,
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

          {/* Permission notification for non-admin users */}
          {!isAdmin && (
            <div className="absolute bottom-4 left-4 max-w-sm bg-muted/80 backdrop-blur-sm p-3 rounded-md text-xs border border-border shadow-sm">
              <p className="font-medium">Visualização com filtro de permissões</p>
              <p className="text-muted-foreground mt-1">
                Você está vendo apenas os nós aos quais tem acesso com seu perfil atual: 
                <span className="font-medium ml-1">{currentUser?.displayName || 'Usuário'}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GraphDisplay; 