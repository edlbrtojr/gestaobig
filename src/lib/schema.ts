// Graph schema interfaces
interface NodeProperty {
  name: string;
  type: string; // string, number, boolean, date, enum
  required: boolean;
  defaultValue?: string;
  options?: string[]; // For enum type
  description?: string;
  isPrimaryLabel?: boolean; // Indica se a propriedade será usada como label principal no grafo
}

interface NodeTypeDefinition {
  label: string;
  description: string;
  properties: NodeProperty[];
  color?: string;
  icon?: string;
  active?: boolean; // Indica se o tipo de nó está ativo ou desativado
}

interface RelationshipTypeDefinition {
  type: string;
  description: string;
  sourceNodeTypes: string[];
  targetNodeTypes: string[];
  properties?: NodeProperty[];
  bidirectional?: boolean;
  active?: boolean; // Indica se o tipo de relacionamento está ativo ou desativado
}

export interface GraphSchema {
  nodeTypes: Record<string, NodeTypeDefinition>;
  relationshipTypes: Record<string, RelationshipTypeDefinition>;
  _meta?: {
    version?: string;
    updatedAt?: string;
    migrationInProgress?: boolean;
  };
}

// Default schema como fallback apenas para erros críticos
const DEFAULT_SCHEMA: GraphSchema = {
  nodeTypes: {},
  relationshipTypes: {}
};

// Propriedades padrão que todos os nós devem ter
export const DEFAULT_NODE_PROPERTIES: NodeProperty[] = [
  { name: "id", type: "string", required: true, description: "Identificador único do nó" },
  { name: "nome", type: "string", required: true, description: "Nome do nó" },
  { name: "descricao", type: "string", required: false, description: "Descrição do nó" },
  { name: "data_criacao", type: "date", required: false, description: "Data de criação do nó" }
];

// Verificar se um schema é válido
function isValidSchema(schema: any): boolean {
  if (!schema) return false;

  try {
    // Verificar se tem a estrutura básica esperada
    if (!schema.nodeTypes || !schema.relationshipTypes) return false;

    // Verificar se nodeTypes é um objeto
    if (typeof schema.nodeTypes !== "object") return false;

    return true;
  } catch (error) {
    console.error("Erro ao validar schema:", error);
    return false;
  }
}

// Obter schema do backend
export async function getGraphSchema(): Promise<GraphSchema> {
  try {
    // Sempre fazer a requisição para o backend para obter o schema mais recente
    const response = await fetch('/api/schema');
    
    if (!response.ok) {
      throw new Error(`Erro ao obter schema: ${response.status} ${response.statusText}`);
    }
    
    const schema = await response.json();
    
    if (!isValidSchema(schema)) {
      throw new Error("Schema inválido recebido da API");
    }
    
    // Garantir que todos os tipos de nós tenham propriedades padrão
    Object.keys(schema.nodeTypes).forEach(nodeKey => {
      // Verificar e garantir que o array de propriedades existe
      if (!schema.nodeTypes[nodeKey].properties) {
        schema.nodeTypes[nodeKey].properties = [...DEFAULT_NODE_PROPERTIES];
      } else if (!Array.isArray(schema.nodeTypes[nodeKey].properties)) {
        // Se properties existe mas não é um array, substituir por array padrão
        schema.nodeTypes[nodeKey].properties = [...DEFAULT_NODE_PROPERTIES];
      } else if (schema.nodeTypes[nodeKey].properties.length === 0) {
        // Se properties é um array vazio, preencher com propriedades padrão
        schema.nodeTypes[nodeKey].properties = [...DEFAULT_NODE_PROPERTIES];
      }
    });
    
    return schema;
  } catch (error) {
    console.error("Erro ao obter schema:", error);
    return DEFAULT_SCHEMA;
  }
}

// Salvar schema no backend
export async function saveGraphSchema(schema: GraphSchema): Promise<void> {
  // Validar schema antes de salvar
  if (!isValidSchema(schema)) {
    throw new Error("Schema inválido");
  }

  // Enviar para a API
  const response = await fetch('/api/schema', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(schema),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao salvar schema: ${response.status} ${response.statusText} - ${errorText}`);
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
      if (prop.type === "enum" && prop.defaultValue) {
        properties[prop.name] = prop.defaultValue;
      } else if (prop.type === "boolean" && prop.defaultValue) {
        properties[prop.name] = prop.defaultValue === "true";
      } else if (prop.defaultValue) {
        properties[prop.name] = prop.defaultValue;
      } else {
        properties[prop.name] = "";
      }
    });

    // Get allowed relationships for this node type
    const allowedRelationships = Object.entries(schema.relationshipTypes)
      .filter(([_, relType]) =>
        (relType as RelationshipTypeDefinition).sourceNodeTypes.includes(key)
      )
      .map(([relKey, _]) => relKey);

    nodeTypesConfig[key] = {
      properties,
      allowedRelationships,
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
export async function getValidRelationshipTypes(
  sourceType: string,
  targetType: string
): Promise<string[]> {
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
export async function getPropertyOptions(
  propertyName: string,
  nodeType: string
): Promise<string[]> {
  const schema = await getGraphSchema();

  if (!nodeType || !schema.nodeTypes[nodeType]) return [];

  const property = schema.nodeTypes[nodeType].properties.find(
    (p) => p.name === propertyName
  );

  if (property && property.type === "enum" && property.options) {
    return property.options;
  }

  return [];
}

// Get node property definitions
export async function getNodeProperties(
  nodeType: string
): Promise<NodeProperty[]> {
  const schema = await getGraphSchema();

  if (!nodeType || !schema.nodeTypes[nodeType]) return [];

  return schema.nodeTypes[nodeType].properties;
}

// Get relationship property definitions
export async function getRelationshipProperties(
  relType: string
): Promise<NodeProperty[]> {
  const schema = await getGraphSchema();

  if (!relType || !schema.relationshipTypes[relType]) return [];

  return schema.relationshipTypes[relType].properties || [];
}

/**
 * Função para migrar o schema do formato antigo para o novo modelo baseado em grafos
 * Esta função é executada em background quando o sistema detecta o formato antigo
 */
export async function migrateSchemaInBackground(schema: GraphSchema): Promise<boolean> {
  if (!isValidSchema(schema)) {
    console.error("Tentativa de migrar um schema inválido");
    return false;
  }

  try {
    console.log("Iniciando migração do schema para o novo modelo baseado em grafos...");
    
    // Função auxiliar para criar um atraso (sleep)
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Iniciar a migração com uma chamada POST para a API
    // O endpoint POST já implementa a lógica de migração
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout para operação de migração
    
    try {
      const response = await fetch("/api/schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Schema-Migration": "true" // Header especial para indicar migração
        },
        body: JSON.stringify(schema),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) {
        console.error(`Falha na migração do schema: ${response.statusText}`);
        return false;
      }
      
      // Aguardar um momento para garantir que a migração foi processada
      await sleep(2000);
      
      // Recarregar o schema para confirmar que a migração funcionou
      const reloadController = new AbortController();
      const reloadTimeoutId = setTimeout(() => reloadController.abort(), 10000);
      
      const reloadResponse = await fetch("/api/schema", {
        signal: reloadController.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).finally(() => clearTimeout(reloadTimeoutId));
      
      if (reloadResponse.ok) {
        const reloadedSchema = await reloadResponse.json();
        
        // Verificar se o schema está no novo formato (tem o campo _meta)
        if (reloadedSchema._meta) {
          console.log(`Migração concluída com sucesso. Schema na versão ${reloadedSchema._meta.version}`);
          
          // Notificar componentes
          window.dispatchEvent(
            new CustomEvent("schemaUpdated", { detail: reloadedSchema })
          );
          
          return true;
        } else {
          console.warn("Migração realizada, mas o schema não está no formato esperado");
        }
      } else {
        console.error("Falha ao recarregar o schema após migração");
      }
    } catch (error) {
      console.error("Erro durante a migração do schema:", error);
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao migrar schema:", error);
    return false;
  }
}

export interface PropertyDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  isPrimaryLabel?: boolean; // Indica se a propriedade será usada como label principal no grafo
}
