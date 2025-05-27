import { executeQuery } from "./neo4j";
import { fetchAllNodeVisibility, filterVisibleNodes, filterVisibleRelationships } from "./permissions";
import { useAuth } from "@/contexts/auth-context";

/**
 * Fetch graph data with permissions applied based on user role
 */
export async function fetchGraphDataWithPermissions() {
  // First, fetch all node visibility settings
  const visibilitySettings = await fetchAllNodeVisibility();
  
  // Get current user roles
  const { currentUser } = useAuth();
  const userRoles = currentUser?.roles || [];
  
  // Check if user is admin (admins can see all)
  const isAdmin = userRoles.includes('admin');
  
  // Get all nodes and relationships
  const result = await executeQuery(`
    MATCH (n)
    OPTIONAL MATCH (n)-[r]-(m)
    WITH n, r, m
    RETURN 
      collect(distinct n) as nodes,
      collect(distinct {id: id(r), type: type(r), source: id(startNode(r)), target: id(endNode(r)), properties: properties(r)}) as relationships
  `);
  
  if (!result.records || result.records.length === 0) {
    return { nodes: [], relationships: [] };
  }
  
  // Extract nodes and relationships from result
  const record = result.records[0];
  const nodes = record.get('nodes').map((node: any) => ({
    id: node.identity.toString(),
    labels: node.labels,
    properties: node.properties,
  }));
  
  const relationships = record.get('relationships').map((rel: any) => ({
    id: rel.id.toString(),
    type: rel.type,
    source: rel.source.toString(),
    target: rel.target.toString(),
    properties: rel.properties,
  }));
  
  // If user is admin, return all data
  if (isAdmin) {
    return { nodes, relationships };
  }
  
  // Filter nodes based on user role permissions
  const visibleNodes = filterVisibleNodes(nodes, userRoles, visibilitySettings);
  
  // Filter relationships based on node visibility
  const visibleRelationships = filterVisibleRelationships(
    relationships, 
    userRoles, 
    visibilitySettings
  );
  
  return { 
    nodes: visibleNodes, 
    relationships: visibleRelationships 
  };
}

/**
 * Hook to determine if the current user can access admin permissions
 */
export function useCanAccessPermissions() {
  const { currentUser } = useAuth();
  return currentUser?.roles.includes('admin') || false;
}

/**
 * Get simplified node info for permission management UI
 */
export async function fetchNodesForPermissions() {
  // Get all nodes with their basic info
  const result = await executeQuery(`
    MATCH (n)
    RETURN 
      id(n) as id, 
      labels(n) as labels, 
      n.name as name, 
      n.title as title
    ORDER BY 
      CASE WHEN n.name IS NOT NULL THEN n.name 
           WHEN n.title IS NOT NULL THEN n.title 
           ELSE '' END
  `);
  
  if (!result.records) {
    return [];
  }
  
  return result.records.map((record: any) => ({
    id: record.get('id').toString(),
    labels: record.get('labels'),
    name: record.get('name'),
    title: record.get('title'),
  }));
} 