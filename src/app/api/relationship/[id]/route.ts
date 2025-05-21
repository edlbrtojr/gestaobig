import { NextRequest, NextResponse } from "next/server";
import neo4j from "neo4j-driver";
import { getDriver } from "@/lib/neo4j";

// GET route handler
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // First, explicitly check if params are available
  if (!params || !params.id) {
    return NextResponse.json(
      { error: "Relationship ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get relationship ID from params safely
    const id = String(params.id);

    // Get a session from our singleton driver
    const session = getDriver().session();

    try {
      // Create the Cypher query to fetch the relationship with source and target node names
      const query = `
        MATCH (source)-[r]->(target)
        WHERE ID(r) = $relationshipId
        RETURN r, 
               ID(source) as sourceId, 
               source.name as sourceName, 
               labels(source)[0] as sourceLabel,
               ID(target) as targetId, 
               target.name as targetName,
               labels(target)[0] as targetLabel
      `;

      // Execute the query
      const result = await session.run(query, {
        relationshipId: neo4j.int(id),
      });

      // Check if relationship was found
      if (result.records.length === 0) {
        await session.close();
        return NextResponse.json(
          { error: "Relationship not found" },
          { status: 404 }
        );
      }

      const record = result.records[0];
      const relationship = record.get("r");
      
      const response = {
        id: relationship.identity.toString(),
        type: relationship.type,
        properties: relationship.properties,
        source: record.get("sourceId").toString(),
        sourceNodeName: record.get("sourceName"),
        sourceNodeLabel: record.get("sourceLabel"),
        target: record.get("targetId").toString(),
        targetNodeName: record.get("targetName"),
        targetNodeLabel: record.get("targetLabel")
      };

      await session.close();
      return NextResponse.json(response);
    } catch (error: any) {
      await session.close();
      console.error("Neo4j query error:", error);
      return NextResponse.json(
        {
          error: `Failed to retrieve relationship from database: ${
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

// PUT route handler
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // First, explicitly check if params are available
  if (!params || !params.id) {
    return NextResponse.json(
      { error: "Relationship ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get relationship ID from params safely
    const id = String(params.id);
    
    const requestData = await req.json();
    const { type } = requestData;

    // Validate input
    if (!type) {
      return NextResponse.json(
        { error: "Relationship type is required" },
        { status: 400 }
      );
    }

    // Get a session from our singleton driver
    const session = getDriver().session();

    try {
      // In Neo4j, we need to delete the old relationship and create a new one with the new type
      // First, get the relationship data
      const getRelationshipQuery = `
        MATCH (source)-[r]->(target)
        WHERE id(r) = $relationshipId
        RETURN source, target, r
      `;

      const relationshipResult = await session.run(getRelationshipQuery, {
        relationshipId: neo4j.int(id)
      });

      if (relationshipResult.records.length === 0) {
        await session.close();
        return NextResponse.json(
          { error: "Relationship not found" },
          { status: 404 }
        );
      }

      const record = relationshipResult.records[0];
      const source = record.get('source');
      const target = record.get('target');
      const oldRelationship = record.get('r');
      const properties = oldRelationship.properties || {};

      // Delete the old relationship and create a new one with the new type
      const updateTypeQuery = `
        MATCH (source)-[r]->(target)
        WHERE id(r) = $relationshipId
        WITH source, target, r, properties(r) as props
        DELETE r
        CREATE (source)-[newRel:${type}]->(target)
        SET newRel += props
        RETURN newRel, id(newRel) as newId
      `;

      const updateResult = await session.writeTransaction((tx) => {
        return tx.run(updateTypeQuery, {
          relationshipId: neo4j.int(id)
        });
      });

      // Get the ID of the new relationship
      const newRelationship = updateResult.records[0].get('newRel');
      const newId = updateResult.records[0].get('newId');

      await session.close();

      return NextResponse.json({
        id: newId.toString(),
        type: type,
        message: "Relationship type updated successfully",
        oldId: id
      });
    } catch (error) {
      await session.close();
      console.error("Neo4j error:", error);
      return NextResponse.json(
        { error: `Failed to update relationship: ${error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE route handler
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // First, explicitly check if params are available
  if (!params || !params.id) {
    return NextResponse.json(
      { error: "Relationship ID is required" },
      { status: 400 }
    );
  }

  try {
    // Get relationship ID from params safely
    const id = String(params.id);

    // Get a session from our singleton driver
    const session = getDriver().session();

    try {
      // Delete the relationship
      const result = await session.executeWrite((tx) => {
        const query = `
          MATCH ()-[r]-() 
          WHERE id(r) = $relationshipId
          DELETE r
          RETURN count(r) as deleted
        `;

        const response = tx.run(query, {
          relationshipId: neo4j.int(id),
        });

        return response.then(result => {
          const deleted = result.records[0].get("deleted").toNumber();
          if (deleted === 0) {
            throw new Error("Relationship not found");
          }
          return { deleted };
        });
      });

      await session.close();

      return NextResponse.json({
        id: id,
        message: "Relationship deleted successfully",
      });
    } catch (error) {
      await session.close();
      console.error("Neo4j error:", error);
      return NextResponse.json(
        { error: `Failed to delete relationship: ${error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 