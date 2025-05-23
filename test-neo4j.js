// Script para testar conexão com Neo4j
const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  // Obter credenciais do ambiente
  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USERNAME || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "3d1Jun1or";

  console.log("Tentando conectar ao Neo4j com:");
  console.log(`- URI: ${uri}`);
  console.log(`- Usuário: ${user}`);
  console.log(`- Senha: ${password.charAt(0)}${'*'.repeat(password.length - 1)}`);
  
  try {
    // Criar driver
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      { 
        connectionTimeout: 5000,
        logging: {
          level: 'info',
          logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`)
        }
      }
    );
    
    // Verificar conectividade
    console.log("Verificando conectividade...");
    await driver.verifyConnectivity();
    console.log("✅ Conectividade verificada com sucesso!");
    
    // Testar consulta simples
    console.log("Executando consulta de teste...");
    const session = driver.session();
    try {
      const result = await session.run("RETURN 1 as num");
      const num = result.records[0]?.get("num");
      console.log(`✅ Consulta executada com sucesso. Resultado: ${num}`);
    } catch (error) {
      console.error("❌ Erro ao executar consulta:", error);
    } finally {
      await session.close();
    }
    
    // Fechar driver
    await driver.close();
    console.log("Conexão fechada.");
    
  } catch (error) {
    console.error("❌ Erro na conexão:", error);
    
    // Verificar se é problema de autenticação
    if (error.message.includes('unauthorized') || 
        error.message.includes('authentication') ||
        error.message.includes('auth')) {
      console.log("\n🔑 PROBLEMA DE AUTENTICAÇÃO DETECTADO!");
      console.log("Verifique suas credenciais no arquivo .env.local");
      console.log("\nVerifique também se você alterou a senha padrão do Neo4j após a instalação.");
    }
  }
}

// Executar teste de conexão
testConnection().catch(console.error); 