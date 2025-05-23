"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNeo4jData, FilterOptions } from "@/lib/hooks/use-neo4j-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface MiniGraphProps {
  title: string;
  filterOptions?: FilterOptions;
  maxNodes?: number;
  height?: number;
}

export function MiniGraph({
  title,
  filterOptions,
  maxNodes = 30,
  height = 400,
}: MiniGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const { nodes, relationships, loading, error } = useNeo4jData(filterOptions);

  useEffect(() => {
    if (loading || error || !nodes.length || !svgRef.current) return;

    // Limit the number of nodes for performance
    const limitedNodes = nodes.slice(0, maxNodes);
    
    // Filter relationships to only include the limited nodes
    const nodeIds = new Set(limitedNodes.map(n => n.id));
    const limitedRelationships = relationships.filter(
      rel => nodeIds.has(rel.source) && nodeIds.has(rel.target)
    );
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    
    // Create a color scale based on node labels
    const nodeLabels = Array.from(new Set(limitedNodes.map(n => n.label)));
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(nodeLabels);

    // Create the force simulation
    const simulation = d3.forceSimulation(limitedNodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(limitedRelationships)
        .id((d: any) => d.id)
        .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Add a zoom behavior
    const g = svg.append("g");
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));

    // Create the relationship lines
    const links = g.append("g")
      .selectAll("line")
      .data(limitedRelationships)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    // Create arrow markers for relationships
    svg.append("defs").selectAll("marker")
      .data(["end"]) // Only one type of marker
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Position away from the node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#999")
      .attr("d", "M0,-5L10,0L0,5");

    links.attr("marker-end", "url(#end)");

    // Create the relationship type labels
    const linkLabels = g.append("g")
      .selectAll("text")
      .data(limitedRelationships)
      .enter()
      .append("text")
      .attr("font-size", 8)
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .text(d => d.type);

    // Create the node circles
    const nodeGroups = g.append("g")
      .selectAll("g")
      .data(limitedNodes)
      .enter()
      .append("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        router.push(`/graph?node=${d.id}`);
      });

    // Add node circles
    nodeGroups.append("circle")
      .attr("r", 12)
      .attr("fill", d => colorScale(d.label))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .append("title")
      .text(d => d.properties.name || d.label);

    // Add node icons or labels
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", "white")
      .style("pointer-events", "none")
      .style("font-size", "10px")
      .text(d => d.properties.name ? d.properties.name.charAt(0) : "#");

    // Add node labels below circles
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 24)
      .style("font-size", "8px")
      .style("pointer-events", "none")
      .text(d => {
        const name = d.properties.name || d.label;
        return name.length > 15 ? name.substring(0, 12) + "..." : name;
      });

    // Add legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "start")
      .selectAll("g")
      .data(nodeLabels)
      .enter().append("g")
      .attr("transform", (d, i) => `translate(10,${i * 20 + 10})`);

    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d => colorScale(d));

    legend.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("dy", "0.1em")
      .text(d => d);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      linkLabels
        .attr("x", d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr("y", d => ((d.source as any).y + (d.target as any).y) / 2);

      nodeGroups
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Return a cleanup function to stop the simulation
    return () => {
      simulation.stop();
    };
  }, [nodes, relationships, loading, error, maxNodes, height, router]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading graph data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="w-full h-[400px]" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center p-6 h-[400px]">
            <p className="text-muted-foreground">No graph data found</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <svg
              ref={svgRef}
              className="w-full"
              style={{ height: `${height}px` }}
            ></svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 