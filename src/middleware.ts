import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authConfig } from '@/config/auth-config';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se a rota atual é pública
  const isPublicRoute = authConfig.publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Se for uma rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next();
  }

    // Verificar se o usuário está autenticado
  console.log(`[Middleware] Processing request for ${pathname}`);
  
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log(`[Middleware] Token found: ${!!token}`);
    
    // Se não estiver autenticado, redirecionar para a página de login
    // Apenas redirecione se realmente não existir token
    if (!token) {
      console.log(`[Middleware] No token found, redirecting to login`);
      
      const loginUrl = new URL('/login', request.url);
      // Adicionar URL atual como parâmetro para redirecionamento após login
      loginUrl.searchParams.set('callbackUrl', request.url);
      
      // Adicionar cabeçalho cache-control para evitar caching do redirecionamento
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    }

    // Verificar se a rota requer privilégios de administrador
    const isAdminRoute = authConfig.adminRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );

    // Se for uma rota de admin e o usuário não for admin, redirecionar para página de acesso negado
    if (isAdminRoute && !token.isSystemAdmin) {
      return NextResponse.redirect(new URL(authConfig.accessDeniedRedirect, request.url));
    }

    // Se estiver autenticado e tiver as permissões necessárias, permitir acesso
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error extracting token:', error);
    return NextResponse.next();
  }
}

// Configurar para quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Executar em todas as rotas exceto:
     * - Arquivos estáticos (public/)
     * - Recursos Next (_next/)
     * - API de autenticação (já tratada separadamente)
     * - API de upload
     */
    '/((?!_next/|public/|uploads/|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}; 