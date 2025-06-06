"use client";

import { Waypoints } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSkeleton({
  title = "FRIGG",
  subtitle = "Carregando tecelagem...",
  icon,
  className = "",
  size = "md",
}: LoadingSkeletonProps) {
  // Tamanho do ícone com base no prop size
  const iconSizes = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  // Tamanhos de texto com base no prop size
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const subtitleSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-violet-900 ${className}`}>
      <motion.div 
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          {icon ? (
            <>
              {icon}
              <div className="absolute inset-0 animate-ping opacity-30">{icon}</div>
              <div className="absolute inset-0 animate-pulse opacity-50">{icon}</div>
            </>
          ) : (
            <>
              <Waypoints className={`${iconSizes[size]} text-blue-300/80`} strokeWidth={1} />
              <div className="absolute inset-0 animate-ping">
                <Waypoints className={`${iconSizes[size]} text-blue-400/30`} strokeWidth={1} />
              </div>
              <div className="absolute inset-0 animate-pulse">
                <Waypoints className={`${iconSizes[size]} text-blue-200/50`} strokeWidth={1} />
              </div>
            </>
          )}
        </div>
        
        {title && (
          <motion.div 
            className={`text-blue-100/90 ${textSizes[size]} font-nordic tracking-wider animate-pulse`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {title}
          </motion.div>
        )}
        
        {subtitle && (
          <motion.div 
            className={`text-blue-200/60 ${subtitleSizes[size]} animate-pulse`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {subtitle}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// Versão simplificada do componente de carregamento para mini-loaders
export function MiniLoader({ className = "", size = "sm" }: { className?: string, size?: "xs" | "sm" | "md" }) {
  // Tamanhos para o mini loader
  const sizes = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
  };
  
  return (
    <div className={`relative inline-flex ${className}`}>
      <Waypoints className={`${sizes[size]} text-blue-300/80 animate-pulse`} strokeWidth={1.5} />
      <div className="absolute inset-0 animate-ping opacity-30">
        <Waypoints className={`${sizes[size]} text-blue-400/30`} strokeWidth={1.5} />
      </div>
    </div>
  );
} 