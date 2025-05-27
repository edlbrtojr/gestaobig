const neo4j = require('neo4j-driver');

// Configuration - uses same connection details as the app
const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const adminUser = process.env.NEO4J_USERNAME || "neo4j";
const adminPassword = process.env.NEO4J_PASSWORD || "3d1Jun1or";

// Test users with different privilege levels
const testUsers = [
  {
    username: 'admin_user',
    password: 'admin123',
    roles: ['admin'],
    displayName: 'Administrator',
    description: 'Full admin privileges with read/write access to all data'
  },
  {
    username: 'editor_user',
    password: 'editor123',
    roles: ['editor'],
    displayName: 'Editor',
    description: 'Can create and modify data but cannot manage users'
  },
  {
    username: 'analyst_user',
    password: 'analyst123',
    roles: ['reader', 'publisher'],
    displayName: 'Analyst',
    description: 'Can read all data and publish specific reports'
  },
  {
    username: 'reader_user',
    password: 'reader123',
    roles: ['reader'],
    displayName: 'Reader',
    description: 'Read-only access to all data'
  },
  {
    username: 'limited_user',
    password: 'limited123',
    roles: ['limited'],
    displayName: 'Limited Access',
    description: 'Very limited access to specific data only'
  }
];

async function createUsers() {
  console.log('Connecting to Neo4j as admin to create test users...');
  
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
    
    // Create each test user
    for (const user of testUsers) {
      const session = driver.session();
      try {
        // First check if user already exists
        const checkResult = await session.run(
          'CALL dbms.security.listUsers() YIELD username WHERE username = $username RETURN username',
          { username: user.username }
        );
        
        if (checkResult.records.length > 0) {
          console.log(`User ${user.username} already exists. Updating...`);
          
          // Drop the user if they exist
          await session.run(
            'CALL dbms.security.deleteUser($username)',
            { username: user.username }
          );
        }
        
        // Create the user
        await session.run(
          'CALL dbms.security.createUser($username, $password, false)',
          { username: user.username, password: user.password }
        );
        
        // Add roles to the user
        for (const role of user.roles) {
          try {
            // First ensure the role exists
            await session.run(
              'CALL dbms.security.createRole($role) YIELD role',
              { role }
            ).catch(e => {
              // Role might already exist, which is fine
              if (!e.message.includes('already exists')) {
                throw e;
              }
            });
            
            // Add user to role
            await session.run(
              'CALL dbms.security.addRoleToUser($role, $username)',
              { role, username: user.username }
            );
          } catch (roleError) {
            console.error(`Error assigning role ${role} to user ${user.username}:`, roleError);
          }
        }
        
        // Store user metadata in graph
        await session.run(
          `
          MERGE (u:User {username: $username})
          SET u.displayName = $displayName,
              u.description = $description,
              u.roles = $roles
          `,
          {
            username: user.username,
            displayName: user.displayName,
            description: user.description,
            roles: user.roles
          }
        );
        
        console.log(`✅ Created user: ${user.username} with roles: ${user.roles.join(', ')}`);
      } catch (error) {
        console.error(`Error creating user ${user.username}:`, error);
      } finally {
        await session.close();
      }
    }
    
    // List all users to verify
    const verifySession = driver.session();
    try {
      const result = await verifySession.run('CALL dbms.security.listUsers()');
      console.log('\nVerified users in database:');
      result.records.forEach(record => {
        console.log(`- ${record.get('username')}: ${record.get('roles').join(', ')}`);
      });
    } finally {
      await verifySession.close();
    }
    
  } catch (error) {
    console.error('Failed to create test users:', error);
  } finally {
    await driver.close();
  }
}

// Execute the function
createUsers().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 