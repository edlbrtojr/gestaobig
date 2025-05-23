import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Types for strategic nodes
export interface StrategicNode {
  id?: string;
  name: string;
  description: string;
  company: string;
  label: "Visao" | "Missao" | "Estrategia";
}

/**
 * GET handler for /api/strategic-nodes endpoint
 * Retrieves all Visao, Missao, and Estrategia nodes
 */
export async function GET() {
  try {
    const result = await db.read(`
      MATCH (n) 
      WHERE n:Visao OR n:Missao OR n:Estrategia
      RETURN {
        id: id(n),
        name: n.name,
        description: n.description,
        company: n.company,
        label: labels(n)[0]
      } as node
      ORDER BY n.createdAt DESC
    `);

    const nodes = result.records.map(record => record.get("node"));
    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("Error fetching strategic nodes:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategic nodes" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/strategic-nodes endpoint
 * Updates an existing strategic node
 */
export async function POST(request: NextRequest) {
  try {
    const { node } = await request.json();

    // Validate the node
    if (!node || !node.id || !node.name || !node.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the node
    const result = await db.write(`
      MATCH (n)
      WHERE id(n) = $id
      SET n.name = $name,
          n.description = $description,
          n.company = $company,
          n.updatedAt = datetime()
      RETURN {
        id: id(n),
        name: n.name,
        description: n.description,
        company: n.company,
        label: labels(n)[0]
      } as node
    `, {
      id: parseInt(node.id),
      name: node.name,
      description: node.description,
      company: node.company
    });

    // Check if the node was found
    if (result.records.length === 0) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    const updatedNode = result.records[0].get("node");
    return NextResponse.json({ node: updatedNode });
  } catch (error) {
    console.error("Error updating strategic node:", error);
    return NextResponse.json(
      { error: "Failed to update strategic node" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for /api/strategic-nodes endpoint
 * Creates a new strategic node
 */
export async function PUT(request: NextRequest) {
  try {
    const { node } = await request.json();

    // Validate the node
    if (!node || !node.name || !node.description || !node.label) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the node
    const result = await db.write(`
      CREATE (n:${node.label} {
        name: $name,
        description: $description,
        company: $company,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      RETURN {
        id: id(n),
        name: n.name,
        description: n.description,
        company: n.company,
        label: $label
      } as node
    `, {
      name: node.name,
      description: node.description,
      company: node.company || "SISTEMA FIEAC",
      label: node.label
    });

    const createdNode = result.records[0].get("node");
    return NextResponse.json({ node: createdNode });
  } catch (error) {
    console.error("Error creating strategic node:", error);
    return NextResponse.json(
      { error: "Failed to create strategic node" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for /api/strategic-nodes endpoint
 * Deletes a strategic node
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing node ID" },
        { status: 400 }
      );
    }

    // Delete all relationships first
    await db.write(`
      MATCH (n)-[r]-()
      WHERE id(n) = $id
      DELETE r
    `, { id: parseInt(id) });

    // Now delete the node
    const result = await db.write(`
      MATCH (n)
      WHERE id(n) = $id
      DELETE n
      RETURN count(n) as deleted
    `, { id: parseInt(id) });

    const deleted = result.records[0].get("deleted").toInt();
    
    if (deleted === 0) {
      return NextResponse.json(
        { error: "Node not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting strategic node:", error);
    return NextResponse.json(
      { error: "Failed to delete strategic node" },
      { status: 500 }
    );
  }
} 