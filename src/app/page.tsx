"use client";

import Link from "next/link";
import {
  Waypoints,
  Network,
  LineChart,
  BarChart3,
  GitBranch,
  Compass,
  Shield,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import LottieWaves from "@/components/lottie-animation";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { PageTransitionFadeSlide } from "@/components/ui/page-transition";

// Componente de carregamento com animações suaves
const LoadingSkeleton = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-900">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Waypoints className="h-16 w-16 text-blue-300/80" strokeWidth={1} />
        <div className="absolute inset-0 animate-ping">
          <Waypoints className="h-16 w-16 text-blue-400/30" strokeWidth={1} />
        </div>
        <div className="absolute inset-0 animate-pulse">
          <Waypoints className="h-16 w-16 text-blue-200/50" strokeWidth={1} />
        </div>
      </div>
      <div className="text-blue-100/90 text-xl font-nordic tracking-wider animate-pulse">FRIGG</div>
      <div className="text-blue-200/60 text-sm animate-pulse">Carregando tecelagem...</div>
    </div>
  </div>
);

// Importar o NetworkHero dinamicamente com ssr: false para evitar problemas de hidratação
const NetworkHero = dynamic(() => import('@/components/NetworkHero'), {
  ssr: false,
  loading: () => <LoadingSkeleton />
});

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Montar o componente com um pequeno atraso para garantir renderização suave
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      router.push('/graph');
    } else {
      router.push('/login');
    }
  };

  // Não renderize nada até o componente estar montado no cliente
  if (!mounted) return <LoadingSkeleton />;

  return (
    <PageTransitionFadeSlide>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <NetworkHero 
          title="FRIGG"
          subtitle="A Tecelã de Conexões Estratégicas"
          ctaText={isAuthenticated ? "Analise a Teia" : "Entrar"}
          onCtaClick={handleCtaClick}
          nodeColors={['#3b82f6', '#8b5cf6', '#06b6d4']}
          backgroundColor="#0f172a"
          gradientColors={['#0f172a', '#1e293b', '#334155']}
          enableInteraction={true}
          enableParallax={true}
          className="bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-900"
        />

        {/* Features Section */}
        <section className="py-16 px-6 bg-white dark:bg-background border-t border-gray-100 dark:border-gray-800 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-1/5 w-px h-full bg-blue-500/50"></div>
            <div className="absolute top-0 left-2/5 w-px h-full bg-blue-500/50"></div>
            <div className="absolute top-0 left-3/5 w-px h-full bg-blue-500/50"></div>
            <div className="absolute top-0 left-4/5 w-px h-full bg-blue-500/50"></div>
            <div className="absolute top-1/6 left-0 w-full h-px bg-blue-500/50"></div>
            <div className="absolute top-2/6 left-0 w-full h-px bg-blue-500/50"></div>
            <div className="absolute top-3/6 left-0 w-full h-px bg-blue-500/50"></div>
            <div className="absolute top-4/6 left-0 w-full h-px bg-blue-500/50"></div>
            <div className="absolute top-5/6 left-0 w-full h-px bg-blue-500/50"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 relative z-10">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-px bg-blue-500 dark:bg-blue-400"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Desvende o Padrão das Conexões
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Como as nornas tecem o destino dos deuses, Frigg permite
                visualizar a teia que conecta cada aspecto de sua organização
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow group">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-fit mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Compass className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Mapeamento Nórdico
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Visualize a Yggdrasil de sua organização, a árvore que conecta
                  todos os reinos e níveis de sua estrutura corporativa.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow group">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-fit mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <GitBranch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Tecelagem de Caminhos
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Como Frigg que enxerga os fios do destino, identifique conexões
                  estratégicas e crie novos padrões para o sucesso de seu negócio.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow group">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-fit mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Proteção Estratégica
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Antecipe ameaças e oportunidades, fortalecendo seu Valhalla
                  corporativo contra os desafios do mercado com visão estratégica
                  avançada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 relative">
          {/* Decorative heptagons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/6 w-16 h-16 border border-blue-400/10 rotate-45"></div>
            <div className="absolute bottom-1/4 right-1/6 w-12 h-12 border border-blue-400/10 rotate-12"></div>
            <div className="absolute top-2/3 left-1/3 w-8 h-8 border border-blue-400/10 rotate-30"></div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white/50 dark:bg-blue-950/30 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-800/20">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  +500
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Conexões Tecidas
                </p>
              </div>
              <div className="text-center p-6 bg-white/50 dark:bg-blue-950/30 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-800/20">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  27
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Reinos Mapeados
                </p>
              </div>
              <div className="text-center p-6 bg-white/50 dark:bg-blue-950/30 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-800/20">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  +2.000
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Nós Entrelaçados
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                  <Image
                    src={siteConfig.theme.lightLogo}
                    alt={`${siteConfig.shortName} Logo`}
                    width={120}
                    height={40}
                    className="dark:hidden"
                  />
                  <Image
                    src={siteConfig.theme.darkLogo}
                    alt={`${siteConfig.shortName} Logo`}
                    width={120}
                    height={40}
                    className="hidden dark:block"
                  />
                  <div className="h-8 border-r border-gray-300 dark:border-gray-700"></div>
                  <div className="flex items-center gap-1.5">
                    <Waypoints className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-sm">FRIGG</span>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right text-gray-600 dark:text-gray-400">
                <p className="text-sm">
                  © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.footerText}
                </p>
                <p className="text-xs mt-1">
                  Frigg - Tecelã de Conexões Estratégicas
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransitionFadeSlide>
  );
}
