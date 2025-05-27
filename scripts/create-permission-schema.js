const neo4j = require('neo4j-driver');

// Configuration - uses same connection details as the app
const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const adminUser = process.env.NEO4J_USERNAME || "neo4j";
const adminPassword = process.env.NEO4J_PASSWORD || "3d1Jun1or";

async function setupPermissionSchema() {
  console.log('Setting up permission schema in Neo4j...');
  
  // Create a driver instance with admin credentials
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(adminUser, adminPassword),
    {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      disableLosslessIntegers: true
    }
  );

  try {
    // Verify connectivity
    await driver.verifyConnectivity();
    console.log('Successfully connected to Neo4j database');
    
    const session = driver.session();
    try {
      // Create constraints and indexes for permission model
      console.log('Creating constraints and indexes...');
      
      // Create constraint on NodePermission
      await session.run(`
        CREATE CONSTRAINT node_permission_unique IF NOT EXISTS
        FOR (p:NodePermission) 
        REQUIRE (p.nodeId, p.role) IS UNIQUE
      `).catch(e => console.log('Constraint already exists or failed:', e.message));
      
      // Create index for faster NodePermission lookups
      await session.run(`
        CREATE INDEX node_permission_index IF NOT EXISTS
        FOR (p:NodePermission) 
        ON (p.nodeId, p.role)
      `).catch(e => console.log('Index already exists or failed:', e.message));
      
      // Create constraint on NodeVisibility
      await session.run(`
        CREATE CONSTRAINT node_visibility_unique IF NOT EXISTS
        FOR (v:NodeVisibility) 
        REQUIRE v.nodeId IS UNIQUE
      `).catch(e => console.log('Constraint already exists or failed:', e.message));

      console.log('Creating initial permission schema...');
      
      // Create admin role permission node if it doesn't exist
      await session.run(`
        MERGE (ar:AccessRole {name: 'admin'})
        SET ar.description = 'Full administrative access'
        RETURN ar
      `);
      
      // Create other roles
      await session.run(`
        FOREACH (role IN ['editor', 'reader', 'publisher', 'limited'] |
          MERGE (ar:AccessRole {name: role})
          SET ar.description = CASE role
            WHEN 'editor' THEN 'Can edit data but not manage users'
            WHEN 'reader' THEN 'Read-only access'
            WHEN 'publisher' THEN 'Can read and publish reports'
            WHEN 'limited' THEN 'Very limited access'
            ELSE 'Unknown role'
          END
        )
      `);
      
      // Grant admin role permission to see all nodes by default
      await session.run(`
        MATCH (n) 
        WHERE NOT n:User AND NOT n:AccessRole AND NOT n:NodePermission AND NOT n:NodeVisibility
        WITH n
        MATCH (r:AccessRole {name: 'admin'})
        MERGE (p:NodePermission {nodeId: id(n), role: r.name})
        SET p.createdAt = datetime(), p.updatedAt = datetime()
      `);
      
      // Create the default visibility setting for all nodes (public by default)
      await session.run(`
        MATCH (n) 
        WHERE NOT n:User AND NOT n:AccessRole AND NOT n:NodePermission AND NOT n:NodeVisibility
        MERGE (v:NodeVisibility {nodeId: id(n)})
        SET v.isRestricted = false, 
            v.createdAt = datetime(), 
            v.updatedAt = datetime()
      `);
      
      console.log('✅ Permission schema setup complete');
      
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Failed to set up permission schema:', error);
  } finally {
    await driver.close();
  }
}

// Execute the function
setupPermissionSchema().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 