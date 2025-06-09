import { executeQuery } from "./neo4j";
import { Record } from "neo4j-driver";

// Função auxiliar para lidar com erros de conexão
const handleConnectionError = (error: any, functionName: string) => {
  console.error(`Erro em ${functionName}:`, error);
  if (error.message?.includes("incorrect authentication") || 
      error.message?.includes("authentication details")) {
    console.warn("Erro de autenticação no Neo4j. Verifique suas credenciais.");
  }
};

/**
 * Busca todas as empresas do banco de dados
 * @returns Array de nomes de empresas
 */
export async function fetchCompanies(): Promise<string[]> {
  try {
    const result = await executeQuery(`
      MATCH (e:Empresa)
      RETURN e.nome as nome, e.sigla as sigla
      ORDER BY e.nome
    `);

    if (!result.records || result.records.length === 0) {
      return ["SISTEMA FIEAC"]; // Valor padrão se não houver registros
    }

    // Adicionar "SISTEMA FIEAC" como opção padrão
    const companies = new Set<string>(["SISTEMA FIEAC"]);
    
    result.records.forEach((record: Record) => {
      const nome = record.get("nome");
      const sigla = record.get("sigla");
      
      if (nome) companies.add(nome.toString().trim());
      if (sigla) companies.add(sigla.toString().trim());
    });

    return Array.from(companies).sort();
  } catch (error) {
    handleConnectionError(error, "fetchCompanies");
    return ["SISTEMA FIEAC"]; // Retorna valor padrão em caso de erro
  }
}

/**
 * Busca todas as unidades do banco de dados
 * @returns Array de nomes de unidades
 */
export async function fetchUnits(): Promise<string[]> {
  try {
    const result = await executeQuery(`
      MATCH (u:Unidade)
      RETURN u.nome as nome, u.sigla as sigla
      ORDER BY u.nome
    `);

    if (!result.records || result.records.length === 0) {
      return ["Todas"]; // Valor padrão se não houver registros
    }

    // Adicionar "Todas" como opção padrão
    const units = new Set<string>(["Todas"]);
    
    result.records.forEach((record: Record) => {
      const nome = record.get("nome");
      const sigla = record.get("sigla");
      
      if (nome) units.add(nome.toString().trim());
      if (sigla) units.add(sigla.toString().trim());
    });

    return Array.from(units).sort();
  } catch (error) {
    handleConnectionError(error, "fetchUnits");
    return ["Todas"]; // Retorna valor padrão em caso de erro
  }
}

/**
 * Busca todos os tipos de nós do banco de dados
 * @returns Array de tipos de nós
 */
export async function fetchNodeTypes(): Promise<string[]> {
  try {
    const result = await executeQuery(`
      MATCH (n)
      WITH labels(n) as nodeLabels
      UNWIND nodeLabels as label
      WITH DISTINCT label
      WHERE NOT label IN ["NodeVisibility", "NodePermission", "User", "UserPermission", "AccessRole", "__inAppSchemaConfig", "AdminResetEvent"]
      AND NOT label STARTS WITH "_"
      RETURN label
      ORDER BY label
    `);

    if (!result.records || result.records.length === 0) {
      return ["Empresa", "Unidade", "Missao", "Visao", "Proposito", "Negocio"]; // Valores padrão
    }

    return result.records.map((record: Record) => record.get("label"));
  } catch (error) {
    handleConnectionError(error, "fetchNodeTypes");
    return ["Empresa", "Unidade", "Missao", "Visao", "Proposito", "Negocio"]; // Valores padrão em caso de erro
  }
}

/**
 * Busca estatísticas de conexões para os nós
 * @returns Objeto com o número mínimo e máximo de conexões
 */
export async function fetchConnectionsRange(): Promise<[number, number]> {
  try {
    const result = await executeQuery(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]-()
      WITH n, count(r) as connections
      RETURN min(connections) as minConnections, max(connections) as maxConnections
    `);

    if (!result.records || result.records.length === 0) {
      return [0, 10]; // Valores padrão se não houver registros
    }

    const record = result.records[0];
    // Converter os valores para números, lidando com diferentes tipos de retorno
    const minConnections = convertToNumber(record.get("minConnections"));
    const maxConnections = convertToNumber(record.get("maxConnections"));

    return [minConnections, maxConnections];
  } catch (error) {
    handleConnectionError(error, "fetchConnectionsRange");
    return [0, 10]; // Retorna valores padrão em caso de erro
  }
}

/**
 * Função auxiliar para converter valores do Neo4j para números
 * @param value Valor a ser convertido
 * @returns Número convertido ou 0 se não for possível converter
 */
function convertToNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // Se o valor já for um número
  if (typeof value === 'number') {
    return value;
  }
  
  // Se o valor for um objeto Neo4j com método toNumber()
  if (typeof value === 'object' && value !== null && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  
  // Tenta converter para número
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Busca dados do grafo (nós e relacionamentos) diretamente do banco de dados
 * Versão simplificada que não depende do contexto de autenticação
 */
export async function fetchGraphData() {
  try {
    const result = await executeQuery(`
      MATCH (n)
      WHERE NOT n:User AND NOT n:UserPermission AND NOT n:AccessRole 
        AND NOT n:NodeVisibility AND NOT n:NodePermission AND NOT n:AdminResetEvent
        AND NONE(label IN labels(n) WHERE label STARTS WITH "_")
      OPTIONAL MATCH (n)-[r]-(m)
      WHERE NOT m:User AND NOT m:UserPermission AND NOT m:AccessRole 
        AND NOT m:NodeVisibility AND NOT m:NodePermission AND NOT m:AdminResetEvent
        AND NONE(label IN labels(m) WHERE label STARTS WITH "_")
      WITH n, r, m
      RETURN 
        collect(distinct {
          id: id(n), 
          labels: labels(n), 
          properties: properties(n)
        }) as nodes,
        collect(distinct {
          id: id(r), 
          type: type(r), 
          source: id(startNode(r)), 
          target: id(endNode(r)), 
          properties: properties(r)
        }) as relationships
    `);
    
    if (!result.records || result.records.length === 0) {
      return { nodes: [], relationships: [] };
    }
    
    // Extract nodes and relationships from result
    const record = result.records[0];
    const nodes = record.get('nodes').map((node: any) => {
      console.log("Node data from Neo4j:", node);
      
      // Garantir que temos um array de labels válido
      const nodeLabels = Array.isArray(node.labels) ? node.labels : 
                        (typeof node.labels === 'string' ? [node.labels] : []);
      
      return {
        id: node.id.toString(),
        label: nodeLabels.length > 0 ? nodeLabels[0] : "Unknown", // Pega o primeiro rótulo como o principal
        labels: nodeLabels, // Adicionar o array completo de labels
        allLabels: nodeLabels, // Adicionar também como allLabels para compatibilidade
        properties: node.properties,
      };
    });
    
    const relationships = record.get('relationships')
      .filter((rel: any) => rel.id !== null) // Filtra relacionamentos inválidos
      .map((rel: any) => ({
        id: rel.id.toString(),
        type: rel.type,
        source: rel.source.toString(),
        target: rel.target.toString(),
        properties: rel.properties,
      }));
    
    console.log("Dados processados:", {
      totalNodes: nodes.length,
      sampleNodes: nodes.slice(0, 2),
      totalRelationships: record.get('relationships').length
    });
    
    return { 
      nodes, 
      relationships 
    };
  } catch (error) {
    handleConnectionError(error, "fetchGraphData");
    return { nodes: [], relationships: [] };
  }
} 