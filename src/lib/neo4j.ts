import neo4j, { Driver, Session, Transaction } from "neo4j-driver";

let driver: Driver | null = null;
let connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
let lastPasswordAttempt: string | null = null;

// Create a singleton Neo4j driver instance that can be reused
export async function getDriver(): Promise<Driver | null> {
  // Get connection data from environment variables
  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USERNAME || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "3d1Jun1or";
  
  // Se temos um driver e a senha não mudou, retornamos
  if (driver && lastPasswordAttempt === password) {
    return driver;
  }

  // If we already tried and got an error, don't retry immediately with the same password
  if (connectionStatus === 'disconnected' && lastPasswordAttempt === password) {
    console.warn("Neo4j connection previously failed");
    return null;
  }

  // Make sure we only instantiate the driver once
  try {
    connectionStatus = 'connecting';
    // Fechar driver anterior se existir
    if (driver) {
      await driver.close();
      driver = null;
    }

    console.log("Conectando ao Neo4j com:", { uri, user });

    const connectionTimeout = parseInt(process.env.NEXT_PUBLIC_CONNECTION_TIMEOUT || '5000', 10);
    
    // Instantiate the driver
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: Math.max(connectionTimeout * 2, 10000), // pelo menos o dobro do connectionTimeout
      disableLosslessIntegers: true, // converts Int to JS Number
      connectionTimeout: connectionTimeout
    });

    // Verifica se a conexão está funcionando
    await driver.verifyConnectivity();
    connectionStatus = 'connected';
    lastPasswordAttempt = password;
    console.log('Neo4j connection established successfully');
    return driver;
  } catch (error) {
    console.error("Falha ao criar driver Neo4j:", error);
    connectionStatus = 'disconnected';
    lastPasswordAttempt = password;
    driver = null;
    return null;
  }
}

// Helper function to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const driver = await getDriver();
    if (!driver) return false;
    
    const session = driver.session();
    try {
      await session.run("RETURN 1 AS available");
      return true;
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Falha na verificação de conectividade do banco de dados:", error);
    return false;
  }
}

// Reset connection error and retry
export function resetConnectionError() {
  connectionStatus = 'disconnected';
  lastPasswordAttempt = null;
  if (driver) {
    driver.close().catch(e => console.error("Erro ao fechar conexão Neo4j:", e));
    driver = null;
  }
}

// Helper function to execute a read query
export async function executeRead<T>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T | null> {
  const driver = await getDriver();
  if (!driver) return null;

  const session = driver.session();

  try {
    const result = await session.run(cypher, params);
    return result as unknown as T;
  } catch (error) {
    console.error("Erro ao executar consulta de leitura:", error);
    return null;
  } finally {
    await session.close();
  }
}

// Helper function to execute a write query
export async function executeWrite<T>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T | null> {
  const driver = await getDriver();
  if (!driver) return null;

  const session = driver.session();

  try {
    const result = await session.writeTransaction(async (tx: Transaction) => {
      return await tx.run(cypher, params);
    });
    return result as unknown as T;
  } catch (error) {
    console.error("Erro ao executar consulta de escrita:", error);
    return null;
  } finally {
    await session.close();
  }
}

/**
 * Obtém uma sessão do Neo4j
 */
export async function getSession(): Promise<Session | null> {
  const driver = await getDriver();
  if (!driver) return null;
  return driver.session();
}

/**
 * Executa uma consulta Cypher no Neo4j
 * @param cypher - Consulta Cypher a ser executada
 * @param params - Parâmetros para a consulta
 * @returns Resultado da consulta
 */
export async function executeQuery(cypher: string, params: Record<string, any> = {}): Promise<any> {
  const session = await getSession();
  if (!session) return { records: [] };
  
  try {
    return await session.run(cypher, params);
  } catch (error) {
    console.error("Erro ao executar consulta:", error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Fecha o driver Neo4j
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    connectionStatus = 'disconnected';
  }
}

// Retorna o status atual da conexão
export function getConnectionStatus() {
  return connectionStatus;
}
