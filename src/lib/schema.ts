// Graph schema interfaces
interface NodeProperty {
  name: string;
  type: string;  // string, number, boolean, date, enum
  required: boolean;
  defaultValue?: string;
  options?: string[];  // For enum type
  description?: string;
}

interface NodeTypeDefinition {
  label: string;
  description: string;
  properties: NodeProperty[];
  color?: string;
  icon?: string;
}

interface RelationshipTypeDefinition {
  type: string;
  description: string;
  sourceNodeTypes: string[];
  targetNodeTypes: string[];
  properties?: NodeProperty[];
  bidirectional?: boolean;
}

export interface GraphSchema {
  nodeTypes: Record<string, NodeTypeDefinition>;
  relationshipTypes: Record<string, RelationshipTypeDefinition>;
}

// Default schema as fallback
const DEFAULT_SCHEMA: GraphSchema = {
  nodeTypes: {
    Risco: {
      label: "Risco",
      description: "Representa um risco potencial para a organização",
      properties: [
        { name: "name", type: "string", required: true },
        { name: "description", type: "string", required: true },
        { name: "impact", type: "enum", required: true, defaultValue: "Médio", options: ["Baixo", "Médio", "Alto"] },
        { name: "area", type: "string", required: false },
        { name: "company", type: "string", required: true }
      ],
      color: "#ff0000"
    },
    PlanoDeAcao: {
      label: "Plano de Ação",
      description: "Define um conjunto de ações para atingir um objetivo",
      properties: [
        { name: "name", type: "string", required: true },
        { name: "status", type: "enum", required: true, defaultValue: "Planejado", options: ["Planejado", "Em andamento", "Concluído", "Atrasado", "Cancelado"] },
        { name: "priority", type: "enum", required: true, defaultValue: "Média", options: ["Baixa", "Média", "Alta"] },
        { name: "responsavel", type: "string", required: false },
        { name: "company", type: "string", required: true }
      ],
      color: "#0088ff"
    }
  },
  relationshipTypes: {
    AFETA: {
      type: "AFETA",
      description: "Indica que um nó afeta outro",
      sourceNodeTypes: ["Risco"],
      targetNodeTypes: ["Projeto", "Objetivo", "Departamento"],
      bidirectional: false
    },
    MITIGADO_POR: {
      type: "MITIGADO_POR",
      description: "Indica que um risco é mitigado por um plano de ação",
      sourceNodeTypes: ["Risco"],
      targetNodeTypes: ["PlanoDeAcao"],
      bidirectional: false
    }
  }
};

// Load schema from API, localStorage or use default
export async function getGraphSchema(): Promise<GraphSchema> {
  if (typeof window === 'undefined') {
    return DEFAULT_SCHEMA;
  }
  
  try {
    // Try to fetch from API first
    const response = await fetch('/api/schema');
    
    if (response.ok) {
      return await response.json();
    } else if (response.status !== 404) {
      console.error("Failed to load schema from API:", response.statusText);
    }
    
    // If not found in API (404), try localStorage as fallback
    const storedSchema = localStorage.getItem('graphSchema');
    if (storedSchema) {
      return JSON.parse(storedSchema);
    }
  } catch (error) {
    console.error("Failed to load schema:", error);
  }
  
  return DEFAULT_SCHEMA;
}

// Save schema to both API and localStorage
export async function saveGraphSchema(schema: GraphSchema): Promise<boolean> {
  try {
    // Save to API
    const response = await fetch('/api/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schema),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save schema: ${response.statusText}`);
    }
    
    // Also save to localStorage as a cache
    localStorage.setItem('graphSchema', JSON.stringify(schema));
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('schemaUpdated', { detail: schema }));
    
    return true;
  } catch (error) {
    console.error("Failed to save schema:", error);
    throw error;
  }
}

// Convert schema to format compatible with add-form
export async function getNodeTypesConfig() {
  const schema = await getGraphSchema();
  const nodeTypesConfig: Record<string, any> = {};
  
  Object.entries(schema.nodeTypes).forEach(([key, nodeType]) => {
    const properties: Record<string, any> = {};
    
    // Convert properties to the format expected by add-form
    nodeType.properties.forEach((prop: NodeProperty) => {
      if (prop.type === 'enum' && prop.defaultValue) {
        properties[prop.name] = prop.defaultValue;
      } else if (prop.type === 'boolean' && prop.defaultValue) {
        properties[prop.name] = prop.defaultValue === 'true';
      } else if (prop.defaultValue) {
        properties[prop.name] = prop.defaultValue;
      } else {
        properties[prop.name] = '';
      }
    });
    
    // Get allowed relationships for this node type
    const allowedRelationships = Object.entries(schema.relationshipTypes)
      .filter(([_, relType]) => (relType as RelationshipTypeDefinition).sourceNodeTypes.includes(key))
      .map(([relKey, _]) => relKey);
    
    nodeTypesConfig[key] = {
      properties,
      allowedRelationships
    };
  });
  
  return nodeTypesConfig;
}

// Get all relationship types
export async function getAllRelationshipTypes() {
  const schema = await getGraphSchema();
  return Object.keys(schema.relationshipTypes);
}

// Get valid relationship types between specific node types
export async function getValidRelationshipTypes(sourceType: string, targetType: string): Promise<string[]> {
  const schema = await getGraphSchema();
  
  if (!sourceType || !targetType) return [];
  
  return Object.entries(schema.relationshipTypes)
    .filter(([_, relType]) => {
      const typedRelType = relType as RelationshipTypeDefinition;
      // Check if this relationship can connect these node types
      return (
        typedRelType.sourceNodeTypes.includes(sourceType) &&
        typedRelType.targetNodeTypes.includes(targetType)
      );
    })
    .map(([relKey, _]) => relKey);
}

// Get common options for property types
export async function getPropertyOptions(propertyName: string, nodeType: string): Promise<string[]> {
  const schema = await getGraphSchema();
  
  if (!nodeType || !schema.nodeTypes[nodeType]) return [];
  
  const property = schema.nodeTypes[nodeType].properties.find(p => p.name === propertyName);
  
  if (property && property.type === 'enum' && property.options) {
    return property.options;
  }
  
  return [];
}

// Get node property definitions
export async function getNodeProperties(nodeType: string): Promise<NodeProperty[]> {
  const schema = await getGraphSchema();
  
  if (!nodeType || !schema.nodeTypes[nodeType]) return [];
  
  return schema.nodeTypes[nodeType].properties;
}

// Get relationship property definitions 
export async function getRelationshipProperties(relType: string): Promise<NodeProperty[]> {
  const schema = await getGraphSchema();
  
  if (!relType || !schema.relationshipTypes[relType]) return [];
  
  return schema.relationshipTypes[relType].properties || [];
} 