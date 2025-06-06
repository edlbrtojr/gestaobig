// Definição básica de permissões sem autenticação
export const PERMISSIONS = {
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  VIEW_ADMIN: 'view_admin',
  EDIT_CONFIG: 'edit_config',
  MANAGE_NODES: 'manage_nodes',
  MANAGE_RELATIONSHIPS: 'manage_relationships',
  MANAGE_SCHEMA: 'manage_schema',
};

// Tipos para permissões
export type Permission = keyof typeof PERMISSIONS; 