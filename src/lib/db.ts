import neo4j, { Driver } from 'neo4j-driver';
import { getDriver as getMainDriver, resetConnectionError } from './neo4j';

// Configure Neo4j driver - usando o mesmo driver do neo4j.ts
let driver: Driver;
let connectionError: Error | null = null;

/**
 * Initialize Neo4j driver if not already initialized
 */
async function initDriver() {
  try {
    // Primeiro, tenta usar o driver compartilhado
    const sharedDriver = await getMainDriver();
    if (sharedDriver) {
      driver = sharedDriver;
      connectionError = null;
      return true;
    }

    // Se ainda não houver driver, retorna false
    return false;
  } catch (error) {
    console.error('Failed to initialize Neo4j driver:', error);
    connectionError = error as Error;
    return false;
  }
}

/**
 * Reset connection error to allow retry
 */
export function resetConnection() {
  connectionError = null;
  resetConnectionError();
}

/**
 * Neo4j database interface
 */
export const db = {
  /**
   * Run a Cypher query
   * @param cypher - Cypher query string
   * @param params - Query parameters (optional)
   */
  run: async (cypher: string, params = {}) => {
    const driverInitialized = await initDriver();
    if (!driverInitialized) {
      // Se não conseguir inicializar o driver, retorna um resultado vazio em vez de lançar erro
      return { records: [] };
    }

    const session = driver.session();
    try {
      const result = await session.run(cypher, params);
      return result;
    } catch (error) {
      console.error('Error executing Cypher query:', error);
      // Se for erro de autenticação, resetar conexão para próxima tentativa
      if (error instanceof Error && 
          (error.message.includes('unauthorized') || 
           error.message.includes('authentication') || 
           error.message.includes('auth'))) {
        resetConnection();
      }
      return { records: [] }; // Retorna objeto vazio em vez de lançar erro
    } finally {
      await session.close();
    }
  },

  /**
   * Run a read-only Cypher query
   * @param cypher - Cypher query string
   * @param params - Query parameters (optional)
   */
  read: async (cypher: string, params = {}) => {
    const driverInitialized = await initDriver();
    if (!driverInitialized) {
      // Se não conseguir inicializar o driver, retorna um resultado vazio em vez de lançar erro
      return { records: [] };
    }

    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      const result = await session.run(cypher, params);
      return result;
    } catch (error) {
      console.error('Error executing read query:', error);
      // Se for erro de autenticação, resetar conexão para próxima tentativa
      if (error instanceof Error && 
          (error.message.includes('unauthorized') || 
           error.message.includes('authentication') || 
           error.message.includes('auth'))) {
        resetConnection();
      }
      return { records: [] }; // Retorna objeto vazio em vez de lançar erro
    } finally {
      await session.close();
    }
  },

  /**
   * Run a write Cypher query
   * @param cypher - Cypher query string
   * @param params - Query parameters (optional)
   */
  write: async (cypher: string, params = {}) => {
    const driverInitialized = await initDriver();
    if (!driverInitialized) {
      // Se não conseguir inicializar o driver, retorna um resultado vazio em vez de lançar erro
      return { records: [] };
    }

    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
      const result = await session.writeTransaction(async (tx) => {
        return await tx.run(cypher, params);
      });
      return result;
    } catch (error) {
      console.error('Error executing write query:', error);
      // Se for erro de autenticação, resetar conexão para próxima tentativa
      if (error instanceof Error && 
          (error.message.includes('unauthorized') || 
           error.message.includes('authentication') || 
           error.message.includes('auth'))) {
        resetConnection();
      }
      return { records: [] }; // Retorna objeto vazio em vez de lançar erro
    } finally {
      await session.close();
    }
  },

  /**
   * Close all connections
   */
  close: async () => {
    // Não fecha o driver aqui, pois ele é compartilhado com neo4j.ts
    // Apenas limpa as referências locais
    driver = null as any;
    connectionError = null;
  }
};

/**
 * Handle application exit - close database connections
 */
process.on('SIGINT', async () => {
  await db.close();
}); 