"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function AccessDenied() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirecionar usuários não autenticados para a página de login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Acesso Restrito
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
          Você não tem permissão para acessar esta página. Esta área é restrita a administradores do sistema.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
} 