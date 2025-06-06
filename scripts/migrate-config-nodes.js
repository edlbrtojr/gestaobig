/**
 * Script to migrate existing configuration nodes to new naming convention
 * - Renames "Configurações_do_Aplicativo" to "_inAppOrgConfig"
 * - Renames "SchemaConfig" to "__inAppSchemaConfig"
 */
const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'neo4j';
const authDisabled = process.env.NEO4J_AUTH_DISABLED === 'true';

// Create Neo4j driver instance
const driver = authDisabled
  ? neo4j.driver(uri)
  : neo4j.driver(uri, neo4j.auth.basic(user, password));

async function migrateConfigNodes() {
  console.log('Migrating configuration nodes to new naming convention...');
  const session = driver.session();
  
  try {
    // 1. Migrate organization config nodes
    console.log('Migrating organization config nodes...');
    const orgResult = await session.run(`
      MATCH (o:Configurações_do_Aplicativo)
      WITH o
      REMOVE o:Configurações_do_Aplicativo
      SET o:_inAppOrgConfig
      RETURN count(o) as count
    `);
    
    const orgCount = orgResult.records[0].get('count').toNumber();
    console.log(`✅ Migrated ${orgCount} organization config nodes`);
    
    // 2. Migrate schema config nodes
    console.log('Migrating schema config nodes...');
    const schemaResult = await session.run(`
      MATCH (s:SchemaConfig)
      WITH s
      REMOVE s:SchemaConfig
      SET s:__inAppSchemaConfig
      RETURN count(s) as count
    `);
    
    const schemaCount = schemaResult.records[0].get('count').toNumber();
    console.log(`✅ Migrated ${schemaCount} schema config nodes`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run the migration
migrateConfigNodes(); 