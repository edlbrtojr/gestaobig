import { useState } from 'react';
import { Permission } from '@/lib/permissions';

/**
 * Hook simplificado para gerenciar permissões
 * Sem autenticação, todas as permissões são concedidas por padrão
 */
export function usePermissions() {
  // Função que verifica se o usuário tem uma determinada permissão
  // Nesta versão simplificada, todas as permissões retornam true
  const checkPermission = (permission: Permission | string): boolean => {
    // Sem autenticação, todas as permissões são concedidas
    return true;
  };

  return {
    checkPermission,
  };
} 