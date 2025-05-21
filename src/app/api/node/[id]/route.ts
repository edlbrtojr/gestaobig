import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

// Create a Neo4j driver instance
const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = driver.session();

  try {
    const { properties } = await request.json();
    const nodeId = parseInt(params.id);

    // Update node properties
    const result = await session.run(
      `
      MATCH (n)
      WHERE ID(n) = $nodeId
      SET n += $properties
      RETURN n
      `,
      {
        nodeId: nodeId,
        properties: properties,
      }
    );

    const updatedNode = result.records[0]?.get("n");

    if (!updatedNode) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedNode.identity,
      label: updatedNode.labels[0],
      properties: updatedNode.properties,
    });
  } catch (error) {
    console.error("Error updating node:", error);
    return NextResponse.json(
      { error: "Failed to update node" },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
