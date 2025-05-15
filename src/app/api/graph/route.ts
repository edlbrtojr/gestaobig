import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

/**
 * GET handler for /api/graph endpoint
 * Retrieves nodes and relationships from Neo4j
 */
export async function GET() {
  try {
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
      runQuery(nodesQuery),
      runQuery(relationshipsQuery),
    ]);

    // Extract the data from the results
    const nodes = nodesResult[0]?.get("nodes") || [];
    const relationships = relationshipsResult[0]?.get("relationships") || [];

    // Return the graph data as JSON
    return NextResponse.json({ nodes, relationships });
  } catch (error) {
    console.error("Error fetching graph data:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
