import neo4j, { Driver } from "neo4j-driver";

// Using environment variables for connection details
// Fallback to default values for local development
const URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const USER = process.env.NEO4J_USER || "neo4j";
const PASSWORD = process.env.NEO4J_PASSWORD || "3d1Jun1or";

let driver: Driver | null = null;

/**
 * Initialize a Neo4j driver instance with connection pooling
 */
export function getDriver(): Driver {
  // Return existing driver if already initialized
  if (driver) {
    return driver;
  }

  // Create a new driver instance with connection pooling
  driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2000,
  });

  return driver;
}

/**
 * Close the Neo4j driver connection
 * Should be called when the application shuts down
 */
export function closeDriver(): Promise<void> {
  if (driver) {
    return driver.close();
  }
  return Promise.resolve();
}

/**
 * Run a Cypher query with parameters
 */
export async function runQuery(cypher: string, params = {}) {
  const session = getDriver().session();

  try {
    const result = await session.run(cypher, params);
    return result.records;
  } catch (error) {
    console.error("Neo4j Query Error:", error);
    throw error;
  } finally {
    await session.close();
  }
}
