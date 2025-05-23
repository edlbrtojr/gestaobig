'use client';

import Link from "next/link";
import {
  Waypoints,
  Network,
  LineChart,
  BarChart3,
  GitBranch,
  Compass,
  Shield,
} from "lucide-react";
import Image from "next/image";
import LottieWaves from "@/components/lottie-animation";
import { useOrgConfig } from "@/contexts/org-config-provider";

export default function Home() {
  const { config } = useOrgConfig();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-16 md:py-24 bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-900 dark:from-background dark:via-gray-900 dark:to-blue-950 relative overflow-hidden">
        {/* Blue waves animation - positioned higher in the hero */}
        <div className="absolute inset-0 w-full h-full z-0 flex items-center">
          <div className="w-full transform -translate-y-55">
            <LottieWaves className="w-full opacity-20" />
          </div>
        </div>

        {/* Decorative heptagons and connection lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Connecting lines */}
          <div className="absolute top-[20%] left-[10%] w-[80%] h-px bg-blue-400/20 rotate-12"></div>
          <div className="absolute top-[40%] left-[5%] w-[90%] h-px bg-blue-400/20 rotate-[354deg]"></div>
          <div className="absolute top-[60%] left-[15%] w-[70%] h-px bg-blue-400/15 rotate-[6deg]"></div>
          <div className="absolute top-[75%] left-[25%] w-[50%] h-px bg-blue-400/10 -rotate-12"></div>

          {/* 3D heptagons (simplified with rotated squares as optical illusion) */}
          <div className="absolute top-[15%] left-[10%] w-16 h-16 border border-blue-400/30 rotate-45 transform-gpu"></div>
          <div className="absolute top-[35%] right-[15%] w-24 h-24 border border-blue-400/20 rotate-[15deg] transform-gpu"></div>
          <div className="absolute bottom-[20%] left-[20%] w-20 h-20 border border-blue-400/15 rotate-[30deg] transform-gpu"></div>

          {/* Connection dots */}
          <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-blue-400/40 rounded-full"></div>
          <div className="absolute top-[40%] right-[30%] w-2 h-2 bg-blue-400/40 rounded-full"></div>
          <div className="absolute top-[60%] left-[25%] w-2 h-2 bg-blue-400/40 rounded-full"></div>
          <div className="absolute bottom-[20%] right-[15%] w-2 h-2 bg-blue-400/40 rounded-full"></div>
          <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-blue-400/40 rounded-full"></div>
        </div>

        <div className="max-w-5xl w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left relative z-10">
              <div className="inline-block mb-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                Federação das Indústrias do Estado do Acre
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white dark:text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-100">
                  FRIGG
                </span>
              </h1>

              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-12 bg-blue-400/60"></div>
                <span className="text-xl text-blue-200">
                  Tecelã de Estratégias
                </span>
              </div>

              <p className="text-lg md:text-xl text-blue-100 dark:text-blue-100 mb-4 leading-relaxed">
                Inspirado na deusa nórdica que visualiza as linhas do destino,
                tecendo os fios do futuro.
              </p>

              <p className="text-base text-blue-200 dark:text-blue-200 mb-8">
                Uma poderosa ferramenta de visualização para mapear conexões
                estratégicas e revelar padrões ocultos que moldam o futuro de
                sua organização.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/graph"
                  className="px-8 py-3 rounded bg-white/10 border border-white/30 backdrop-blur-sm text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-lg font-medium"
                >
                  <Waypoints className="h-5 w-5" />
                  Explorar Conexões
                </Link>

                <a
                  href="http://www.fieac.org.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded bg-transparent border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-lg font-medium"
                >
                  Portal FIEAC
                </a>
              </div>
            </div>

            <div className="hidden md:flex justify-center items-center">
              <div className="relative h-80 w-80 drop-shadow-2xl">
                {/* Central heptagon (represented as multi-layered shape) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Base layer */}
                    <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full"></div>

                    {/* Heptagon representation (simplified) */}
                    <div className="absolute inset-4 border border-blue-300/40 rotate-12 transform-gpu"></div>
                    <div className="absolute inset-4 border border-blue-300/40 rotate-[51deg] transform-gpu"></div>
                    <div className="absolute inset-4 border border-blue-300/40 rotate-[90deg] transform-gpu"></div>
                    <div className="absolute inset-4 border border-blue-300/40 rotate-[129deg] transform-gpu"></div>
                    <div className="absolute inset-4 border border-blue-300/40 rotate-[168deg] transform-gpu"></div>

                    {/* Center point */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full"></div>

                    {/* Connecting lines */}
                    <div className="absolute top-1/2 left-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-blue-400/30 rotate-[30deg]"></div>
                    <div className="absolute top-1/2 left-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-blue-400/30 rotate-[60deg]"></div>
                    <div className="absolute top-1/2 left-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-blue-400/30 rotate-[90deg]"></div>
                    <div className="absolute top-1/2 left-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-blue-400/30 rotate-[120deg]"></div>
                    <div className="absolute top-1/2 left-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-blue-400/30 rotate-[150deg]"></div>
                  </div>
                </div>

                {/* Animated pulse */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/5 to-indigo-500/10 opacity-50 blur-xl animate-pulse"></div>

                {/* Icon */}
                <div className="relative h-full w-full flex items-center justify-center">
                  <Waypoints
                    className="h-20 w-20 text-blue-100/70"
                    strokeWidth={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                  src={config.theme.lightLogo}
                  alt={`${config.shortName} Logo`}
                  width={120}
                  height={40}
                  className="dark:hidden"
                />
                <Image
                  src={config.theme.darkLogo}
                  alt={`${config.shortName} Logo`}
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
                © {new Date().getFullYear()} {config.name}. {config.footerText}
              </p>
              <p className="text-xs mt-1">
                Frigg - Tecelã de Conexões Estratégicas
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
