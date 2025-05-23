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
      color: "#FF5252"
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
      color: "#4CAF50"
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

// Verificar se um schema é válido
function isValidSchema(schema: any): boolean {
  if (!schema) return false;
  
  try {
    // Verificar se tem a estrutura básica esperada
    if (!schema.nodeTypes || !schema.relationshipTypes) return false;
    
    // Verificar se nodeTypes é um objeto com pelo menos uma chave
    if (typeof schema.nodeTypes !== 'object' || Object.keys(schema.nodeTypes).length === 0) return false;
    
    return true;
  } catch (error) {
    console.error("Erro ao validar schema:", error);
    return false;
  }
}

// Cache storage for schema to avoid repeated API calls
let schemaCache: GraphSchema | null = null;
let schemaCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Load schema from API, localStorage or use default
export async function getGraphSchema(): Promise<GraphSchema> {
  // If we're on the server, return default schema
  if (typeof window === 'undefined') {
    return DEFAULT_SCHEMA;
  }
  
  // Use in-memory cache if available and not expired
  const now = Date.now();
  if (schemaCache && (now - schemaCacheTimestamp < CACHE_TTL)) {
    return schemaCache;
  }
  
  // First, try to load from localStorage for quick loading
  try {
    const storedSchema = localStorage.getItem('graphSchema');
    if (storedSchema) {
      const parsedSchema = JSON.parse(storedSchema);
      if (isValidSchema(parsedSchema)) {
        console.log("Schema loaded from localStorage");
        
        // Update cache
        schemaCache = parsedSchema;
        schemaCacheTimestamp = now;
        
        // Try to update from API in the background to keep data fresh, but don't do it
        // if we've updated recently to avoid excessive API calls
        if (now - schemaCacheTimestamp > 60000) { // Only check once per minute at most
          fetch('/api/schema')
            .then(response => {
              if (response.ok) return response.json();
              throw new Error(`API responded with status ${response.status}`);
            })
            .then(apiSchema => {
              if (isValidSchema(apiSchema)) {
                // Compare schemas to see if there's any change
                const schemaChanged = JSON.stringify(apiSchema) !== JSON.stringify(schemaCache);
                
                if (schemaChanged) {
                  localStorage.setItem('graphSchema', JSON.stringify(apiSchema));
                  console.log("Schema updated in background");
                  // Update cache
                  schemaCache = apiSchema;
                  schemaCacheTimestamp = Date.now();
                  // Notify components
                  window.dispatchEvent(new CustomEvent('schemaUpdated', { detail: apiSchema }));
                }
              }
            })
            .catch(error => {
              console.warn("Could not update schema in background:", error);
            });
        }
        
        return parsedSchema;
      }
    }
  } catch (error) {
    console.warn("Failed to load schema from localStorage:", error);
  }
  
  // If not in localStorage or invalid, try from API
  try {
    // Try to fetch from API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 second timeout
    
    const response = await fetch('/api/schema', {
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    if (response.ok) {
      const apiSchema = await response.json();
      
      // Validate and save in localStorage if valid
      if (isValidSchema(apiSchema)) {
        try {
          localStorage.setItem('graphSchema', JSON.stringify(apiSchema));
        } catch (e) {
          console.error("Failed to update localStorage with API schema:", e);
        }
        
        // Update cache
        schemaCache = apiSchema;
        schemaCacheTimestamp = now;
        
        console.log("Schema loaded from API");
        return apiSchema;
      } else {
        console.error("API returned invalid schema");
      }
    } else {
      console.error("Failed to load schema from API:", response.statusText);
    }
  } catch (error) {
    console.error("Error loading schema from API:", error);
  }
  
  // If we got here, use default schema
  console.log("Using default schema");
  
  // Update cache with default schema
  schemaCache = DEFAULT_SCHEMA;
  schemaCacheTimestamp = now;
  
  return DEFAULT_SCHEMA;
}

// Save schema to both API and localStorage
export async function saveGraphSchema(schema: GraphSchema): Promise<boolean> {
  if (!isValidSchema(schema)) {
    console.error("Tentativa de salvar um schema inválido");
    return false;
  }
  
  try {
    // Primeiro, salvar no localStorage para garantir persistência
    localStorage.setItem('graphSchema', JSON.stringify(schema));
    
    // Então, tentar salvar na API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 segundos de timeout
      
      const response = await fetch('/api/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) {
        console.warn(`API respondeu com erro ao salvar schema: ${response.statusText}`);
      } else {
        console.log("Schema salvo com sucesso na API");
      }
    } catch (apiError) {
      console.error("Erro ao salvar schema na API:", apiError);
      // Nós continuamos porque já salvamos no localStorage
    }
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('schemaUpdated', { detail: schema }));
    
    return true;
  } catch (error) {
    console.error("Falha ao salvar schema:", error);
    return false;
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