import neo4j, { Driver, Session, Transaction } from "neo4j-driver";

// Create a singleton Neo4j driver instance that can be reused
let driver: Driver | null = null;

// Function to get or create the Neo4j driver instance
export function getDriver(): Driver {
  if (driver) {
    return driver;
  }

  // Create a new driver instance if one doesn't exist
  driver = neo4j.driver(
    process.env.NEO4J_URI || "bolt://localhost:7687",
    neo4j.auth.basic(
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "3d1Jun1or"
    ),
    {
      // Configure the connection pool
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 5000, // 5 seconds
    }
  );

  // Add a handler to close the driver when the process exits
  process.on("exit", () => {
    if (driver) {
      driver.close();
    }
  });

  return driver;
}

// Helper function to execute a read query
export async function executeRead<T>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T> {
  const session = getDriver().session();

  try {
    const result = await session.run(cypher, params);
    return result as unknown as T;
  } finally {
    await session.close();
  }
}

// Helper function to execute a write query
export async function executeWrite<T>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T> {
  const session = getDriver().session();

  try {
    const result = await session.writeTransaction(async (tx: Transaction) => {
      return await tx.run(cypher, params);
    });
    return result as unknown as T;
  } finally {
    await session.close();
  }
}
