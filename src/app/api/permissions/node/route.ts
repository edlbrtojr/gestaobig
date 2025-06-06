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
          CASE WHEN n IS NULL THEN [] ELSE labels(n) END AS labels,
          CASE WHEN n IS NULL THEN 'Node #' + v.nodeId ELSE n.name END AS name,
          CASE WHEN n IS NULL THEN null ELSE n.title END AS title,
          CASE WHEN n IS NULL THEN {} ELSE properties(n) END AS properties,
          roles
      `;
    }
    
    const result = await executeQuery(cypher, params);
    
    // Debug info to track results
    console.log(`API response: ${result.records.length} records found`);
    
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
    
    console.log('Bulk operation request:', JSON.stringify(body, null, 2));
    
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
    
    // Ensure nodeIds are integers
    const nodeIdsInt = nodeIds.map(id => parseInt(id.toString()));
    
    console.log(`Bulk operation: ${operation} on nodes: [`, nodeIdsInt, `] with roles:`, roles);
    
    // Define a type for our result to fix type errors
    interface QueryResult {
      records: Array<{
        get: (key: string) => any;
      }>;
    }
    
    let result: QueryResult = { records: [{ get: () => 0 }] };
    
    switch (operation) {
      case 'grant':
        // Grant permissions for specific roles to see specific nodes
        try {
          const grantResult = await executeWrite<QueryResult>(`
            UNWIND $nodeIds AS nodeId
            UNWIND $roles AS role
            MERGE (p:NodePermission {nodeId: nodeId, role: role})
            SET p.createdAt = CASE WHEN p.createdAt IS NULL THEN datetime() ELSE p.createdAt END,
                p.updatedAt = datetime()
            RETURN COUNT(p) as permissionsCreated
          `, { nodeIds: nodeIdsInt, roles });
          
          if (grantResult && grantResult.records) {
            result = grantResult;
          } else {
            throw new Error('Failed to execute grant operation');
          }
          
          console.log('Grant operation successful:', result);
        } catch (error) {
          console.error('Error in grant operation:', error);
          throw error;
        }
        break;
        
      case 'revoke':
        // Revoke permissions for specific roles to see specific nodes
        console.log(`Executing revoke operation...`);
        try {
          // First check if permissions exist
          const checkResult = await executeQuery(`
            UNWIND $nodeIds AS nodeId
            UNWIND $roles AS role
            MATCH (p:NodePermission {nodeId: nodeId, role: role})
            RETURN COUNT(p) as existingPermissions
          `, { nodeIds: nodeIdsInt, roles });
          
          if (!checkResult || !checkResult.records || checkResult.records.length === 0) {
            // No permissions exist or query failed
            console.log('No permissions found or query failed');
            break;
          }
          
          const existingPermissions = checkResult.records[0].get('existingPermissions');
          const permissionsCount = typeof existingPermissions === 'object' && existingPermissions !== null && 'low' in existingPermissions
            ? existingPermissions.low
            : Number(existingPermissions) || 0;
            
          console.log(`Found ${permissionsCount} existing permissions to revoke`);
          
          // Only proceed with deletion if permissions exist
          if (permissionsCount > 0) {
            const revokeResult = await executeWrite<QueryResult>(`
              UNWIND $nodeIds AS nodeId
              UNWIND $roles AS role
              MATCH (p:NodePermission {nodeId: nodeId, role: role})
              DELETE p
              RETURN COUNT(p) as permissionsDeleted
            `, { nodeIds: nodeIdsInt, roles });
            
            if (revokeResult && revokeResult.records) {
              result = revokeResult;
              console.log('revoke operation completed:', result);
              
              const permissionsDeleted = result.records[0].get('permissionsDeleted');
              const deletedCount = typeof permissionsDeleted === 'object' && permissionsDeleted !== null && 'low' in permissionsDeleted
                ? permissionsDeleted.low
                : Number(permissionsDeleted) || 0;
                
              console.log(`revoke operation result count: ${deletedCount}`);
            } else {
              console.log('No permissions deleted or query failed');
            }
          } else {
            // No permissions found to delete
            console.log('No permissions found to revoke for the specified nodes and roles');
          }
        } catch (error) {
          console.error('Error in revoke operation:', error);
          throw error;
        }
        break;
        
      case 'restrict':
        // Make nodes restricted (visible only to specific roles)
        try {
          const restrictResult = await executeWrite<QueryResult>(`
            UNWIND $nodeIds AS nodeId
            MERGE (v:NodeVisibility {nodeId: nodeId})
            SET v.isRestricted = true,
                v.updatedAt = datetime()
            RETURN COUNT(v) as nodesRestricted
          `, { nodeIds: nodeIdsInt });
          
          if (restrictResult && restrictResult.records) {
            result = restrictResult;
          } else {
            throw new Error('Failed to execute restrict operation');
          }
          
          console.log('Restrict operation successful:', result);
        } catch (error) {
          console.error('Error in restrict operation:', error);
          throw error;
        }
        break;
        
      case 'unrestrict':
        // Make nodes public (visible to all roles)
        try {
          const unrestrictResult = await executeWrite<QueryResult>(`
            UNWIND $nodeIds AS nodeId
            MERGE (v:NodeVisibility {nodeId: nodeId})
            SET v.isRestricted = false,
                v.updatedAt = datetime()
            RETURN COUNT(v) as nodesUnrestricted
          `, { nodeIds: nodeIdsInt });
          
          if (unrestrictResult && unrestrictResult.records) {
            result = unrestrictResult;
          } else {
            throw new Error('Failed to execute unrestrict operation');
          }
          
          console.log('Unrestrict operation successful:', result);
        } catch (error) {
          console.error('Error in unrestrict operation:', error);
          throw error;
        }
        break;
        
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid operation' 
        }, { status: 400 });
    }
    
    // Get the appropriate property name based on operation
    const countPropertyName = 
      operation === 'grant' ? 'permissionsCreated' :
      operation === 'revoke' ? 'permissionsDeleted' :
      operation === 'restrict' ? 'nodesRestricted' : 'nodesUnrestricted';
    
    const affectedCount = result.records[0].get(countPropertyName);
    
    // Handle Neo4j integer objects and convert to regular number
    const count = typeof affectedCount === 'object' && affectedCount !== null && 'low' in affectedCount 
      ? affectedCount.low 
      : Number(affectedCount) || 0;
    
    return NextResponse.json({ 
      success: true, 
      count: count
    });
  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 