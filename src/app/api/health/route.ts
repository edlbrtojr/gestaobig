import { NextResponse } from "next/server";
import { getDriver, isDatabaseAvailable, resetConnectionError } from "@/lib/neo4j";

// Track if we've successfully connected recently to avoid repeated expensive checks
let lastSuccessfulCheck = 0;
const CACHE_TTL_MS = 10000; // 10 seconds

export async function GET() {
  try {
    // Check if we've had a successful connection in the last 10 seconds
    // If so, return success without testing again to avoid slow responses
    if (Date.now() - lastSuccessfulCheck < CACHE_TTL_MS) {
      return NextResponse.json({
        connected: true,
        offlineMode: false,
        timestamp: new Date().toISOString(),
        source: 'cache'
      });
    }

    // Primeiro tentamos obter o driver para ver se temos erros de conexão
    const driver = await getDriver();
    
    // Se não conseguimos um driver, pode ser problema de autenticação ou conexão
    if (!driver) {
      return NextResponse.json({
        connected: false,
        offlineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
        error: "Falha ao estabelecer conexão com o Neo4j",
        authError: true,
        timestamp: new Date().toISOString(),
        env: {
          uri_defined: !!process.env.NEO4J_URI,
          username_defined: !!process.env.NEO4J_USERNAME,
          password_defined: !!process.env.NEO4J_PASSWORD
        }
      });
    }
    
    // Se temos um driver, verificamos se o banco está disponível
    // Use AbortController to limit query execution time
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 2000); // 2 second timeout
    
    try {
      const session = driver.session();
      try {
        // Simple query to check if database is responding
        // Note: Neo4j driver doesn't support AbortSignal directly in TransactionConfig
        // We'll use our own timeout mechanism instead
        await session.run("RETURN 1 AS available");
        clearTimeout(timeoutId);
        
        // Update last successful check time
        lastSuccessfulCheck = Date.now();
        
        return NextResponse.json({
          connected: true,
          offlineMode: false,
          timestamp: new Date().toISOString()
        });
      } finally {
        await session.close();
      }
    } catch (dbError) {
      clearTimeout(timeoutId);
      console.error("Database check failed:", dbError);
      
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      const isTimeout = errorMessage.includes('timeout') || 
                       errorMessage.includes('aborted') || 
                       dbError instanceof DOMException;
      
      return NextResponse.json({
        connected: false,
        offlineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
        error: isTimeout ? "Tempo limite de conexão excedido" : "Falha ao conectar ao banco de dados",
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erro na verificação de saúde:", error);
    
    // Tentar determinar se é erro de autenticação
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isAuthError = errorMessage.includes('unauthorized') || 
                       errorMessage.includes('authentication') || 
                       errorMessage.includes('auth');
    
    // Se for erro de autenticação, resetar a conexão para tentar novamente na próxima vez
    if (isAuthError) {
      resetConnectionError();
    }
    
    return NextResponse.json({
      connected: false,
      offlineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
      error: "Falha ao conectar ao banco de dados",
      authError: isAuthError,
      errorDetails: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
} 