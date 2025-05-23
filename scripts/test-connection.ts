import neo4j from 'neo4j-driver';

async function testConnection() {
  console.log('Testing Neo4j connection...');
  
  const uri = 'bolt://localhost:7687';
  const username = 'neo4j';
  const password = '3d1Jun1or';

  console.log(`Connecting to ${uri} with username: ${username}`);

  try {
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password)
    );

    console.log('Driver created, testing connection...');
    
    const session = driver.session();
    try {
      console.log('Running test query...');
      const result = await session.run('RETURN 1 as num');
      console.log('Query result:', result.records[0].get('num').toString());
      console.log('Connection successful!');
    } finally {
      await session.close();
    }

    await driver.close();
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
}

testConnection().catch(console.error); 