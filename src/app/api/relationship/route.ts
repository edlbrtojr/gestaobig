import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

export async function POST(request: Request) {
  try {
    const { source, target, type, properties } = await request.json();

    // Validate input
    if (!source || !target || !type) {
      console.error("Missing required fields:", { source, target, type });
      return NextResponse.json(
        {
          error: "Source node, target node, and relationship type are required",
        },
        { status: 400 }
      );
    }

    console.log("Creating relationship:", { source, target, type, properties });

    // Connect to Neo4j
    const driver = neo4j.driver(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      neo4j.auth.basic(
        process.env.NEO4J_USER || "neo4j",
        process.env.NEO4J_PASSWORD || "3d1Jun1or"
      )
    );

    const session = driver.session();

    try {
      // Create the Cypher query
      // Simplified approach that works regardless of property presence
      const query = `
        MATCH (a), (b)
        WHERE ID(a) = $sourceId AND ID(b) = $targetId
        CREATE (a)-[r:${type}]->(b)
        SET r += $props
        RETURN r
      `;

      // Execute the query
      const result = await session.run(query, {
        sourceId: neo4j.int(source),
        targetId: neo4j.int(target),
        props: properties || {},
      });

      const createdRelationship = result.records[0]?.get("r");

      console.log("Relationship created successfully:", type);

      await session.close();
      await driver.close();

      return NextResponse.json({
        success: true,
        relationship: createdRelationship,
      });
    } catch (error: any) {
      console.error("Neo4j query error:", error);
      await session.close();
      await driver.close();
      return NextResponse.json(
        {
          error: `Failed to create relationship in database: ${
            error?.message || "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      {
        error: `Failed to process request: ${
          error?.message || "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
