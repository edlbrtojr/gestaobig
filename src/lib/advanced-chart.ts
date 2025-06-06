import { executeQuery } from "./neo4j";

/**
 * Interface for aggregated data that will be displayed in the advanced chart
 */
export interface AggregatedDataPoint {
  label: string;
  value: number;
}

/**
 * Options for the advanced chart data query
 */
export interface AdvancedChartOptions {
  sourceNodeLabel: string;
  targetNodeLabel: string;
  relationshipType: string;
  propertyToAggregate: string;
  aggregationMethod: "sum" | "avg" | "count" | "min" | "max";
  groupByProperty: string;
  sortDirection: "asc" | "desc";
  topResults?: number;
}

/**
 * Fetches aggregated data for the advanced chart based on relationship traversal
 * Follows a pattern like: (source:SourceLabel)-[r:RELATIONSHIP]->(target:TargetLabel)
 * And aggregates a property from the source node grouped by a property from the target node
 */
export async function fetchAdvancedChartData(
  options: AdvancedChartOptions
): Promise<AggregatedDataPoint[]> {
  const {
    sourceNodeLabel,
    targetNodeLabel,
    relationshipType,
    propertyToAggregate,
    aggregationMethod,
    groupByProperty,
    sortDirection,
    topResults = 10
  } = options;

  // Map aggregation method to Cypher function
  const aggregationFunction = getAggregationFunction(aggregationMethod);
  
  // If any required property is missing or empty, return empty result
  if (!sourceNodeLabel || !propertyToAggregate || !groupByProperty || !targetNodeLabel) {
    console.error("Missing required properties for fetchAdvancedChartData");
    return [];
  }
  
  // Build Cypher query
  const query = `
    MATCH (source:${sourceNodeLabel})-[r:${relationshipType}]->(target:${targetNodeLabel})
    WHERE source.${propertyToAggregate} IS NOT NULL AND target.${groupByProperty} IS NOT NULL
    RETURN 
      target.${groupByProperty} AS label,
      ${aggregationFunction}(source.${propertyToAggregate}) AS value
    ORDER BY value ${sortDirection === "desc" ? "DESC" : "ASC"}
    LIMIT $topResults
  `;

  try {
    // Ensure topResults is an integer
    const params = { topResults: parseInt(String(topResults), 10) || 10 };
    console.log("Query params:", params);
    
    const result = await executeQuery(query, params);
    
    if (!result || !result.records) {
      return [];
    }
    
    // Convert records to the expected format
    return result.records.map((record: any) => ({
      label: record.get('label'),
      value: record.get('value')
    }));
  } catch (error) {
    console.error("Error fetching advanced chart data:", error);
    return [];
  }
}

/**
 * Get the appropriate Cypher aggregation function based on method
 */
function getAggregationFunction(method: string): string {
  switch (method) {
    case "sum":
      return "sum";
    case "avg":
      return "avg";
    case "count":
      return "count";
    case "min":
      return "min";
    case "max":
      return "max";
    default:
      return "sum";
  }
}

/**
 * Fetches data for reverse relationships (target to source)
 * This is useful for cases when relationship direction is opposite
 */
export async function fetchReverseAdvancedChartData(
  options: AdvancedChartOptions
): Promise<AggregatedDataPoint[]> {
  const {
    sourceNodeLabel,
    targetNodeLabel,
    relationshipType,
    propertyToAggregate,
    aggregationMethod,
    groupByProperty,
    sortDirection,
    topResults = 10
  } = options;

  // If any required property is missing or empty, return empty result
  if (!sourceNodeLabel || !propertyToAggregate || !groupByProperty || !targetNodeLabel) {
    console.error("Missing required properties for fetchReverseAdvancedChartData");
    return [];
  }

  const aggregationFunction = getAggregationFunction(aggregationMethod);
  
  // Note the reversed relationship direction in the query
  const query = `
    MATCH (target:${targetNodeLabel})<-[r:${relationshipType}]-(source:${sourceNodeLabel})
    WHERE source.${propertyToAggregate} IS NOT NULL AND target.${groupByProperty} IS NOT NULL
    RETURN 
      target.${groupByProperty} AS label,
      ${aggregationFunction}(source.${propertyToAggregate}) AS value
    ORDER BY value ${sortDirection === "desc" ? "DESC" : "ASC"}
    LIMIT $topResults
  `;

  try {
    // Ensure topResults is an integer
    const params = { topResults: parseInt(String(topResults), 10) || 10 };
    console.log("Reverse query params:", params);
    
    const result = await executeQuery(query, params);
    
    if (!result || !result.records) {
      return [];
    }
    
    return result.records.map((record: any) => ({
      label: record.get('label'),
      value: record.get('value')
    }));
  } catch (error) {
    console.error("Error fetching reverse advanced chart data:", error);
    return [];
  }
}

/**
 * Fetches chart data without requiring a specific relationship
 * This is useful when you just want to aggregate properties across nodes of a specific type
 */
export async function fetchSimpleAggregationData(
  sourceNodeLabel: string,
  propertyToAggregate: string,
  groupByProperty: string,
  aggregationMethod: "sum" | "avg" | "count" | "min" | "max",
  sortDirection: "asc" | "desc" = "desc",
  topResults: number = 10
): Promise<AggregatedDataPoint[]> {
  // If any required property is missing or empty, return empty result
  if (!sourceNodeLabel || !propertyToAggregate || !groupByProperty) {
    console.error("Missing required properties for fetchSimpleAggregationData");
    return [];
  }

  const aggregationFunction = getAggregationFunction(aggregationMethod);
  
  const query = `
    MATCH (source:${sourceNodeLabel})
    WHERE source.${propertyToAggregate} IS NOT NULL AND source.${groupByProperty} IS NOT NULL
    RETURN 
      source.${groupByProperty} AS label,
      ${aggregationFunction}(source.${propertyToAggregate}) AS value
    ORDER BY value ${sortDirection === "desc" ? "DESC" : "ASC"}
    LIMIT $topResults
  `;

  try {
    // Ensure topResults is an integer
    const params = { topResults: parseInt(String(topResults), 10) || 10 };
    console.log("Simple query params:", params);
    
    const result = await executeQuery(query, params);
    
    if (!result || !result.records) {
      return [];
    }
    
    return result.records.map((record: any) => ({
      label: record.get('label'),
      value: record.get('value')
    }));
  } catch (error) {
    console.error("Error fetching simple aggregation data:", error);
    return [];
  }
} 