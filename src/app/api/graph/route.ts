import { NextResponse } from "next/server";
import { executeRead } from "@/lib/neo4j";
import { QueryResult } from "neo4j-driver";

interface SearchParams {
  search?: string;
  includeConnections?: string;
  connectionDepth?: string;
}

/**
 * GET handler for /api/graph endpoint
 * Retrieves nodes and relationships from Neo4j
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const includeConnections = url.searchParams.get('includeConnections') === 'true';
    const connectionDepth = parseInt(url.searchParams.get('connectionDepth') || '1', 10);
    
    // If there's a search term and includeConnections is true, we'll use a different query
    if (searchTerm && includeConnections) {
      return await getNodesWithConnections(searchTerm, connectionDepth);
    } else if (searchTerm) {
      // We have a search term but don't need connections
      return await searchNodes(searchTerm);
    } else {
      // No search term, return all nodes
      return await getAllNodes();
    }
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}

/**
 * Get all nodes and relationships
 */
async function getAllNodes() {
  // Query to get all nodes and their properties
  const nodesQuery = `
    MATCH (n)
    RETURN collect({
      id: id(n),
      label: labels(n)[0],
      properties: properties(n)
    }) as nodes
  `;

  // Query to get all relationships and their properties
  const relationshipsQuery = `
    MATCH (source)-[r]->(target)
    RETURN collect({
      id: id(r),
      source: id(source),
      target: id(target),
      type: type(r),
      properties: properties(r)
    }) as relationships
  `;

  // Run both queries in parallel for efficiency
  const [nodesResult, relationshipsResult] = await Promise.all([
    executeRead<QueryResult>(nodesQuery),
    executeRead<QueryResult>(relationshipsQuery),
  ]);

  // Extract the data from the results
  const nodes = nodesResult.records[0]?.get("nodes") || [];
  const relationships = relationshipsResult.records[0]?.get("relationships") || [];

  // Return the graph data as JSON
  return NextResponse.json({ nodes, relationships });
}

/**
 * Search for nodes matching a search term (without including connections)
 */
async function searchNodes(searchTerm: string) {
  // Query to get nodes that match the search term
  const nodesQuery = `
    MATCH (n)
    WHERE toLower(n.name) CONTAINS toLower($searchTerm)
    RETURN collect({
      id: id(n),
      label: labels(n)[0],
      properties: properties(n)
    }) as nodes
  `;

  // Get relationships only between the matching nodes
  const relationshipsQuery = `
    MATCH (source)-[r]->(target)
    WHERE toLower(source.name) CONTAINS toLower($searchTerm)
    AND toLower(target.name) CONTAINS toLower($searchTerm)
    RETURN collect({
      id: id(r),
      source: id(source),
      target: id(target),
      type: type(r),
      properties: properties(r)
    }) as relationships
  `;

  // Run both queries in parallel
  const [nodesResult, relationshipsResult] = await Promise.all([
    executeRead<QueryResult>(nodesQuery, { searchTerm }),
    executeRead<QueryResult>(relationshipsQuery, { searchTerm }),
  ]);

  // Extract the data from the results
  const nodes = nodesResult.records[0]?.get("nodes") || [];
  const relationships = relationshipsResult.records[0]?.get("relationships") || [];

  // Return the graph data as JSON
  return NextResponse.json({ nodes, relationships });
}

/**
 * Search for nodes matching a search term and include their connections up to a specified depth
 */
async function getNodesWithConnections(searchTerm: string, depth: number) {
  // Ensure depth is a valid number between 1 and 5
  const connectionDepth = Math.min(Math.max(depth, 1), 5);
  
  // Query to get nodes that match the search term and their connections up to the specified depth
  // Using standard Cypher variable-length path patterns instead of APOC
  const query = `
    // First find all nodes matching the search term
    MATCH (baseNode)
    WHERE toLower(baseNode.name) CONTAINS toLower($searchTerm)
    WITH collect(DISTINCT baseNode) as baseNodes
    
    // Process each base node to find connections
    UNWIND baseNodes as startNode
    
    // Find paths with variable-length relationships in either direction
    OPTIONAL MATCH outPath = (startNode)-[outRel*1..${connectionDepth}]->(outNode)
    WITH startNode, baseNodes, collect(DISTINCT outNode) as outNodes, collect(DISTINCT outRel) as outRels
    
    OPTIONAL MATCH inPath = (startNode)<-[inRel*1..${connectionDepth}]-(inNode)
    WITH startNode, baseNodes, outNodes, outRels, collect(DISTINCT inNode) as inNodes, collect(DISTINCT inRel) as inRels
    
    // Collect all nodes and relationships for this start node
    WITH 
      baseNodes, 
      collect(startNode) + collect(DISTINCT outNodes) + collect(DISTINCT inNodes) as connectedNodeGroups,
      collect(DISTINCT outRels) + collect(DISTINCT inRels) as relGroups
      
    // Flatten the node collections
    WITH baseNodes, 
         REDUCE(acc = [], nodeGroup IN connectedNodeGroups | acc + nodeGroup) as flattenedNodes,
         REDUCE(acc = [], relGroup IN relGroups | acc + relGroup) as flattenedRelGroups
         
    // Handle relationship collections (these are arrays of arrays from the path matching)
    WITH baseNodes, flattenedNodes,
         REDUCE(acc = [], relArray IN flattenedRelGroups | 
           CASE WHEN relArray IS NULL THEN acc
                ELSE acc + relArray END) as allRelArrays
    
    // Clean up final results - remove nulls and format nodes and relationships
    WITH 
      [node IN baseNodes WHERE node IS NOT NULL] + 
      [node IN flattenedNodes WHERE node IS NOT NULL] as allNodes,
      allRelArrays
      
    // Now we need to return formatted nodes and relationships
    RETURN 
      // Format and deduplicate nodes
      apoc.coll.toSet([node IN allNodes WHERE node IS NOT NULL | {
        id: id(node),
        label: labels(node)[0],
        properties: properties(node)
      }]) as nodes,
      
      // Format and deduplicate relationships
      apoc.coll.toSet([rel IN allRelArrays WHERE rel IS NOT NULL | {
        id: id(rel),
        source: id(startNode(rel)),
        target: id(endNode(rel)),
        type: type(rel),
        properties: properties(rel)
      }]) as relationships
  `;
  
  // Try the query with APOC functions first
  try {
    const result = await executeRead<QueryResult>(query, { searchTerm });
    const nodes = result.records[0]?.get("nodes") || [];
    const relationships = result.records[0]?.get("relationships") || [];
    return NextResponse.json({ nodes, relationships });
  } catch (error) {
    // If APOC is not available, try a simpler fallback query
    console.error("Error with complex query, trying fallback:", error);
    return await searchWithSimpleFallback(searchTerm, connectionDepth);
  }
}

/**
 * A simpler fallback implementation that doesn't require APOC
 */
async function searchWithSimpleFallback(searchTerm: string, depth: number) {
  // Simplified query for databases without APOC
  const query = `
    // Match starting nodes containing the search term
    MATCH (start)
    WHERE toLower(start.name) CONTAINS toLower($searchTerm)
    
    // Get nodes that are directly connected to starting nodes
    WITH start
    MATCH (start)-[r1]-(connected)
    
    // Get relationships within connected nodes
    WITH collect(DISTINCT start) AS startNodes, 
         collect(DISTINCT connected) AS connectedNodes, 
         collect(DISTINCT r1) AS directRelationships
    
    // Return formatted results - simplify to avoid nested collection issues
    RETURN 
      // Format nodes - include both start and connected nodes
      [node IN startNodes | {
        id: id(node),
        label: labels(node)[0],
        properties: properties(node)
      }] + 
      [node IN connectedNodes | {
        id: id(node),
        label: labels(node)[0],
        properties: properties(node)
      }] AS nodes,
      
      // Format relationships
      [rel IN directRelationships | {
        id: id(rel),
        source: id(startNode(rel)),
        target: id(endNode(rel)), 
        type: type(rel),
        properties: properties(rel)
      }] AS relationships
  `;

  try {
    const result = await executeRead<QueryResult>(query, { searchTerm });
    const nodes = result.records[0]?.get("nodes") || [];
    const relationships = result.records[0]?.get("relationships") || [];
    return NextResponse.json({ nodes, relationships });
  } catch (error) {
    console.error("Fallback query also failed:", error);
    
    // Last resort - just return the matching nodes without any relationships
    try {
      const lastResortQuery = `
        MATCH (n)
        WHERE toLower(n.name) CONTAINS toLower($searchTerm)
        RETURN 
          collect({
            id: id(n),
            label: labels(n)[0],
            properties: properties(n)
          }) AS nodes,
          [] AS relationships
      `;
      
      const lastResult = await executeRead<QueryResult>(lastResortQuery, { searchTerm });
      const nodes = lastResult.records[0]?.get("nodes") || [];
      return NextResponse.json({ nodes, relationships: [] });
    } catch (finalError) {
      return NextResponse.json(
        { error: "Failed to search graph data", details: (error as Error).message },
        { status: 500 }
      );
    }
  }
}
