import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do arquivo .env.local
dotenv.config({ path: '.env.local' });

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || '';

console.log(`Testando conexão com Neo4j em ${uri}`);

async function testConnection() {
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(user, password),
    { disableLosslessIntegers: true }
  );

  try {
    console.log('Verificando conectividade...');
    await driver.verifyConnectivity();
    console.log('✅ Conectividade verificada com sucesso!');

    console.log('Executando consulta de teste...');
    const session = driver.session();
    try {
      const result = await session.run('RETURN 1 as num');
      const num = result.records[0]?.get('num');
      console.log(`✅ Consulta executada com sucesso. Resultado: ${num}`);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  } finally {
    await driver.close();
  }
}

testConnection().catch(console.error); 