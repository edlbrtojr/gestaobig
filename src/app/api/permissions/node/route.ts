import { NextResponse } from "next/server";
import { executeQuery, executeWrite } from "@/lib/neo4j";
import { Record as Neo4jRecord } from "neo4j-driver";

// GET endpoint to get node visibility settings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const role = searchParams.get('role');
    
    // Different queries based on parameters
    let cypher: string; 
    let params: { [key: string]: any } = {};
    
    if (nodeId && role) {
      // Get permission for a specific node and role
      cypher = `
        MATCH (v:NodeVisibility {nodeId: $nodeId})
        OPTIONAL MATCH (p:NodePermission {nodeId: $nodeId, role: $role})
        RETURN 
          v.isRestricted AS isRestricted, 
          p IS NOT NULL AS hasPermission,
          p.nodeId AS nodeId,
          p.role AS role
      `;
      params = { nodeId: parseInt(nodeId), role };
    } else if (nodeId) {
      // Get all role permissions for a specific node
      cypher = `
        MATCH (v:NodeVisibility {nodeId: $nodeId})
        OPTIONAL MATCH (p:NodePermission {nodeId: $nodeId})
        RETURN 
          v.isRestricted AS isRestricted, 
          COLLECT({role: p.role, hasPermission: true}) AS rolePermissions,
          $nodeId AS nodeId
      `;
      params = { nodeId: parseInt(nodeId) };
    } else if (role) {
      // Get all nodes visible to a specific role
      cypher = `
        MATCH (p:NodePermission {role: $role})
        MATCH (v:NodeVisibility {nodeId: p.nodeId})
        WITH v, p
        MATCH (n) WHERE id(n) = v.nodeId
        RETURN id(n) AS nodeId, labels(n) AS labels, n.name AS name, n.title AS title
      `;
      params = { role };
    } else {
      // Get all node visibility settings
      cypher = `
        MATCH (v:NodeVisibility)
        OPTIONAL MATCH (n) WHERE id(n) = v.nodeId
        OPTIONAL MATCH (p:NodePermission {nodeId: v.nodeId})
        WITH v, n, COLLECT(DISTINCT p.role) AS roles
        RETURN 
          v.nodeId AS nodeId, 
          v.isRestricted AS isRestricted,
          labels(n) AS labels,
          n.name AS name,
          n.title AS title,
          roles
      `;
    }
    
    const result = await executeQuery(cypher, params);
    
    return NextResponse.json({ 
      success: true,
      data: result.records.map((record: Neo4jRecord) => {
        // Create a data object from the record
        const data: { [key: string]: any } = {};
        for (const key of record.keys) {
          if (typeof key === 'string') {
            data[key] = record.get(key);
          }
        }
        return data;
      })
    });
  } catch (error) {
    console.error('Error fetching node permissions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch node permissions' 
    }, { status: 500 });
  }
}

// POST endpoint to update node visibility settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nodeId, isRestricted, roles } = body;
    
    if (!nodeId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Node ID is required' 
      }, { status: 400 });
    }

    // Update the node visibility setting
    let result;
    if (isRestricted !== undefined) {
      result = await executeWrite(`
        MERGE (v:NodeVisibility {nodeId: $nodeId})
        SET v.isRestricted = $isRestricted,
            v.updatedAt = datetime()
        RETURN v
      `, { nodeId: parseInt(nodeId), isRestricted });
    }
    
    // If roles are specified, update role permissions
    if (roles && Array.isArray(roles)) {
      // First delete all existing permissions for this node
      await executeWrite(`
        MATCH (p:NodePermission {nodeId: $nodeId})
        DELETE p
      `, { nodeId: parseInt(nodeId) });
      
      // Then create new permissions for each role
      if (roles.length > 0) {
        await executeWrite(`
          UNWIND $roles AS role
          MERGE (p:NodePermission {nodeId: $nodeId, role: role})
          SET p.createdAt = datetime(),
              p.updatedAt = datetime()
          RETURN COUNT(p) as created
        `, { nodeId: parseInt(nodeId), roles });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Node visibility settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating node permissions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update node permissions' 
    }, { status: 500 });
  }
}

// PUT endpoint for bulk operations
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { operation, nodeIds, roles } = body;
    
    if (!operation || !Array.isArray(nodeIds) || !Array.isArray(roles)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Operation, nodeIds array, and roles array are required' 
      }, { status: 400 });
    }
    
    if (!['grant', 'revoke', 'restrict', 'unrestrict'].includes(operation)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid operation. Must be one of: grant, revoke, restrict, unrestrict' 
      }, { status: 400 });
    }
    
    const nodeIdsInt = nodeIds.map(id => parseInt(id.toString()));
    
    let result: any = null;
    switch (operation) {
      case 'grant':
        // Grant permissions for specific roles to see specific nodes
        result = await executeWrite(`
          UNWIND $nodeIds AS nodeId
          UNWIND $roles AS role
          MERGE (p:NodePermission {nodeId: nodeId, role: role})
          SET p.createdAt = CASE WHEN p.createdAt IS NULL THEN datetime() ELSE p.createdAt END,
              p.updatedAt = datetime()
          RETURN COUNT(p) as permissionsCreated
        `, { nodeIds: nodeIdsInt, roles });
        break;
        
      case 'revoke':
        // Revoke permissions for specific roles to see specific nodes
        result = await executeWrite(`
          UNWIND $nodeIds AS nodeId
          UNWIND $roles AS role
          MATCH (p:NodePermission {nodeId: nodeId, role: role})
          DELETE p
          RETURN COUNT(p) as permissionsDeleted
        `, { nodeIds: nodeIdsInt, roles });
        break;
        
      case 'restrict':
        // Set nodes to restricted visibility
        result = await executeWrite(`
          UNWIND $nodeIds AS nodeId
          MERGE (v:NodeVisibility {nodeId: nodeId})
          SET v.isRestricted = true,
              v.updatedAt = datetime()
          RETURN COUNT(v) as nodesUpdated
        `, { nodeIds: nodeIdsInt });
        break;
        
      case 'unrestrict':
        // Set nodes to public visibility
        result = await executeWrite(`
          UNWIND $nodeIds AS nodeId
          MERGE (v:NodeVisibility {nodeId: nodeId})
          SET v.isRestricted = false,
              v.updatedAt = datetime()
          RETURN COUNT(v) as nodesUpdated
        `, { nodeIds: nodeIdsInt });
        break;
    }
    
    const count = result?.records?.[0]?.get('nodesUpdated') || 
                 result?.records?.[0]?.get('permissionsCreated') || 
                 result?.records?.[0]?.get('permissionsDeleted') || 0;
    
    return NextResponse.json({ 
      success: true,
      message: `Bulk operation '${operation}' completed successfully`,
      result: count
    });
  } catch (error) {
    console.error('Error performing bulk operation on node permissions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to perform bulk operation on node permissions' 
    }, { status: 500 });
  }
} 