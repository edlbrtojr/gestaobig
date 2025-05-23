import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

export async function GET() {
  try {
    // Obter credenciais do ambiente
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const user = process.env.NEO4J_USERNAME || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "3d1Jun1or";

    console.log("Testando conexão com Neo4j usando:", { uri, user, password: "***" });
    
    // Criar driver diretamente, sem usar singleton
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        connectionTimeout: 5000
      }
    );
    
    // Tentar verificar conexão
    await driver.verifyConnectivity();
    
    // Testar consulta simples para verificar autenticação
    const session = driver.session();
    try {
      const result = await session.run("RETURN 1 as num");
      const num = result.records[0]?.get("num");
      
      // Fechar conexão quando terminar
      await session.close();
      await driver.close();
      
      return NextResponse.json({
        success: true,
        connected: true,
        query_result: num,
        credentials: {
          uri,
          user,
          password_masked: password.substr(0, 2) + "*****"
        }
      });
    } finally {
      await session.close();
      await driver.close();
    }
  } catch (error) {
    console.error("Erro no teste de conexão:", error);
    
    // Extrair mensagem de erro detalhada
    let errorMessage = "Erro desconhecido";
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { 
        name: error.name, 
        stack: error.stack?.split("\n").slice(0, 3)
      };
      
      // Verificar se é erro de autenticação
      const isAuthError = 
        errorMessage.includes("unauthorized") || 
        errorMessage.includes("authentication") || 
        errorMessage.includes("auth");
      
      return NextResponse.json({
        success: false,
        connected: false,
        error: errorMessage,
        is_auth_error: isAuthError,
        details: errorDetails,
        env_variables: {
          NEO4J_URI: process.env.NEO4J_URI ? "definido" : "não definido",
          NEO4J_USERNAME: process.env.NEO4J_USERNAME ? "definido" : "não definido",
          NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ? "definido" : "não definido",
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: String(error)
    });
  }
} 