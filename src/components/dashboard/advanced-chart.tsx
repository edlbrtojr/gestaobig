"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdvancedChartData, fetchReverseAdvancedChartData, fetchSimpleAggregationData, AggregatedDataPoint } from "@/lib/advanced-chart";

interface AdvancedChartProps {
  title: string;
  sourceNodeLabel: string;
  targetNodeLabel?: string;
  relationshipType?: string;
  propertyToAggregate: string;
  aggregationMethod: "sum" | "avg" | "count" | "min" | "max";
  groupByProperty: string;
  sortDirection?: "asc" | "desc";
  topResults?: number;
  chartType?: "pie" | "bar" | "line" | "donut" | "area" | "radar";
  colorScheme?: "default" | "blues" | "greens" | "oranges" | "purples" | "category10";
  showLegend?: boolean;
  height?: number;
}

export function AdvancedChart({
  title,
  sourceNodeLabel,
  targetNodeLabel,
  relationshipType,
  propertyToAggregate,
  aggregationMethod,
  groupByProperty,
  sortDirection = "desc",
  topResults = 10,
  chartType = "bar",
  colorScheme = "default",
  showLegend = false,
  height = 400
}: AdvancedChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<AggregatedDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure topResults is an integer
  const normalizedTopResults = useMemo(() => {
    return typeof topResults === 'number' ? Math.floor(topResults) : 10;
  }, [topResults]);

  // Fetch data for the chart
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Validate required parameters first
      if (!sourceNodeLabel) {
        setError("Tipo de nó de origem não selecionado");
        setLoading(false);
        return;
      }

      if (!propertyToAggregate) {
        setError("Propriedade para agregação não selecionada");
        setLoading(false);
        return;
      }

      if (!groupByProperty) {
        setError("Propriedade para agrupar não selecionada");
        setLoading(false);
        return;
      }

      try {
        let chartData: AggregatedDataPoint[] = [];

        // If targetNodeLabel and relationshipType are provided, use advanced chart query
        if (targetNodeLabel && relationshipType) {
          console.log("Fetching data with relationship:", sourceNodeLabel, targetNodeLabel, relationshipType);
          const options = {
            sourceNodeLabel,
            targetNodeLabel,
            relationshipType,
            propertyToAggregate,
            aggregationMethod,
            groupByProperty,
            sortDirection,
            topResults: normalizedTopResults
          };

          // Try with forward relationship first
          try {
            chartData = await fetchAdvancedChartData(options);
          } catch (err) {
            console.error("Error fetching forward relationship data:", err);
            // Try reverse relationship if forward failed
            try {
              chartData = await fetchReverseAdvancedChartData(options);
            } catch (reverseErr) {
              console.error("Error fetching reverse relationship data:", reverseErr);
              throw new Error(`Não foi possível encontrar dados entre ${sourceNodeLabel} e ${targetNodeLabel} com o relacionamento ${relationshipType}`);
            }
          }
        } else {
          // Use simple aggregation if no relationship is specified
          console.log("Fetching simple aggregation data:", sourceNodeLabel, propertyToAggregate, groupByProperty);
          try {
            chartData = await fetchSimpleAggregationData(
              sourceNodeLabel,
              propertyToAggregate,
              groupByProperty,
              aggregationMethod,
              sortDirection,
              normalizedTopResults
            );
          } catch (err) {
            console.error("Error fetching simple aggregation data:", err);
            throw new Error(`Não foi possível agregar a propriedade "${propertyToAggregate}" agrupada por "${groupByProperty}"`);
          }
        }

        if (chartData.length === 0) {
          setError(`Nenhum dado encontrado. Verifique se as propriedades "${propertyToAggregate}" e "${groupByProperty}" existem e contêm valores.`);
        } else {
          setData(chartData);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Erro ao buscar dados para o gráfico. Verifique as configurações e tente novamente.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    sourceNodeLabel,
    targetNodeLabel,
    relationshipType,
    propertyToAggregate,
    aggregationMethod,
    groupByProperty,
    sortDirection,
    normalizedTopResults
  ]);

  // Create or update chart when data changes
  useEffect(() => {
    if (loading || error || !data.length || !svgRef.current) return;

    // Clear any existing chart
    d3.select(svgRef.current).selectAll("*").remove();

    // Render chart based on selected type
    switch (chartType) {
      case "pie":
        createPieChart(data, false);
        break;
      case "donut":
        createPieChart(data, true);
        break;
      case "bar":
        createBarChart(data);
        break;
      case "line":
        createLineChart(data);
        break;
      case "area":
        createAreaChart(data);
        break;
      case "radar":
        createRadarChart(data);
        break;
      default:
        createBarChart(data);
    }
  }, [data, loading, error, chartType, colorScheme, showLegend, height]);

  // Get color scale based on selected color scheme
  const getColorScale = (data: AggregatedDataPoint[]) => {
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
  const renderLegend = (
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: AggregatedDataPoint[],
    colorScale: d3.ScaleOrdinal<string, string>,
    width: number
  ) => {
    if (!showLegend) return;

    const legendItemHeight = 20;
    const legendItemWidth = 150;
    const itemsPerRow = Math.floor(width / legendItemWidth) || 1;

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(0, ${height - Math.ceil(data.length / itemsPerRow) * legendItemHeight - 10})`
      );

    const legendItems = legend
      .selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        return `translate(${col * legendItemWidth}, ${row * legendItemHeight})`;
      });

    legendItems
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", (d, i) => colorScale(i.toString()));

    legendItems
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => (d.label.length > 15 ? d.label.substring(0, 15) + "..." : d.label))
      .style("font-size", "12px");
  };

  // Create pie/donut chart
  const createPieChart = (data: AggregatedDataPoint[], isDonut: boolean) => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const chartHeight = showLegend ? height * 0.8 : height;
    const radius = Math.min(width, chartHeight) / 2 - 40;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${chartHeight / 2})`);

    const colorScale = getColorScale(data);

    const pie = d3
      .pie<AggregatedDataPoint>()
      .value(d => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<AggregatedDataPoint>>()
      .innerRadius(isDonut ? radius * 0.5 : 0)
      .outerRadius(radius);

    const outerArc = d3
      .arc<d3.PieArcDatum<AggregatedDataPoint>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000);

    const arcs = svg
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => colorScale(i.toString()))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .on("mouseover", (event, d) => {
        const percent = Math.round((d.data.value / d3.sum(data, d => d.value)) * 100);
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(
            `<strong>${d.data.label}</strong><br>${d.data.value.toLocaleString()} (${percent}%)`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add labels for larger segments if not showing legend
    if (!showLegend) {
      const total = d3.sum(data, d => d.value);
      const threshold = total * 0.05; // Only label segments with at least 5% of total

      arcs
        .filter(d => d.data.value >= threshold)
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
        .text(d => d.data.label)
        .style("font-size", "10px");

      // Add connecting lines to labels
      arcs
        .filter(d => d.data.value >= threshold)
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
      renderLegend(d3.select(svgRef.current).append("g"), data, colorScale, width);
    }

    // Cleanup tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  // Create bar chart
  const createBarChart = (data: AggregatedDataPoint[]) => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = (showLegend ? height * 0.8 : height) - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([chartHeight, 0]);

    // Create axes
    svg
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    svg.append("g").call(d3.axisLeft(yScale));

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
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
    const colorScale = getColorScale(data);

    // Create bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.label) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.value))
      .attr("height", d => chartHeight - yScale(d.value))
      .attr("fill", (d, i) => colorScale(i.toString()))
      .on("mouseover", (event, d) => {
        const total = d3.sum(data, d => d.value);
        const percent = Math.round((d.value / total) * 100);
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.label}</strong><br>${d.value.toLocaleString()} (${percent}%)`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add value labels on top of bars
    svg
      .selectAll(".value-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("x", d => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.value) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.value.toLocaleString())
      .style("font-size", "10px")
      .style("fill", "#666");

    // Add x-axis label (groupBy property)
    svg
      .append("text")
      .attr("transform", `translate(${width / 2}, ${chartHeight + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text(groupByProperty);

    // Add y-axis label (aggregated property)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - chartHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(`${getAggregationMethodLabel(aggregationMethod)} of ${propertyToAggregate}`);

    // Add a legend if requested
    if (showLegend) {
      renderLegend(d3.select(svgRef.current).append("g"), data, colorScale, width);
    }

    // Cleanup tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  // Create line chart
  const createLineChart = (data: AggregatedDataPoint[]) => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = (showLegend ? height * 0.8 : height) - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scalePoint<string>()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([chartHeight, 0]);

    // Create axes
    svg
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    svg.append("g").call(d3.axisLeft(yScale));

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
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
    const colorScale = getColorScale(data);

    // Create line
    const line = d3
      .line<AggregatedDataPoint>()
      .x(d => xScale(d.label) || 0)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colorScale("0"))
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.label) || 0)
      .attr("cy", d => yScale(d.value))
      .attr("r", 5)
      .attr("fill", (d, i) => colorScale(i.toString()))
      .on("mouseover", (event, d) => {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.label}</strong><br>${d.value.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add x-axis label (groupBy property)
    svg
      .append("text")
      .attr("transform", `translate(${width / 2}, ${chartHeight + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text(groupByProperty);

    // Add y-axis label (aggregated property)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - chartHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(`${getAggregationMethodLabel(aggregationMethod)} of ${propertyToAggregate}`);

    // Add a legend if requested
    if (showLegend) {
      renderLegend(d3.select(svgRef.current).append("g"), data, colorScale, width);
    }

    // Cleanup tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  // Create area chart
  const createAreaChart = (data: AggregatedDataPoint[]) => {
    if (!svgRef.current) return;

    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = (showLegend ? height * 0.8 : height) - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scalePoint<string>()
      .domain(data.map(d => d.label))
      .range([0, width])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([chartHeight, 0]);

    // Create axes
    svg
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em");

    svg.append("g").call(d3.axisLeft(yScale));

    // Get color scale
    const colorScale = getColorScale(data);

    // Create area
    const area = d3
      .area<AggregatedDataPoint>()
      .x(d => xScale(d.label) || 0)
      .y0(chartHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", colorScale("0"))
      .attr("fill-opacity", 0.6)
      .attr("stroke", colorScale("0"))
      .attr("stroke-width", 2)
      .attr("d", area);

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
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
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.label) || 0)
      .attr("cy", d => yScale(d.value))
      .attr("r", 5)
      .attr("fill", (d, i) => colorScale(i.toString()))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.label}</strong><br>${d.value.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add x-axis label (groupBy property)
    svg
      .append("text")
      .attr("transform", `translate(${width / 2}, ${chartHeight + margin.bottom - 10})`)
      .style("text-anchor", "middle")
      .text(groupByProperty);

    // Add y-axis label (aggregated property)
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - chartHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(`${getAggregationMethodLabel(aggregationMethod)} of ${propertyToAggregate}`);

    // Add a legend if requested
    if (showLegend) {
      renderLegend(d3.select(svgRef.current).append("g"), data, colorScale, width);
    }

    // Cleanup tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  // Create radar chart
  const createRadarChart = (data: AggregatedDataPoint[]) => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const chartHeight = showLegend ? height * 0.8 : height;
    const radius = Math.min(width, chartHeight) / 2 - 40;

    // Limit to 8 data points for radar chart readability
    const limitedData = data.slice(0, 8);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${chartHeight / 2})`);

    // Get color scale
    const colorScale = getColorScale(limitedData);

    // Scales for radar chart
    const angleScale = d3
      .scalePoint<string>()
      .domain(limitedData.map(d => d.label))
      .range([0, Math.PI * 2]);

    const radiusScale = d3
      .scaleLinear()
      .domain([0, d3.max(limitedData, d => d.value) || 0])
      .range([0, radius]);

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
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
    const maxValue = d3.max(limitedData, d => d.value) || 0;
    const levels = 5;
    for (let level = 0; level < levels; level++) {
      const r = (radius * (level + 1)) / levels;

      svg
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-dasharray", "5,5");

      // Add level labels
      svg
        .append("text")
        .attr("x", 5)
        .attr("y", -r)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("fill", "gray")
        .text(Math.round((maxValue * (level + 1)) / levels));
    }

    // Draw the radial axes
    limitedData.forEach((d, i) => {
      const angle = angleScale(d.label);
      if (angle === undefined) return;

      const x = radius * Math.cos(angle - Math.PI / 2);
      const y = radius * Math.sin(angle - Math.PI / 2);

      svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "gray")
        .attr("stroke-opacity", 0.3);

      // Add axis labels
      svg
        .append("text")
        .attr("x", 1.1 * x)
        .attr("y", 1.1 * y)
        .attr("text-anchor", angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? "end" : "start")
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .text(d.label.length > 10 ? d.label.substring(0, 10) + "..." : d.label);
    });

    // Create the radar path
    const points = limitedData
      .map(d => {
        const angle = angleScale(d.label);
        if (angle === undefined) return null;

        const r = radiusScale(d.value);
        return {
          x: r * Math.cos(angle - Math.PI / 2),
          y: r * Math.sin(angle - Math.PI / 2),
          label: d.label,
          value: d.value
        };
      })
      .filter(p => p !== null) as { x: number; y: number; label: string; value: number }[];

    // Draw the radar area
    const radarLine = d3
      .lineRadial<{ angle: number; radius: number }>()
      .angle(d => d.angle)
      .radius(d => d.radius)
      .curve(d3.curveLinearClosed);

    const radarPoints = points.map(p => ({
      angle: Math.atan2(p.y, p.x) + Math.PI / 2,
      radius: Math.sqrt(p.x * p.x + p.y * p.y)
    }));

    svg
      .append("path")
      .datum(radarPoints)
      .attr("d", radarLine)
      .attr("fill", colorScale("0"))
      .attr("fill-opacity", 0.4)
      .attr("stroke", colorScale("0"))
      .attr("stroke-width", 2);

    // Add dots at data points
    svg
      .selectAll(".radar-dot")
      .data(points)
      .enter()
      .append("circle")
      .attr("class", "radar-dot")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 5)
      .attr("fill", (d, i) => colorScale(i.toString()))
      .on("mouseover", (event, d) => {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip
          .html(`<strong>${d.label}</strong><br>${d.value.toLocaleString()}`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add a legend if requested
    if (showLegend) {
      renderLegend(d3.select(svgRef.current).append("g"), limitedData, colorScale, width);
    }

    // Cleanup tooltip when component unmounts
    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  };

  // Get human-readable label for aggregation method
  const getAggregationMethodLabel = (method: string): string => {
    switch (method) {
      case "sum":
        return "Soma";
      case "avg":
        return "Média";
      case "count":
        return "Contagem";
      case "min":
        return "Mínimo";
      case "max":
        return "Máximo";
      default:
        return "Valor";
    }
  };

  // Render component
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {targetNodeLabel && relationshipType && (
            <span className="text-xs text-muted-foreground">
              {sourceNodeLabel} → {targetNodeLabel}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <Skeleton className="w-full h-[300px]" />
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center p-6 h-[300px]">
            <p className="text-muted-foreground">Nenhum dado encontrado</p>
          </div>
        ) : (
          <div className="overflow-hidden p-4">
            <svg ref={svgRef} className="w-full" style={{ height: `${height}px` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 