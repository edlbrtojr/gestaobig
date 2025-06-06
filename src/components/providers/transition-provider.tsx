"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { PageTransitionFadeSlide } from "@/components/ui/page-transition";

interface TransitionProviderProps {
  children: ReactNode;
}

export function TransitionProvider({ children }: TransitionProviderProps) {
  const router = useRouter();
  const [isChangingRoute, setIsChangingRoute] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Montar o componente no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gerenciar transições de rota
  useEffect(() => {
    if (!mounted) return;

    const handleRouteChangeStart = () => {
      setIsChangingRoute(true);
    };

    const handleRouteChangeComplete = () => {
      setIsChangingRoute(false);
    };

    // Adicionar listeners para eventos de mudança de rota
    // Nota: Em Next.js App Router, esses eventos funcionam de forma diferente
    // Este é um esboço que precisa ser ajustado para funcionar com o App Router
    window.addEventListener('beforeunload', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleRouteChangeStart);
    };
  }, [mounted]);

  if (!mounted) {
    // Esqueleto de carregamento inicial (opcional)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-900">
        <div className="loading-animation"></div>
      </div>
    );
  }

  // Componente com transição suave
  return (
    <PageTransitionFadeSlide>
      {children}
    </PageTransitionFadeSlide>
  );
} 