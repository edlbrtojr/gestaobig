import { NextRequest, NextResponse } from "next/server";
import { executeRead, executeWrite } from "@/lib/neo4j";
import { QueryResult } from "neo4j-driver";
import { GraphSchema } from "@/lib/schema";

// Interface estendida que inclui campos de metadados
interface ExtendedNodeTypeDefinition {
  label: string;
  description: string;
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    options?: string[];
    isPrimaryLabel?: boolean;
  }>;
  color?: string;
  icon?: string;
  active?: boolean;
}

interface ExtendedRelationshipTypeDefinition {
  type: string;
  description: string;
  sourceNodeTypes: string[];
  targetNodeTypes: string[];
  properties?: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    options?: string[];
    isPrimaryLabel?: boolean;
  }>;
  bidirectional?: boolean;
  active?: boolean;
}

interface ExtendedGraphSchema extends GraphSchema {
  _meta?: {
    version: string;
    updatedAt: string;
  };
  nodeTypes: Record<string, ExtendedNodeTypeDefinition>;
  relationshipTypes: Record<string, ExtendedRelationshipTypeDefinition>;
}

/**
 * GET handler for /api/schema endpoint
 * Retrieves the current graph schema from the database using the graph-based structure
 */
export async function GET() {
  try {
    // Consulta para obter a configuração básica do schema
    const configQuery = `
      MATCH (config:_SchemaConfig {name: "systemSchema"})
      RETURN config
    `;

    const configResult = await executeRead<QueryResult>(configQuery);
    
    if (!configResult || configResult.records.length === 0) {
      console.log("Schema não encontrado na base de dados");
      // Retornar schema vazio se não encontrado
      return NextResponse.json({
        nodeTypes: {},
        relationshipTypes: {},
      });
    }
    
    const config = configResult.records[0].get('config').properties;
    
    // Consulta para obter tipos de nós e suas propriedades
    const nodeTypesQuery = `
      MATCH (config:_SchemaConfig {name: "systemSchema"})
      MATCH (config)-[:DEFINES_NODE_LABEL]->(nodeType:_NodeLabelSchema)
      OPTIONAL MATCH (nodeType)-[:HAS_PROPERTY]->(nodeProp:_SchemaProperty)
      RETURN nodeType, collect(nodeProp) as properties
    `;
    
    const nodeTypesResult = await executeRead<QueryResult>(nodeTypesQuery);
    
    // Consulta para obter tipos de relacionamentos e suas propriedades
    const relTypesQuery = `
      MATCH (config:_SchemaConfig {name: "systemSchema"})
      MATCH (config)-[:DEFINES_RELATIONSHIP_TYPE]->(relType:_RelationshipTypeSchema)
      OPTIONAL MATCH (relType)-[:HAS_PROPERTY]->(relProp:_SchemaProperty)
      RETURN relType, collect(relProp) as properties
    `;
    
    const relTypesResult = await executeRead<QueryResult>(relTypesQuery);
    
    // Consulta para obter as conexões de tipos de relacionamentos
    const relConnectionsQuery = `
      MATCH (config:_SchemaConfig {name: "systemSchema"})
      MATCH (config)-[:DEFINES_RELATIONSHIP_TYPE]->(relType:_RelationshipTypeSchema)
      OPTIONAL MATCH (relType)-[:FROM_NODE_TYPE]->(fromType:_NodeLabelSchema)
      OPTIONAL MATCH (relType)-[:TO_NODE_TYPE]->(toType:_NodeLabelSchema)
      RETURN relType.name as relTypeName, fromType.name as fromType, toType.name as toType
    `;
    
    const relConnectionsResult = await executeRead<QueryResult>(relConnectionsQuery);

    // Construir o objeto GraphSchema a partir dos dados do grafo
    const schema: ExtendedGraphSchema = {
      nodeTypes: {},
      relationshipTypes: {},
      _meta: {
        version: config.version,
        updatedAt: config.updatedAt
      }
    };
    
    // Processar tipos de nós
    if (nodeTypesResult && nodeTypesResult.records.length > 0) {
      for (const record of nodeTypesResult.records) {
        const nodeType = record.get('nodeType').properties;
        const nodeProps = record.get('properties') || [];
        
        // Filtrar null/undefined que podem vir de COLLECT
        const filteredProps = nodeProps.filter((p: any) => p !== null);
        
        schema.nodeTypes[nodeType.name] = {
          label: nodeType.name,
          description: nodeType.description || '',
          properties: filteredProps.map((p: any) => ({
            name: p.properties.name,
            type: p.properties.type,
            required: p.properties.required || false,
            defaultValue: p.properties.defaultValue,
            options: p.properties.options,
            isPrimaryLabel: p.properties.isPrimaryLabel || false
          })),
          color: nodeType.color || "#CCCCCC",
          active: nodeType.active !== false // Por padrão, os nós são ativos a menos que explicitamente marcados como inativos
        };
      }
    }
    
    // Processar tipos de relacionamentos
    if (relTypesResult && relTypesResult.records.length > 0) {
      // Primeiro, criar os tipos de relacionamentos com suas propriedades
      for (const record of relTypesResult.records) {
        const relType = record.get('relType').properties;
        const relProps = record.get('properties') || [];
        
        // Filtrar null/undefined
        const filteredProps = relProps.filter((p: any) => p !== null);
        
        schema.relationshipTypes[relType.name] = {
          type: relType.name,
          description: relType.description || '',
          sourceNodeTypes: [], // Será preenchido abaixo
          targetNodeTypes: [], // Será preenchido abaixo
          properties: filteredProps.map((p: any) => ({
            name: p.properties.name,
            type: p.properties.type,
            required: p.properties.required || false,
            defaultValue: p.properties.defaultValue,
            options: p.properties.options,
            isPrimaryLabel: p.properties.isPrimaryLabel || false
          })),
          bidirectional: relType.bidirectional || false,
          active: relType.active !== false // Por padrão, os relacionamentos são ativos a menos que explicitamente marcados como inativos
        };
      }
      
      // Depois, preencher as conexões entre tipos de nós
      if (relConnectionsResult && relConnectionsResult.records.length > 0) {
        for (const record of relConnectionsResult.records) {
          const relTypeName = record.get('relTypeName');
          const fromType = record.get('fromType');
          const toType = record.get('toType');
          
          // Pular se o tipo de relacionamento não existe ou se fromType ou toType é null
          if (!relTypeName || !schema.relationshipTypes[relTypeName] || !fromType || !toType) continue;
          
          // Adicionar à lista de tipos de nós de origem se ainda não estiver lá
          if (!schema.relationshipTypes[relTypeName].sourceNodeTypes.includes(fromType)) {
            schema.relationshipTypes[relTypeName].sourceNodeTypes.push(fromType);
          }
          
          // Adicionar à lista de tipos de nós de destino se ainda não estiver lá
          if (!schema.relationshipTypes[relTypeName].targetNodeTypes.includes(toType)) {
            schema.relationshipTypes[relTypeName].targetNodeTypes.push(toType);
          }
        }
      }
    }

    return NextResponse.json(schema);
  } catch (error) {
    console.error("Erro ao buscar schema:", error);
    return NextResponse.json(
      {
        nodeTypes: {},
        relationshipTypes: {},
        status: "error",
        message: "Falha ao obter schema",
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/schema endpoint
 * Updates the graph schema in the database using the graph-based structure
 */
export async function POST(request: NextRequest) {
  try {
    const schema: GraphSchema = await request.json();

    // Validate the schema
    if (!schema || !schema.nodeTypes || !schema.relationshipTypes) {
      return NextResponse.json(
        { error: "Formato de esquema inválido" },
        { status: 400 }
      );
    }

    // Implementar a atualização do schema usando o modelo baseado em grafos
    // Devido às limitações de memória, dividiremos em várias transações

    // 1. Remover o schema existente preservando o nó de configuração
    const cleanQuery = `
      MATCH (config:_SchemaConfig {name: "systemSchema"})
      
      OPTIONAL MATCH (config)-[:DEFINES_NODE_LABEL]->(nodeType:_NodeLabelSchema)
      OPTIONAL MATCH (nodeType)-[r1:HAS_PROPERTY]->(nodeProp:_SchemaProperty)
      DELETE r1
      
      WITH config, nodeType, nodeProp
      DETACH DELETE nodeProp
      
      WITH config, nodeType
      OPTIONAL MATCH (config)-[r2:DEFINES_NODE_LABEL]->(nodeType)
      DELETE r2
      
      WITH config, nodeType
      DETACH DELETE nodeType
      
      WITH config
      OPTIONAL MATCH (config)-[:DEFINES_RELATIONSHIP_TYPE]->(relType:_RelationshipTypeSchema)
      OPTIONAL MATCH (relType)-[r3:HAS_PROPERTY]->(relProp:_SchemaProperty)
      DELETE r3
      
      WITH config, relType, relProp
      DETACH DELETE relProp
      
      WITH config, relType
      OPTIONAL MATCH (relType)-[r4:FROM_NODE_TYPE|TO_NODE_TYPE]->()
      DELETE r4
      
      WITH config, relType
      OPTIONAL MATCH (config)-[r5:DEFINES_RELATIONSHIP_TYPE]->(relType)
      DELETE r5
      
      WITH config, relType
      DETACH DELETE relType
      
      SET config.updatedAt = datetime()
      RETURN config
    `;

    await executeWrite(cleanQuery);

    // 2. Garantir que o nó de configuração existe
    const configQuery = `
      MERGE (config:_SchemaConfig {name: "systemSchema"})
      ON CREATE SET config.createdAt = datetime(),
                  config.version = "1.0.0",
                  config.description = "Schema do sistema"
      SET config.updatedAt = datetime()
      RETURN config
    `;

    await executeWrite(configQuery);

    // 3. Criar tipos de nós - Usando MERGE para evitar duplicatas
    for (const [nodeKey, nodeType] of Object.entries(schema.nodeTypes)) {
      const createNodeTypeQuery = `
        MATCH (config:_SchemaConfig {name: "systemSchema"})
        MERGE (nodeType:_NodeLabelSchema {name: $nodeKey})
        ON CREATE SET nodeType.createdAt = datetime()
        SET nodeType.description = $description,
            nodeType.color = $color,
            nodeType.active = $active,
            nodeType.updatedAt = datetime()
        MERGE (config)-[:DEFINES_NODE_LABEL]->(nodeType)
        RETURN nodeType
      `;

      await executeWrite(createNodeTypeQuery, {
        nodeKey,
        description: nodeType.description,
        color: nodeType.color || "#CCCCCC",
        active: nodeType.active !== false // Por padrão, os nós são ativos
      });

      // 3.1 Criar propriedades para o tipo de nó
      if (nodeType.properties && nodeType.properties.length > 0) {
        for (const prop of nodeType.properties) {
          const createPropertyQuery = `
            MATCH (nodeType:_NodeLabelSchema {name: $nodeKey})
            MERGE (prop:_SchemaProperty {name: $name, nodeType: $nodeKey})
            ON CREATE SET prop.createdAt = datetime()
            SET prop.type = $type,
                prop.required = $required,
                prop.defaultValue = $defaultValue,
                prop.options = $options,
                prop.isPrimaryLabel = $isPrimaryLabel,
                prop.updatedAt = datetime()
            MERGE (nodeType)-[:HAS_PROPERTY]->(prop)
            RETURN prop
          `;

          await executeWrite(createPropertyQuery, {
            nodeKey,
            name: prop.name,
            type: prop.type,
            required: prop.required,
            defaultValue: prop.defaultValue || null,
            options: prop.type === 'enum' ? (prop.options || ['Valor Padrão']) : null,
            isPrimaryLabel: prop.isPrimaryLabel || false
          });
        }
      }
    }

    // 4. Criar tipos de relacionamentos - Usando MERGE para evitar duplicatas
    for (const [relKey, relType] of Object.entries(schema.relationshipTypes)) {
      const createRelTypeQuery = `
        MATCH (config:_SchemaConfig {name: "systemSchema"})
        MERGE (relType:_RelationshipTypeSchema {name: $relKey})
        ON CREATE SET relType.createdAt = datetime()
        SET relType.description = $description,
            relType.bidirectional = $bidirectional,
            relType.active = $active,
            relType.updatedAt = datetime()
        MERGE (config)-[:DEFINES_RELATIONSHIP_TYPE]->(relType)
        RETURN relType
      `;

      await executeWrite(createRelTypeQuery, {
        relKey,
        description: relType.description,
        bidirectional: relType.bidirectional || false,
        active: relType.active !== false // Por padrão, os relacionamentos são ativos
      });

      // 4.1 Conectar aos tipos de nós de origem
      for (const sourceType of relType.sourceNodeTypes) {
        const connectSourceQuery = `
          MATCH (relType:_RelationshipTypeSchema {name: $relKey})
          MATCH (source:_NodeLabelSchema {name: $sourceType})
          MERGE (relType)-[:FROM_NODE_TYPE]->(source)
        `;

        await executeWrite(connectSourceQuery, {
          relKey,
          sourceType
        });
      }

      // 4.2 Conectar aos tipos de nós de destino
      for (const targetType of relType.targetNodeTypes) {
        const connectTargetQuery = `
          MATCH (relType:_RelationshipTypeSchema {name: $relKey})
          MATCH (target:_NodeLabelSchema {name: $targetType})
          MERGE (relType)-[:TO_NODE_TYPE]->(target)
        `;

        await executeWrite(connectTargetQuery, {
          relKey,
          targetType
        });
      }

      // 4.3 Criar propriedades para o tipo de relacionamento
      if (relType.properties && relType.properties.length > 0) {
        for (const prop of relType.properties) {
          const createRelPropertyQuery = `
            MATCH (relType:_RelationshipTypeSchema {name: $relKey})
            MERGE (prop:_SchemaProperty {name: $name, relType: $relKey})
            ON CREATE SET prop.createdAt = datetime()
            SET prop.type = $type,
                prop.required = $required,
                prop.defaultValue = $defaultValue,
                prop.options = $options,
                prop.isPrimaryLabel = $isPrimaryLabel,
                prop.updatedAt = datetime()
            MERGE (relType)-[:HAS_PROPERTY]->(prop)
            RETURN prop
          `;

          await executeWrite(createRelPropertyQuery, {
            relKey,
            name: prop.name,
            type: prop.type,
            required: prop.required,
            defaultValue: prop.defaultValue || null,
            options: prop.type === 'enum' ? (prop.options || ['Valor Padrão']) : null,
            isPrimaryLabel: prop.isPrimaryLabel || false
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving schema:", error);
    return NextResponse.json(
      { error: "Falha ao salvar esquema" },
      { status: 500 }
    );
  }
}
