"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signIn as nextAuthSignIn, 
  signOut as nextAuthSignOut,
  useSession 
} from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

// Tipos
interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSystemAdmin: boolean;
  authType: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Criar contexto com valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSystemAdmin: false,
  authType: null,
  login: async () => false,
  loginWithMicrosoft: async () => false,
  register: async () => false,
  logout: async () => {},
});

// Provider do contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState<boolean>(false);
  const [authType, setAuthType] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Atualizar estado quando a sessão mudar
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser(session.user);
      setIsAuthenticated(true);
      setIsSystemAdmin(!!session.user.isSystemAdmin);
      setAuthType(session.user.authType || "local");
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setIsSystemAdmin(false);
      setAuthType(null);
    }
  }, [session, status]);

  // Redirecionar usuário se não autenticado e tentando acessar página protegida
  useEffect(() => {
    if (status === "unauthenticated") {
      const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register" || pathname.startsWith('/api/');
      
      if (!isPublicPage) {
        console.log("Redirecionando usuário não autenticado para login...");
        router.push("/login");
      }
    }
  }, [status, pathname, router]);

  // Funções de autenticação
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        toast.error("Credenciais inválidas");
        return false;
      }

      toast.success("Login realizado com sucesso");
      router.push("/");
      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao fazer login");
      return false;
    }
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    try {
      console.log("Iniciando login com Microsoft...");
      
      // Como estamos utilizando callbackUrl agora, isso irá redirecionar para a
      // página definida após o login bem-sucedido
      const result = await nextAuthSignIn("azure-ad", {
        callbackUrl: "/",
        redirect: true
      });
      
      console.log("Resultado do login com Microsoft:", result);
      
      // Como redirect é true, não esperamos um retorno direto
      // O usuário será redirecionado automaticamente para a callbackUrl
      return true;
    } catch (error) {
      console.error("Erro ao fazer login com Microsoft:", error);
      toast.error("Erro ao fazer login com Microsoft");
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao registrar");
        return false;
      }

      toast.success("Registro realizado com sucesso");
      
      // Fazer login automático após o registro
      return await login(email, password);
    } catch (error) {
      console.error("Erro ao registrar:", error);
      toast.error("Erro ao registrar");
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await nextAuthSignOut({ callbackUrl: "/" });
      toast.info("Sessão encerrada");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao encerrar sessão");
    }
  };

  // Valor do contexto
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: status === "loading",
    isSystemAdmin,
    authType,
    login,
    loginWithMicrosoft,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext); 