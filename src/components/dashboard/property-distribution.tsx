"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNeo4jData } from "@/lib/hooks/use-neo4j-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyDistributionProps {
  title: string;
  nodeLabel: string;
  defaultProperty?: string;
  chartType?: "pie" | "bar";
  height?: number;
}

interface PropertyValue {
  value: string;
  count: number;
}

export function PropertyDistribution({
  title,
  nodeLabel,
  defaultProperty,
  chartType = "pie",
  height = 300,
}: PropertyDistributionProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { nodes, loading, error } = useNeo4jData({
    nodeLabels: [nodeLabel],
  });

  const [availableProperties, setAvailableProperties] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>(defaultProperty || "");

  // Find available properties on first load
  useEffect(() => {
    if (nodes.length > 0) {
      // Collect all property keys from all nodes
      const allProperties = new Set<string>();
      
      nodes.forEach(node => {
        Object.keys(node.properties).forEach(key => {
          if (typeof node.properties[key] !== "object" || node.properties[key] === null) {
            allProperties.add(key);
          }
        });
      });
      
      const propertyList = Array.from(allProperties);
      setAvailableProperties(propertyList);
      
      // If no default property is set, use the first one
      if (!selectedProperty && propertyList.length > 0) {
        setSelectedProperty(propertyList[0]);
      }
    }
  }, [nodes, defaultProperty, selectedProperty]);

  // Create or update chart when data or selected property changes
  useEffect(() => {
    if (loading || error || !nodes.length || !selectedProperty || !svgRef.current) return;

    // Process the data to count occurrences of each property value
    const valueCounts: Record<string, number> = {};
    
    nodes.forEach(node => {
      const value = node.properties[selectedProperty];
      if (value !== undefined) {
        const strValue = String(value);
        valueCounts[strValue] = (valueCounts[strValue] || 0) + 1;
      }
    });
    
    // Convert to array for d3
    const chartData: PropertyValue[] = Object.entries(valueCounts).map(
      ([value, count]) => ({ value, count })
    ).sort((a, b) => b.count - a.count);
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Create chart based on type
    if (chartType === "pie") {
      createPieChart(chartData);
    } else {
      createBarChart(chartData);
    }
  }, [nodes, selectedProperty, loading, error, chartType, height]);

  const createPieChart = (data: PropertyValue[]) => {
    if (!svgRef.current) return;
    
    const width = svgRef.current.clientWidth;
    const radius = Math.min(width, height) / 2 - 40;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    const pie = d3.pie<PropertyValue>()
      .value(d => d.count)
      .sort(null);
      
    const arc = d3.arc<d3.PieArcDatum<PropertyValue>>()
      .innerRadius(0)
      .outerRadius(radius);
      
    const outerArc = d3.arc<d3.PieArcDatum<PropertyValue>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);
    
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
    
    const arcs = svg.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");
      
    arcs.append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i.toString()))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .on("mouseover", (event, d) => {
        const percent = Math.round((d.data.count / nodes.length) * 100);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`<strong>${d.data.value}</strong><br>${d.data.count} nodes (${percent}%)`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
      
    // Add labels for larger segments
    const threshold = nodes.length * 0.05; // Only label segments with at least 5% of total
    
    arcs.filter(d => d.data.count >= threshold)
      .append("text")
      .attr("transform", d => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.99 * (midAngle < Math.PI ? 1 : -1);
        return `translate(${pos})`;
      })
      .attr("dy", ".35em")
      .attr("text-anchor", d => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? "start" : "end";
      })
      .text(d => d.data.value)
      .style("font-size", "10px");
      
    // Add connecting lines to labels
    arcs.filter(d => d.data.count >= threshold)
      .append("polyline")
      .attr("points", d => {
        const pos = outerArc.centroid(d);
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        pos[0] = radius * 0.99 * (midAngle < Math.PI ? 1 : -1);
        return [arc.centroid(d), outerArc.centroid(d), pos].map(p => p.join(",")).join(" ");
      })
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-width", 1);
      
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };
  
  const createBarChart = (data: PropertyValue[]) => {
    if (!svgRef.current) return;
    
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Limit to top 10 values for readability
    const topData = data.slice(0, 10);
    
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Create scales
    const xScale = d3.scaleBand()
      .domain(topData.map(d => d.value))
      .range([0, width])
      .padding(0.2);
      
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(topData, d => d.count) || 0])
      .range([chartHeight, 0]);
      
    // Create axes
    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");
      
    svg.append("g")
      .call(d3.axisLeft(yScale));
      
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
      .data(topData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.value) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.count))
      .attr("height", d => chartHeight - yScale(d.count))
      .attr("fill", "#3b82f6")
      .on("mouseover", (event, d) => {
        const percent = Math.round((d.count / nodes.length) * 100);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`<strong>${d.value}</strong><br>${d.count} nodes (${percent}%)`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
      
    // Add x-axis label
    svg.append("text")
      .attr("transform", `translate(${width / 2}, ${chartHeight + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text(selectedProperty);
      
    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (chartHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Count");
      
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
          </CardTitle>
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
        <CardTitle className="flex items-center justify-between">
          {title}
          {!loading && availableProperties.length > 0 && (
            <Select
              value={selectedProperty}
              onValueChange={setSelectedProperty}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {availableProperties.map((prop) => (
                  <SelectItem key={prop} value={prop}>
                    {prop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="w-full h-[300px]" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center p-6 h-[300px]">
            <p className="text-muted-foreground">No nodes found</p>
          </div>
        ) : (
          <div className="overflow-hidden p-4">
            <svg
              ref={svgRef}
              className="w-full"
              style={{ height: `${height}px` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 