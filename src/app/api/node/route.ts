import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

export async function POST(request: Request) {
  try {
    const { name, label, properties } = await request.json();

    // Validate input
    if (!name || !label) {
      console.error("Missing required fields:", { name, label });
      return NextResponse.json(
        { error: "Name and label are required" },
        { status: 400 }
      );
    }

    console.log("Creating node:", { name, label, properties });

    // Try different connection parameters if needed
    const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
    const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
    const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "3d1Jun1or";

    console.log("Connecting to Neo4j:", { NEO4J_URI, NEO4J_USER });

    // Connect to Neo4j with explicit config
    const driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      {
        encrypted: false, // Try with encryption off
        disableLosslessIntegers: true, // Handle integers directly
      }
    );

    // Test the connection first
    try {
      await driver.verifyConnectivity();
      console.log("Neo4j connection successful");
    } catch (connErr: any) {
      console.error("Neo4j connection failed:", connErr?.message);
      await driver.close();
      return NextResponse.json(
        {
          error: `Failed to connect to Neo4j: ${
            connErr?.message || "Connection failed"
          }`,
        },
        { status: 500 }
      );
    }

    const session = driver.session();

    try {
      // Use a very simple query first to test
      const query = `
        CREATE (n:${label}) 
        SET n.name = $name 
        SET n += $props
        RETURN n
      `;

      // Execute the query
      console.log("Executing Neo4j query...");
      const result = await session.run(query, {
        name: name,
        props: properties || {},
      });

      const createdNode = result.records[0]?.get("n");

      console.log("Node created successfully:", label);

      await session.close();
      await driver.close();

      return NextResponse.json({ success: true, node: createdNode });
    } catch (error: any) {
      console.error("Neo4j query error:", error);
      await session.close();
      await driver.close();
      return NextResponse.json(
        {
          error: `Failed to create node in database: ${
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
