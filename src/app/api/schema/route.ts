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
    
    if (!result) {
      console.warn("Falha na consulta do esquema, o banco de dados pode estar indisponível");
      // Return empty schema instead of failing
      return NextResponse.json(
        {
          nodeTypes: {},
          relationshipTypes: {},
          status: "error",
          message: "Banco de dados indisponível"
        },
        {
          headers: {
            // Add cache control headers to prevent excessive requests
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        }
      );
    }
    
    const schemaData = result.records[0]?.get("schema");

    if (!schemaData) {
      // Default empty schema if none found
      const defaultSchema: GraphSchema = {
        nodeTypes: {},
        relationshipTypes: {}
      };
      return NextResponse.json(defaultSchema, {
        headers: {
          // Add cache control headers to prevent excessive requests
          'Cache-Control': 'public, max-age=60, s-maxage=300',
        },
      });
    }

    // Parse the schema from the JSON string
    const schema = JSON.parse(schemaData);
    
    // Add cache control headers to allow caching for 5 minutes
    return NextResponse.json(schema, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (error) {
    console.error("Error fetching schema:", error);
    // Return empty schema instead of failing
    return NextResponse.json(
      {
        nodeTypes: {},
        relationshipTypes: {},
        status: "error",
        message: "Falha ao obter esquema"
      },
      {
        headers: {
          // Add cache control headers even for error responses
          'Cache-Control': 'public, max-age=30',
        },
      }
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
        { error: "Formato de esquema inválido" },
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

    const result = await executeWrite<QueryResult>(query, {
      schema: JSON.stringify(schema)
    });
    
    if (!result) {
      return NextResponse.json(
        { 
          success: false,
          status: "error",
          message: "Banco de dados indisponível" 
        }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving schema:", error);
    return NextResponse.json(
      { error: "Falha ao salvar esquema" },
      { status: 500 }
    );
  }
} 