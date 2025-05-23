const neo4j = require('neo4j-driver');

// Create a driver instance
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', '3d1Jun1or')
);

async function checkSchema() {
  const session = driver.session();
  try {
    // Query to get the SchemaConfig node
    const result = await session.run(
      'MATCH (config:SchemaConfig) RETURN config.schema as schema'
    );
    
    if (result.records.length === 0) {
      console.log('No SchemaConfig node found!');
      return;
    }
    
    const schemaString = result.records[0].get('schema');
    
    if (!schemaString) {
      console.log('Schema property is null or undefined!');
      return;
    }
    
    // Parse the schema JSON
    const schema = JSON.parse(schemaString);
    
    // Check if the schema has nodeTypes and relationshipTypes
    console.log('Schema structure:');
    console.log('- nodeTypes:', Object.keys(schema.nodeTypes || {}).length, 'types');
    console.log('- relationshipTypes:', Object.keys(schema.relationshipTypes || {}).length, 'types');
    
    // Print the relationship types in detail
    console.log('\nRelationship Types:');
    if (schema.relationshipTypes && Object.keys(schema.relationshipTypes).length > 0) {
      Object.entries(schema.relationshipTypes).forEach(([key, rel]) => {
        console.log(`- ${key}:`);
        console.log(`  - Description: ${rel.description}`);
        console.log(`  - Source node types: ${rel.sourceNodeTypes.join(', ')}`);
        console.log(`  - Target node types: ${rel.targetNodeTypes.join(', ')}`);
        console.log(`  - Bidirectional: ${rel.bidirectional ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('No relationship types defined in the schema.');
    }
  } catch (error) {
    console.error('Error querying Neo4j:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run the check
checkSchema(); 