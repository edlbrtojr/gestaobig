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
  chartType?: "pie" | "bar" | "line" | "donut" | "area" | "radar";
  colorScheme?: "default" | "blues" | "greens" | "oranges" | "purples" | "category10";
  showLegend?: boolean;
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
  colorScheme = "default",
  showLegend = false,
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
    switch (chartType) {
      case "pie":
        createPieChart(chartData, false);
        break;
      case "donut":
        createPieChart(chartData, true);
        break;
      case "bar":
        createBarChart(chartData);
        break;
      case "line":
        createLineChart(chartData);
        break;
      case "area":
        createAreaChart(chartData);
        break;
      case "radar":
        createRadarChart(chartData);
        break;
      default:
        createPieChart(chartData, false);
    }
  }, [nodes, selectedProperty, loading, error, chartType, colorScheme, showLegend, height]);

  // Get color scale based on selected color scheme
  const getColorScale = (data: PropertyValue[]) => {
    switch (colorScheme) {
      case "blues":
        return d3.scaleOrdinal(d3.schemeBlues[Math.min(9, data.length)]);
      case "greens":
        return d3.scaleOrdinal(d3.schemeGreens[Math.min(9, data.length)]);
      case "oranges":
        return d3.scaleOrdinal(d3.schemeOranges[Math.min(9, data.length)]);
      case "purples":
        return d3.scaleOrdinal(d3.schemePurples[Math.min(9, data.length)]);
      case "category10":
        return d3.scaleOrdinal(d3.schemeCategory10);
      default:
        return d3.scaleOrdinal(d3.schemeCategory10);
    }
  };

  // Create and render legend
  const renderLegend = (svg: d3.Selection<SVGGElement, unknown, null, undefined>, 
                        data: PropertyValue[], 
                        colorScale: d3.ScaleOrdinal<string, string>,
                        width: number) => {
    if (!showLegend) return;
    
    const legendItemHeight = 20;
    const legendItemWidth = 150;
    const itemsPerRow = Math.floor(width / legendItemWidth) || 1;
    
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, ${height - (Math.ceil(data.length / itemsPerRow) * legendItemHeight) - 10})`);

    const legendItems = legend.selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        return `translate(${col * legendItemWidth}, ${row * legendItemHeight})`;
      });

    legendItems.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d, i) => colorScale(i.toString()));

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d.value.length > 15 ? d.value.substring(0, 15) + "..." : d.value)
      .style("font-size", "12px");
  };

  const createPieChart = (data: PropertyValue[], isDonut: boolean = false) => {
    if (!svgRef.current) return;
    
    const width = svgRef.current.clientWidth;
    const chartHeight = showLegend ? height * 0.8 : height;
    const radius = Math.min(width, chartHeight) / 2 - 40;
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${chartHeight / 2})`);

    const colorScale = getColorScale(data);
    
    const pie = d3.pie<PropertyValue>()
      .value(d => d.count)
      .sort(null);
      
    const arc = d3.arc<d3.PieArcDatum<PropertyValue>>()
      .innerRadius(isDonut ? radius * 0.5 : 0)
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
      .attr("fill", (d, i) => colorScale(i.toString()))
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
      
    // Add labels for larger segments if we're not showing a legend
    if (!showLegend) {
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
    }

    // Add a legend if requested
    if (showLegend) {
      renderLegend(
        d3.select(svgRef.current).append("g"),
        data,
        colorScale,
        width
      );
    }
      
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };
  
  const createBarChart = (data: PropertyValue[]) => {
    if (!svgRef.current) return;
    
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = (showLegend ? height * 0.8 : height) - margin.top - margin.bottom;
    
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
      
    // Get color scale
    const colorScale = getColorScale(topData);
    
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
      .attr("fill", (d, i) => colorScale(i.toString()))
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
      
    // Add a legend if requested
    if (showLegend) {
      renderLegend(
        d3.select(svgRef.current).append("g"),
        topData,
        colorScale,
        width
      );
    }
    
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  const createLineChart = (data: PropertyValue[]) => {
    if (!svgRef.current) return;
    
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = (showLegend ? height * 0.8 : height) - margin.top - margin.bottom;
    
    // Limit to top 15 values for readability
    const topData = data.slice(0, 15);
    
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Create scales
    const xScale = d3.scalePoint<string>()
      .domain(topData.map(d => d.value))
      .range([0, width])
      .padding(0.5);
      
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
    
    // Get color scale
    const colorScale = getColorScale(topData);
    
    // Create line
    const line = d3.line<PropertyValue>()
      .x(d => xScale(d.value) || 0)
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX);
    
    svg.append("path")
      .datum(topData)
      .attr("fill", "none")
      .attr("stroke", colorScale("0"))
      .attr("stroke-width", 2)
      .attr("d", line);
    
    // Add dots
    svg.selectAll(".dot")
      .data(topData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.value) || 0)
      .attr("cy", d => yScale(d.count))
      .attr("r", 5)
      .attr("fill", (d, i) => colorScale(i.toString()))
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
    
    // Add a legend if requested
    if (showLegend) {
      renderLegend(
        d3.select(svgRef.current).append("g"),
        topData,
        colorScale,
        width
      );
    }
    
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };
  
  const createAreaChart = (data: PropertyValue[]) => {
    if (!svgRef.current) return;
    
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = (showLegend ? height * 0.8 : height) - margin.top - margin.bottom;
    
    // Limit to top 15 values for readability
    const topData = data.slice(0, 15);
    
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
      
    // Create scales
    const xScale = d3.scalePoint<string>()
      .domain(topData.map(d => d.value))
      .range([0, width])
      .padding(0.5);
      
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
    
    // Get color scale
    const colorScale = getColorScale(topData);
    
    // Create area
    const area = d3.area<PropertyValue>()
      .x(d => xScale(d.value) || 0)
      .y0(chartHeight)
      .y1(d => yScale(d.count))
      .curve(d3.curveMonotoneX);
    
    svg.append("path")
      .datum(topData)
      .attr("fill", colorScale("0"))
      .attr("fill-opacity", 0.6)
      .attr("stroke", colorScale("0"))
      .attr("stroke-width", 2)
      .attr("d", area);
    
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
    
    // Add dots
    svg.selectAll(".dot")
      .data(topData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.value) || 0)
      .attr("cy", d => yScale(d.count))
      .attr("r", 5)
      .attr("fill", (d, i) => colorScale(i.toString()))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
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
    
    // Add a legend if requested
    if (showLegend) {
      renderLegend(
        d3.select(svgRef.current).append("g"),
        topData,
        colorScale,
        width
      );
    }
    
    // Cleanup function to remove tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };
  
  const createRadarChart = (data: PropertyValue[]) => {
    if (!svgRef.current) return;
    
    const width = svgRef.current.clientWidth;
    const chartHeight = showLegend ? height * 0.8 : height;
    const radius = Math.min(width, chartHeight) / 2 - 40;
    
    // Limit to top 8 values for radar chart readability
    const topData = data.slice(0, 8);
    
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${chartHeight / 2})`);
    
    // Get color scale
    const colorScale = getColorScale(topData);
    
    // Scales for radar chart
    const angleScale = d3.scalePoint<string>()
      .domain(topData.map(d => d.value))
      .range([0, Math.PI * 2]);
      
    const radiusScale = d3.scaleLinear()
      .domain([0, d3.max(topData, d => d.count) || 0])
      .range([0, radius]);
    
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
    
    // Draw the circular grid lines
    const maxValue = d3.max(topData, d => d.count) || 0;
    const levels = 5;
    for (let level = 0; level < levels; level++) {
      const r = radius * (level + 1) / levels;
      
      svg.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-dasharray", "5,5");
        
      // Add level labels
      svg.append("text")
        .attr("x", 5)
        .attr("y", -r)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("fill", "gray")
        .text(Math.round(maxValue * (level + 1) / levels));
    }
    
    // Draw the radial axes
    topData.forEach((d, i) => {
      const angle = angleScale(d.value);
      if (angle === undefined) return;
      
      const x = radius * Math.cos(angle - Math.PI / 2);
      const y = radius * Math.sin(angle - Math.PI / 2);
      
      svg.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "gray")
        .attr("stroke-opacity", 0.3);
        
      // Add axis labels
      svg.append("text")
        .attr("x", 1.1 * x)
        .attr("y", 1.1 * y)
        .attr("text-anchor", (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) ? "end" : "start")
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .text(d.value.length > 10 ? d.value.substring(0, 10) + "..." : d.value);
    });
    
    // Create the radar path
    const points = topData.map(d => {
      const angle = angleScale(d.value);
      if (angle === undefined) return null;
      
      const r = radiusScale(d.count);
      return {
        x: r * Math.cos(angle - Math.PI / 2),
        y: r * Math.sin(angle - Math.PI / 2),
        value: d.value,
        count: d.count
      };
    }).filter(p => p !== null) as { x: number, y: number, value: string, count: number }[];
    
    // Draw the radar area
    const radarLine = d3.lineRadial<{ angle: number, radius: number }>()
      .angle(d => d.angle)
      .radius(d => d.radius)
      .curve(d3.curveLinearClosed);
      
    const radarPoints = points.map(p => ({
      angle: Math.atan2(p.y, p.x) + Math.PI / 2,
      radius: Math.sqrt(p.x * p.x + p.y * p.y)
    }));
    
    svg.append("path")
      .datum(radarPoints)
      .attr("d", radarLine)
      .attr("fill", colorScale("0"))
      .attr("fill-opacity", 0.4)
      .attr("stroke", colorScale("0"))
      .attr("stroke-width", 2);
      
    // Add dots at data points
    svg.selectAll(".radar-dot")
      .data(points)
      .enter()
      .append("circle")
      .attr("class", "radar-dot")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 5)
      .attr("fill", (d, i) => colorScale(i.toString()))
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
    
    // Add a legend if requested
    if (showLegend) {
      renderLegend(
        d3.select(svgRef.current).append("g"),
        topData,
        colorScale,
        width
      );
    }
    
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