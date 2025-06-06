// Configurações de autenticação
export const authConfig = {
  // Lista de rotas públicas que não precisam de autenticação
  publicRoutes: [
    '/',
    '/login',
    '/register',
    '/api/auth',
    '/api/auth/register',
  ],
  
  // Lista de rotas que exigem privilégios de administrador
  adminRoutes: [
    '/settings/admin',
    '/api/admin',
  ],
  
  // Página para redirecionamento após login
  loginSuccessRedirect: '/dashboard',
  
  // Página para redirecionamento quando acesso for negado
  accessDeniedRedirect: '/access-denied',
  
  // Tempo de expiração do token em segundos (30 dias)
  tokenExpirationTime: 30 * 24 * 60 * 60,
}; 