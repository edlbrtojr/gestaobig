import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

// Configuração do driver Neo4j
const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

/**
 * GET handler for /api/graph endpoint
 * Retrieves nodes and relationships from Neo4j with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const search = searchParams.get('search') || '';
    const company = searchParams.get('company') || '';
    const unit = searchParams.get('unit') || '';
    
    // Get all node labels and relationship types
    const nodeLabels = await getNodeLabels();
    const relationshipTypes = await getRelationshipTypes();
    
    // Build property filters based on search parameters
    const propertyFilters: Array<{property: string, value: any, operator: string}> = [];
    
    if (search) {
      propertyFilters.push({
        property: 'name',
        value: `(?i).*${search}.*`,
        operator: '=~'
      });
    }
    
    if (company && company !== 'SISTEMA FIEAC') {
      propertyFilters.push({
        property: 'company',
        value: company,
        operator: '='
      });
    }
    
    if (unit && unit !== 'Todas') {
      propertyFilters.push({
        property: 'unit',
        value: unit,
        operator: '='
      });
    }
    
    // Get filtered graph data
    return await getFilteredGraphData(nodeLabels, relationshipTypes, propertyFilters);
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

// Helper function to get all node labels
async function getNodeLabels(): Promise<string[]> {
  const session = driver.session();
  try {
    const result = await session.run(`
      CALL db.labels() YIELD label
      RETURN collect(label) AS labels
    `);
    return result.records[0].get('labels');
  } finally {
    await session.close();
  }
}

// Helper function to get all relationship types
async function getRelationshipTypes(): Promise<string[]> {
  const session = driver.session();
  try {
    const result = await session.run(`
      CALL db.relationshipTypes() YIELD relationshipType
      RETURN collect(relationshipType) AS types
    `);
    return result.records[0].get('types');
  } finally {
    await session.close();
  }
}

// Function to get filtered graph data
async function getFilteredGraphData(
  nodeLabels: string[],
  relationshipTypes: string[],
  propertyFilters: Array<{property: string, value: any, operator: string}>
) {
  const session = driver.session();
  
  try {
    // Build the Cypher query
    let cypher = `
      MATCH (n)
      WHERE true
    `;
    
    // Add property filters
    if (propertyFilters.length > 0) {
      const filters = propertyFilters.map((filter, index) => {
        return `n.${filter.property} ${filter.operator} $filterValue${index}`;
      }).join(" OR ");
      
      cypher += ` AND (${filters})`;
    }
    
    // Complete the query to fetch nodes and relationships
    cypher += `
      WITH collect(n) AS nodes
      UNWIND nodes AS n
      MATCH (n)-[r]-(m)
      WHERE m IN nodes
      RETURN nodes, collect(r) AS relationships
    `;
    
    // Create parameters for the query
    const params: Record<string, any> = {};
    propertyFilters.forEach((filter, index) => {
      params[`filterValue${index}`] = filter.value;
    });
    
    // Execute the query
    const result = await session.run(cypher, params);
    
    if (result.records.length === 0) {
      return NextResponse.json({ nodes: [], relationships: [] });
    }
    
    // Process the results
    const record = result.records[0];
    const nodes = record.get('nodes').map((node: any) => {
      return {
        id: node.identity,
        label: node.labels[0],
        properties: node.properties
      };
    });
    
    const relationships = record.get('relationships').map((rel: any) => {
      return {
        id: rel.identity,
        source: rel.start,
        target: rel.end,
        type: rel.type,
        properties: rel.properties
      };
    });
    
    // Return the graph data
    return NextResponse.json({ nodes, relationships });
  } catch (error) {
    console.error("Error fetching filtered graph data:", error);
    return NextResponse.json({ 
      nodes: [], 
      relationships: [],
      status: "error",
      message: "Failed to retrieve graph data"
    }, { status: 200 }); // Return 200 to not break the UI
  } finally {
    await session.close();
  }
}
