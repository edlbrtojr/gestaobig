import { NextResponse } from "next/server";
import { executeRead } from "@/lib/neo4j";
import { QueryResult } from "neo4j-driver";

/**
 * GET handler for /api/graph endpoint
 * Retrieves nodes and relationships from Neo4j with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const nodeLabels = searchParams.get('nodeLabels')?.split(',').filter(Boolean) || [];
    const relationshipTypes = searchParams.get('relationshipTypes')?.split(',').filter(Boolean) || [];
    const propertyFilters = searchParams.get('propertyFilters') ? 
      JSON.parse(searchParams.get('propertyFilters') || '[]') : 
      [];

    return await getFilteredGraphData(nodeLabels, relationshipTypes, propertyFilters);
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

/**
 * Get filtered nodes and relationships based on criteria
 */
async function getFilteredGraphData(
  nodeLabels: string[],
  relationshipTypes: string[],
  propertyFilters: Array<{property: string, value: any, operator: string}>
) {
  // Build node label filter condition
  let nodeLabelFilter = '';
  let nodeFilterParams: Record<string, any> = {};
  
  if (nodeLabels.length > 0) {
    nodeLabelFilter = 'WHERE ' + nodeLabels.map((label, i) => `ANY(l IN labels(n) WHERE l = $label${i})`).join(' OR ');
    nodeLabels.forEach((label, i) => {
      nodeFilterParams[`label${i}`] = label;
    });
  }

  // Build property filter conditions
  if (propertyFilters.length > 0) {
    const propConditions = propertyFilters.map((filter, i) => {
      const { property, operator, value } = filter;
      nodeFilterParams[`propVal${i}`] = value;
      
      switch (operator) {
        case 'CONTAINS': return `n.${property} CONTAINS $propVal${i}`;
        case 'STARTS WITH': return `n.${property} STARTS WITH $propVal${i}`;
        case 'ENDS WITH': return `n.${property} ENDS WITH $propVal${i}`;
        default: return `n.${property} ${operator} $propVal${i}`;
      }
    });
    
    nodeLabelFilter = nodeLabelFilter 
      ? `${nodeLabelFilter} AND ${propConditions.join(' AND ')}`
      : `WHERE ${propConditions.join(' AND ')}`;
  }
  
  // Query to get filtered nodes
  const nodesQuery = `
    MATCH (n)
    ${nodeLabelFilter}
    RETURN collect({
      id: toString(id(n)),
      label: labels(n)[0],
      properties: properties(n)
    }) as nodes
  `;

  // Build relationship type filter condition
  let relTypeFilter = '';
  let relFilterParams: Record<string, any> = {};
  
  if (relationshipTypes.length > 0) {
    relTypeFilter = 'WHERE ' + relationshipTypes.map((type, i) => `type(r) = $relType${i}`).join(' OR ');
    relationshipTypes.forEach((type, i) => {
      relFilterParams[`relType${i}`] = type;
    });
  }

  // Query to get filtered relationships
  const relationshipsQuery = `
    MATCH (source)-[r]->(target)
    ${relTypeFilter}
    RETURN collect({
      id: toString(id(r)),
      source: toString(id(source)),
      target: toString(id(target)),
      type: type(r),
      properties: properties(r)
    }) as relationships
  `;

  try {
    // Run both queries in parallel for efficiency
    const [nodesResult, relationshipsResult] = await Promise.all([
      executeRead<QueryResult>(nodesQuery, nodeFilterParams),
      executeRead<QueryResult>(relationshipsQuery, relFilterParams),
    ]);

    // Se alguma das consultas falhou, retorne um conjunto vazio de dados
    if (!nodesResult || !relationshipsResult) {
      console.warn("Algumas consultas ao banco de dados falharam, retornando dados vazios");
      return NextResponse.json({ 
        nodes: [], 
        relationships: [],
        status: "partial_error"
      });
    }

    // Extract the data from the results
    const nodes = nodesResult.records[0]?.get("nodes") || [];
    const relationships = relationshipsResult.records[0]?.get("relationships") || [];

    // Return the filtered graph data as JSON
    return NextResponse.json({ nodes, relationships });
  } catch (error) {
    console.error("Erro ao executar consultas do grafo:", error);
    // Retornar dados vazios em caso de erro
    return NextResponse.json({ 
      nodes: [], 
      relationships: [],
      status: "error",
      message: "Falha ao recuperar dados do grafo"
    }, { status: 200 }); // Retornar 200 para não quebrar a interface
  }
}
