// Script to clear all nodes and permissions in Neo4j while preserving __inAppSchemaConfig
const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Obtém as credenciais do ambiente
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || '';

console.log(`Conectando ao Neo4j em ${uri} com usuário ${user}`);

// Cria o driver Neo4j
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function clearDatabase() {
  const session = driver.session();
  
  try {
    console.log('Limpando o banco de dados...');
    
    // Exclui todos os relacionamentos e nós
    const result = await session.run(`
      MATCH (n)
      DETACH DELETE n
      RETURN count(n) as deletedCount
    `);
    
    const deletedCount = result.records[0].get('deletedCount');
    console.log(`✅ Banco de dados limpo com sucesso! ${deletedCount} nós excluídos.`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar o banco de dados:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing database with predefined schema...');
    
    // Read the create_database.cypher file
    const cypherFilePath = path.join(__dirname, '..', 'create_database.cypher');
    const cypherScript = fs.readFileSync(cypherFilePath, 'utf-8');
    
    // Split the script by statements (separated by semicolons)
    const statements = cypherScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('//') && !stmt.startsWith('/*'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await session.run(`${statement};`);
        } catch (statementError) {
          console.error(`Error executing statement: ${statement}`, statementError);
        }
      }
    }
    
    console.log('✅ Database initialized successfully with predefined schema.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function main() {
  try {
    // First clear the database
    await clearDatabase();
    
    // Ask if user wants to initialize with predefined schema
    const args = process.argv.slice(2);
    const shouldInitialize = args.includes('--init') || args.includes('-i');
    
    if (shouldInitialize) {
      await initializeDatabase();
    } else {
      console.log('Database clearing completed. To initialize with predefined schema, run with --init or -i flag.');
    }
  } catch (error) {
    console.error('Error in main execution:', error);
  }
}

main(); 