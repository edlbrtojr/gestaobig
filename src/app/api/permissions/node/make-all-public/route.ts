import { NextResponse } from "next/server";
import { executeQuery, executeWrite } from "@/lib/neo4j";
import { Record as Neo4jRecord } from "neo4j-driver";

interface NodeData {
  nodeId: number;
  labels?: string[];
  name?: string;
  title?: string;
}

interface QueryResult {
  records: Neo4jRecord[];
}

// POST endpoint to make all nodes without visibility settings public by default
export async function POST(request: Request) {
  try {
    console.log("Starting make-all-public operation");
    
    // First, find all nodes that don't have visibility settings
    const findNodesCypher = `
      MATCH (n)
      WHERE NOT EXISTS {
        MATCH (v:NodeVisibility)
        WHERE v.nodeId = id(n)
      }
      RETURN id(n) AS nodeId, labels(n) AS labels, n.name AS name, n.title AS title
    `;
    
    console.log("Executing query to find nodes without visibility settings");
    const nodesResult = await executeQuery(findNodesCypher);
    const nodes: NodeData[] = nodesResult.records.map((record: Neo4jRecord) => ({
      nodeId: record.get('nodeId'),
      labels: record.get('labels'),
      name: record.get('name'),
      title: record.get('title')
    }));
    
    console.log(`Found ${nodes.length} nodes without visibility settings`);
    
    if (nodes.length === 0) {
      console.log("No nodes found to update");
      return NextResponse.json({ 
        success: true, 
        message: 'No nodes without visibility settings found',
        count: 0
      });
    }
    
    console.log("Node IDs to update:", nodes.map(n => n.nodeId));
    
    // Create visibility settings for these nodes (public/unrestricted by default)
    const createVisibilityCypher = `
      UNWIND $nodes AS node
      MERGE (v:NodeVisibility {nodeId: node.nodeId})
      SET v.isRestricted = false,
          v.createdAt = CASE WHEN v.createdAt IS NULL THEN datetime() ELSE v.createdAt END,
          v.updatedAt = datetime()
      RETURN COUNT(v) as count
    `;
    
    console.log("Executing query to create public visibility settings");
    const result = await executeWrite<QueryResult>(createVisibilityCypher, { 
      nodes: nodes.map((n: NodeData) => ({ nodeId: n.nodeId }))
    });
    
    const count = result?.records?.[0]?.get('count') || 0;
    console.log(`Created ${count} public visibility settings`);
    
    return NextResponse.json({ 
      success: true,
      message: `Made ${count} nodes public by default`,
      count
    });
  } catch (error) {
    console.error('Error making nodes public:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to make nodes public' 
    }, { status: 500 });
  }
} 