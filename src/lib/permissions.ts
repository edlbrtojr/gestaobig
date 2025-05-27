/**
 * Node visibility permissions service
 * Handles fetching and managing node visibility permissions
 */

// Types for node visibility permissions
export interface NodeVisibility {
  nodeId: number;
  isRestricted: boolean;
  roles: string[];
  labels?: string[];
  name?: string;
  title?: string;
}

export interface NodePermission {
  nodeId: number;
  role: string;
  hasPermission: boolean;
}

export interface BulkPermissionOperation {
  operation: 'grant' | 'revoke' | 'restrict' | 'unrestrict';
  nodeIds: (number | string)[];
  roles: string[];
}

/**
 * Fetch all node visibility settings
 */
export async function fetchAllNodeVisibility(): Promise<NodeVisibility[]> {
  const response = await fetch('/api/permissions/node');
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch node visibility settings');
  }
  
  return result.data;
}

/**
 * Fetch node visibility for a specific node
 */
export async function fetchNodeVisibility(nodeId: number): Promise<NodeVisibility> {
  const response = await fetch(`/api/permissions/node?nodeId=${nodeId}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch node visibility');
  }
  
  return result.data[0];
}

/**
 * Fetch nodes visible to a specific role
 */
export async function fetchNodesVisibleToRole(role: string): Promise<NodeVisibility[]> {
  const response = await fetch(`/api/permissions/node?role=${role}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch nodes visible to role');
  }
  
  return result.data;
}

/**
 * Update node visibility settings
 */
export async function updateNodeVisibility(
  nodeId: number, 
  isRestricted: boolean, 
  roles: string[]
): Promise<void> {
  const response = await fetch('/api/permissions/node', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nodeId,
      isRestricted,
      roles,
    }),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to update node visibility');
  }
}

/**
 * Perform bulk operation on node permissions
 */
export async function bulkUpdatePermissions(
  operation: BulkPermissionOperation
): Promise<number> {
  const response = await fetch('/api/permissions/node', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(operation),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to perform bulk operation');
  }
  
  return result.result;
}

/**
 * Check if a node is visible to the current user based on their role
 */
export function isNodeVisibleToUser(
  nodeId: number,
  userRoles: string[],
  visibilitySettings: NodeVisibility[]
): boolean {
  // Find the visibility setting for this node
  const nodeSetting = visibilitySettings.find(
    setting => setting.nodeId === nodeId
  );
  
  // If no setting found, default to visible
  if (!nodeSetting) {
    return true;
  }
  
  // If node is not restricted, it's visible to everyone
  if (!nodeSetting.isRestricted) {
    return true;
  }
  
  // If node is restricted, check if any user role has permission
  const hasPermission = userRoles.some(role => 
    (nodeSetting.roles || []).includes(role)
  );
  
  return hasPermission;
}

/**
 * Filter visible nodes based on user roles
 */
export function filterVisibleNodes(
  nodes: any[],
  userRoles: string[],
  visibilitySettings: NodeVisibility[]
): any[] {
  if (!visibilitySettings || !visibilitySettings.length) {
    return nodes;
  }
  
  return nodes.filter(node => 
    isNodeVisibleToUser(
      typeof node.id === 'number' ? node.id : parseInt(node.id), 
      userRoles,
      visibilitySettings
    )
  );
}

/**
 * Filter visible relationships based on node visibility
 */
export function filterVisibleRelationships(
  relationships: any[],
  userRoles: string[],
  visibilitySettings: NodeVisibility[]
): any[] {
  if (!visibilitySettings || !visibilitySettings.length) {
    return relationships;
  }
  
  return relationships.filter(rel => {
    const sourceVisible = isNodeVisibleToUser(
      typeof rel.source === 'number' ? rel.source : parseInt(rel.source), 
      userRoles,
      visibilitySettings
    );
    const targetVisible = isNodeVisibleToUser(
      typeof rel.target === 'number' ? rel.target : parseInt(rel.target), 
      userRoles,
      visibilitySettings
    );
    
    // Both source and target must be visible
    return sourceVisible && targetVisible;
  });
} 