"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNeo4jData } from "@/lib/hooks/use-neo4j-data";
import { Skeleton } from "@/components/ui/skeleton";

interface RelationshipChartProps {
  title: string;
  height?: number;
}

interface ChartData {
  source: string;
  target: string;
  type: string;
  count: number;
}

export function RelationshipChart({ 
  title, 
  height = 400 
}: RelationshipChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { nodes, relationships, loading, error } = useNeo4jData();

  useEffect(() => {
    if (loading || error || !relationships.length || !svgRef.current) return;

    // Process the data
    const relationshipCounts: Record<string, Record<string, Record<string, number>>> = {};

    relationships.forEach(rel => {
      const sourceNode = nodes.find(n => n.id === rel.source);
      const targetNode = nodes.find(n => n.id === rel.target);
      
      if (!sourceNode || !targetNode) return;

      const sourceType = sourceNode.label;
      const targetType = targetNode.label;
      const relType = rel.type;
      
      if (!relationshipCounts[sourceType]) {
        relationshipCounts[sourceType] = {};
      }
      
      if (!relationshipCounts[sourceType][targetType]) {
        relationshipCounts[sourceType][targetType] = {};
      }
      
      if (!relationshipCounts[sourceType][targetType][relType]) {
        relationshipCounts[sourceType][targetType][relType] = 0;
      }
      
      relationshipCounts[sourceType][targetType][relType]++;
    });

    // Convert to array for d3
    const chartData: ChartData[] = [];
    
    Object.entries(relationshipCounts).forEach(([source, targets]) => {
      Object.entries(targets).forEach(([target, types]) => {
        Object.entries(types).forEach(([type, count]) => {
          chartData.push({
            source,
            target,
            type,
            count
          });
        });
      });
    });

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Group data by source and target
    const groupedData = d3.group(chartData, d => `${d.source}-${d.target}`);
    
    // Calculate the sum for each source-target pair
    const barData = Array.from(groupedData, ([key, group]) => {
      const [source, target] = key.split("-");
      return {
        source,
        target,
        totalCount: d3.sum(group, d => d.count),
        details: group
      };
    }).sort((a, b) => b.totalCount - a.totalCount).slice(0, 10);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(barData.map(d => `${d.source} → ${d.target}`))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(barData, d => d.totalCount) || 0])
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (chartHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Relationship Count");

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    // Create bars
    svg.selectAll(".bar")
      .data(barData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(`${d.source} → ${d.target}`) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.totalCount))
      .attr("height", d => chartHeight - yScale(d.totalCount))
      .attr("fill", (d, i) => colorScale(i.toString()))
      .on("mouseover", (event, d) => {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
          
        const details = d.details.map((rel: any) => 
          `${rel.type}: ${rel.count} relationships`
        ).join("<br>");
        
        tooltip.html(`<strong>${d.source} → ${d.target}</strong><br>Total: ${d.totalCount}<br><hr>${details}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
    
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [nodes, relationships, loading, error, height]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading data: {error}</p>
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
            <Skeleton className="w-full h-80" />
          </div>
        ) : relationships.length === 0 ? (
          <div className="flex items-center justify-center h-80 p-6">
            <p className="text-muted-foreground">No relationship data found</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <svg
              ref={svgRef}
              className="w-full"
              style={{ minWidth: "500px", height: `${height}px` }}
            ></svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 