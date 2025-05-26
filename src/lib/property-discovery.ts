import { executeQuery } from "./neo4j";
import { getNodeProperties } from "./schema";

/**
 * Fetches numeric or string property names for a given node label
 * This is useful for populating dropdowns in chart configuration
 */
export async function getNodePropertyNames(nodeLabel: string): Promise<string[]> {
  try {
    // First try to get properties from schema
    const schemaProperties = await getNodeProperties(nodeLabel);
    if (schemaProperties && schemaProperties.length > 0) {
      // Return only properties that are numbers or strings (not arrays/objects)
      return schemaProperties
        .filter(prop => ["string", "number", "enum", "date", "boolean"].includes(prop.type))
        .map(prop => prop.name);
    }

    // If schema doesn't have properties, discover them from the database
    const query = `
      MATCH (n:${nodeLabel})
      WHERE size(keys(n)) > 0 
      RETURN keys(n) AS properties
      LIMIT 1
    `;

    const result = await executeQuery(query);
    
    if (result?.records?.length > 0) {
      const properties = result.records[0].get('properties');
      return properties.filter((prop: string) => 
        prop !== "id" && 
        prop !== "_id" && 
        prop !== "neo4jImportId" && 
        !prop.startsWith("_")
      );
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching node property names:", error);
    return [];
  }
}

/**
 * Discovers numeric properties suitable for aggregation for a given node label
 */
export async function getNumericPropertyNames(nodeLabel: string): Promise<string[]> {
  try {
    // First try to get properties from schema
    const schemaProperties = await getNodeProperties(nodeLabel);
    if (schemaProperties && schemaProperties.length > 0) {
      // Return only properties that are numbers
      return schemaProperties
        .filter(prop => prop.type === "number")
        .map(prop => prop.name);
    }

    // If schema doesn't have properties, discover them from the database without APOC
    // First get all node properties
    const allPropsQuery = `
      MATCH (n:${nodeLabel})
      WHERE size(keys(n)) > 0 
      RETURN keys(n) AS properties
      LIMIT 1
    `;
    
    const allPropsResult = await executeQuery(allPropsQuery);
    
    if (!allPropsResult?.records?.length) {
      return [];
    }
    
    const allProperties = allPropsResult.records[0].get('properties');
    const filteredProps = allProperties.filter((prop: string) => 
      prop !== "id" && 
      prop !== "_id" && 
      prop !== "neo4jImportId" && 
      !prop.startsWith("_")
    );
    
    // For each property, check if it contains numeric values
    const numericProperties = [];
    
    for (const prop of filteredProps) {
      // Try to find a node with a numeric value for this property
      const checkNumericQuery = `
        MATCH (n:${nodeLabel})
        WHERE n.${prop} IS NOT NULL 
          AND (toString(toInteger(n.${prop})) = toString(n.${prop}) 
            OR toString(toFloat(n.${prop})) = toString(n.${prop}))
        RETURN count(n) > 0 as isNumeric
        LIMIT 1
      `;
      
      try {
        const result = await executeQuery(checkNumericQuery);
        if (result?.records?.length > 0 && result.records[0].get('isNumeric')) {
          numericProperties.push(prop);
        }
      } catch (err) {
        // Skip properties that cause errors when checking
        console.warn(`Error checking if property ${prop} is numeric: ${err}`);
      }
    }
    
    return numericProperties;
  } catch (error) {
    console.error("Error fetching numeric property names:", error);
    return [];
  }
}

/**
 * Discovers text/categorical properties suitable for grouping for a given node label
 */
export async function getCategoricalPropertyNames(nodeLabel: string): Promise<string[]> {
  try {
    // First try to get properties from schema
    const schemaProperties = await getNodeProperties(nodeLabel);
    if (schemaProperties && schemaProperties.length > 0) {
      // Return only properties that are text-based or enums
      return schemaProperties
        .filter(prop => ["string", "enum"].includes(prop.type))
        .map(prop => prop.name);
    }

    // If schema doesn't have properties, discover them from the database without APOC
    // First get all node properties
    const allPropsQuery = `
      MATCH (n:${nodeLabel})
      WHERE size(keys(n)) > 0 
      RETURN keys(n) AS properties
      LIMIT 1
    `;
    
    const allPropsResult = await executeQuery(allPropsQuery);
    
    if (!allPropsResult?.records?.length) {
      return [];
    }
    
    const allProperties = allPropsResult.records[0].get('properties');
    const filteredProps = allProperties.filter((prop: string) => 
      prop !== "id" && 
      prop !== "_id" && 
      prop !== "neo4jImportId" && 
      !prop.startsWith("_")
    );
    
    // For each property, check if it contains string values
    const categoricalProperties = [];
    
    for (const prop of filteredProps) {
      // Try to find a node with a string value for this property
      // Exclude properties already identified as numeric
      const checkStringQuery = `
        MATCH (n:${nodeLabel})
        WHERE n.${prop} IS NOT NULL 
          AND NOT (toString(toInteger(n.${prop})) = toString(n.${prop}) 
            OR toString(toFloat(n.${prop})) = toString(n.${prop}))
        RETURN count(n) > 0 as isString
        LIMIT 1
      `;
      
      try {
        const result = await executeQuery(checkStringQuery);
        if (result?.records?.length > 0 && result.records[0].get('isString')) {
          categoricalProperties.push(prop);
        }
      } catch (err) {
        // Skip properties that cause errors when checking
        console.warn(`Error checking if property ${prop} is string: ${err}`);
      }
    }
    
    return categoricalProperties;
  } catch (error) {
    console.error("Error fetching categorical property names:", error);
    return [];
  }
}

/**
 * Gets the unique values for a property on a node label (for categorical properties)
 * This can be used to help users understand what values they might want to filter or group by
 */
export async function getPropertyValues(nodeLabel: string, propertyName: string, limit: number = 20): Promise<string[]> {
  try {
    const query = `
      MATCH (n:${nodeLabel})
      WHERE n.${propertyName} IS NOT NULL
      RETURN DISTINCT n.${propertyName} AS value
      ORDER BY value
      LIMIT $limit
    `;

    const result = await executeQuery(query, { limit });
    
    if (result?.records?.length > 0) {
      return result.records.map((record: any) => String(record.get('value')));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching property values for ${nodeLabel}.${propertyName}:`, error);
    return [];
  }
} 