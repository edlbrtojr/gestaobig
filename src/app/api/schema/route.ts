import { NextRequest, NextResponse } from "next/server";
import { executeRead, executeWrite } from "@/lib/neo4j";
import { QueryResult } from "neo4j-driver";
import { GraphSchema } from "@/lib/schema";

/**
 * GET handler for /api/schema endpoint
 * Retrieves the current graph schema from the database
 */
export async function GET() {
  try {
    const query = `
      MATCH (config:SchemaConfig)
      RETURN config.schema as schema
    `;

    const result = await executeRead<QueryResult>(query);
    const schemaData = result.records[0]?.get("schema");

    if (!schemaData) {
      // If no schema is found, return a 404 status
      return NextResponse.json(
        { error: "Schema not found" },
        { status: 404 }
      );
    }

    // Parse the schema from the JSON string
    const schema = JSON.parse(schemaData);
    return NextResponse.json(schema);
  } catch (error) {
    console.error("Error fetching schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch schema" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/schema endpoint
 * Updates the graph schema in the database
 */
export async function POST(request: NextRequest) {
  try {
    const schema: GraphSchema = await request.json();

    // Validate the schema
    if (!schema || !schema.nodeTypes || !schema.relationshipTypes) {
      return NextResponse.json(
        { error: "Invalid schema format" },
        { status: 400 }
      );
    }

    // Store the schema in the database
    const query = `
      MERGE (config:SchemaConfig)
      SET config.schema = $schema,
          config.updatedAt = datetime()
      RETURN config
    `;

    await executeWrite<QueryResult>(query, {
      schema: JSON.stringify(schema)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving schema:", error);
    return NextResponse.json(
      { error: "Failed to save schema" },
      { status: 500 }
    );
  }
} 