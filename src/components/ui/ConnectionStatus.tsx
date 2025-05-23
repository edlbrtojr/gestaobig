'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, LockKeyhole, Info } from 'lucide-react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { resetConnection } from '@/lib/db';

interface ConnectionStatusResponse {
  connected: boolean;
  offlineMode: boolean;
  error?: string;
  timestamp?: string;
  authError?: boolean;
  env?: {
    uri_defined: boolean;
    username_defined: boolean;
    password_defined: boolean;
  };
}

export function ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'auth_error'>('connecting');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(Date.now());
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // Create a memoized check connection function to avoid unnecessary re-renders
  const checkConnection = useCallback(async (force = false) => {
    // If already checking and not forced, skip this check
    if (isCheckingConnection && !force) {
      return;
    }
    
    // If not forced update and checked in the last 5 seconds, skip to avoid rapid calls
    if (!force && Date.now() - lastCheck < 5000) {
      return;
    }
    
    setLastCheck(Date.now());
    setIsCheckingConnection(true);
    
    // Set connection timeout (3 seconds)
    const connectionTimeout = 3000;
    const timeoutId = setTimeout(() => {
      // If still checking after timeout, mark as disconnected and show timeout error
      if (isCheckingConnection) {
        setStatus('disconnected');
        setErrorMessage('Tempo limite de conexão excedido');
        setIsCheckingConnection(false);
      }
    }, connectionTimeout);
    
    try {
      // Add cache-busting parameter to prevent request caching
      const params = new URLSearchParams();
      params.append('t', Date.now().toString());
      
      const res = await fetch(`/api/health?${params.toString()}`, { 
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(connectionTimeout)
      });
      
      clearTimeout(timeoutId);
      setIsCheckingConnection(false);
      
      const data: ConnectionStatusResponse = await res.json();
      
      if (data.authError) {
        setStatus('auth_error');
        setErrorMessage('Erro de autenticação no Neo4j');
        // Reset retry count since this is a configuration issue that needs manual intervention
        setRetryCount(0);
      } else {
        setStatus(data.connected ? 'connected' : 'disconnected');
        setErrorMessage(data.error || null);
        
        // If it's connected, reset retry count
        if (data.connected) {
          setRetryCount(0);
        }
      }
      
      setIsOfflineMode(data.offlineMode || false);
    } catch (error) {
      clearTimeout(timeoutId);
      setIsCheckingConnection(false);
      setStatus('disconnected');
      setIsOfflineMode(true);
      
      // Check if it's a timeout error
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        setErrorMessage('Tempo limite de conexão excedido');
      } else {
        setErrorMessage('Falha na conexão com a API');
      }
    }
  }, [isCheckingConnection, lastCheck]);
  
  // Function to explicitly retry the connection
  const retryConnection = useCallback(async () => {
    // Reset the connection state in db.ts
    resetConnection();
    
    // Increment retry count
    setRetryCount(prev => prev + 1);
    
    // Show connecting status immediately on manual retry
    setStatus('connecting');
    
    // Force check connection
    await checkConnection(true);
  }, [checkConnection]);

  // Set up regular health checks
  useEffect(() => {
    // Initial check when component mounts
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(() => checkConnection(), 30000);
    
    // If disconnected and within retry limits, try reconnecting on a shorter interval
    let retryInterval: NodeJS.Timeout | null = null;
    
    if (status === 'disconnected' && retryCount < 5) {
      // Back-off strategy: wait longer between retries (3s, 6s, 12s, etc.)
      const retryDelayMs = 3000 * Math.pow(2, retryCount);
      
      retryInterval = setTimeout(() => {
        retryConnection();
      }, retryDelayMs);
    }
    
    return () => {
      clearInterval(interval);
      if (retryInterval) clearTimeout(retryInterval);
    };
  }, [checkConnection, retryConnection, status, retryCount]);

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'connected' ? (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span>Neo4j</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Conexão com o banco de dados estabelecida</p>
          </TooltipContent>
        </Tooltip>
      ) : status === 'connecting' ? (
        <div className="flex items-center gap-1 text-amber-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Conectando...</span>
        </div>
      ) : status === 'auth_error' ? (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                <LockKeyhole className="w-4 h-4" />
                <span>Erro de autenticação</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={retryConnection} 
                className="h-7 px-2"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reconectar
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Verifique as credenciais no arquivo .env.local</p>
            <p className="text-xs mt-1 text-muted-foreground">URI, username e password do Neo4j</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span>Neo4j Desconectado</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={retryConnection} 
                className="h-7 px-2"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reconectar
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{errorMessage || 'Não foi possível conectar ao Neo4j'}</p>
            {retryCount > 0 && (
              <p className="text-xs mt-1 text-muted-foreground">
                Tentativas de reconexão: {retryCount}/5
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      )}
      
      {isOfflineMode && (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="ml-2 text-amber-500 text-xs flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Offline</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Modo offline ativado. Funcionalidades básicas disponíveis.</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
} 