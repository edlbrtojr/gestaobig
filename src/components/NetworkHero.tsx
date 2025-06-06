"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

// Estilo global para o cursor personalizado da lupa
const getDarkModeCursorStyle = () => `
  .magnifying-glass-cursor {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><circle cx="11" cy="11" r="3" stroke="rgba(255,255,255,0.3)"></circle></svg>') 16 16, zoom-in;
  }
`;

const getLightModeCursorStyle = () => `
  .magnifying-glass-cursor {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><circle cx="11" cy="11" r="3" stroke="rgba(0,0,0,0.3)"></circle></svg>') 16 16, zoom-in;
  }
`;

interface Node {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  opacity: number;
  pulsePhase: number;
  connections: string[];
  velocity: { x: number; y: number; z: number };
}

interface Connection {
  from: string;
  to: string;
  opacity: number;
  animationPhase: number;
}

interface ParallaxLayer {
  nodes: Node[];
  connections: Connection[];
  speed: number;
  depth: number;
}

interface NetworkHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  nodeColors?: string[];
  lightNodeColors?: string[];
  connectionColor?: string;
  lightConnectionColor?: string;
  backgroundColor?: string;
  lightBackgroundColor?: string;
  gradientColors?: string[];
  lightGradientColors?: string[];
  animationSpeed?: number;
  parallaxIntensity?: number;
  particleDensity?: number;
  maxDepthLevels?: number;
  enableInteraction?: boolean;
  enableParallax?: boolean;
  className?: string;
}

// Inserir o estilo do cursor no documento
const injectStyle = (style: string) => {
  if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
    return styleElement;
  }
  return null;
};

const NetworkHero: React.FC<NetworkHeroProps> = ({
  title = "Dive Into the Network",
  subtitle = "Explore the interconnected web of possibilities",
  ctaText = "Get Started",
  onCtaClick = () => console.log('CTA clicked'),
  nodeColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  lightNodeColors = ['#1d4ed8', '#7c3aed', '#0891b2', '#059669', '#d97706'],
  connectionColor = '#3b82f680',
  lightConnectionColor = '#3b82f650',
  backgroundColor = '#0f172a',
  lightBackgroundColor = '#f8fafc',
  gradientColors = ['#0f172a', '#1e293b', '#334155'],
  lightGradientColors = ['#f8fafc', '#f1f5f9', '#e2e8f0'],
  animationSpeed = 1,
  parallaxIntensity = 0.5,
  particleDensity = 50,
  maxDepthLevels = 5,
  enableInteraction = true,
  enableParallax = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);

  // Efeito de fade in quando o componente for carregado
  useEffect(() => {
    // Fade in do componente principal
    const componentTimer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    // Fade in do conteúdo com um pequeno atraso
    const contentTimer = setTimeout(() => {
      setIsContentVisible(true);
    }, 700);
    
    return () => {
      clearTimeout(componentTimer);
      clearTimeout(contentTimer);
    };
  }, []);
  
  // Efeito para atualizar o cursor quando o tema mudar
  useEffect(() => {
    // Injetar o estilo do cursor personalizado baseado no tema atual
    const styleElement = injectStyle(isDarkMode ? getDarkModeCursorStyle() : getLightModeCursorStyle());
    
    return () => {
      // Limpar estilo ao desmontar o componente
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isDarkMode]);

  // Detectar tema atual
  useEffect(() => {
    // Verificar tema inicial
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Verificar no carregamento inicial
    checkTheme();

    // Configurar um observer para detectar mudanças na classe 'dark' no HTML
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Cores baseadas no tema atual
  const currentNodeColors = useMemo(() => {
    return isDarkMode ? nodeColors : lightNodeColors;
  }, [isDarkMode, nodeColors, lightNodeColors]);

  const currentConnectionColor = useMemo(() => {
    return isDarkMode ? connectionColor : lightConnectionColor;
  }, [isDarkMode, connectionColor, lightConnectionColor]);

  const currentBackgroundColor = useMemo(() => {
    return isDarkMode ? backgroundColor : lightBackgroundColor;
  }, [isDarkMode, backgroundColor, lightBackgroundColor]);

  const currentGradientColors = useMemo(() => {
    return isDarkMode ? gradientColors : lightGradientColors;
  }, [isDarkMode, gradientColors, lightGradientColors]);

  const layers = useMemo<ParallaxLayer[]>(() => {
    const createNode = (layerIndex: number): Node => {
      const id = `${layerIndex}-${Math.random().toString(36).substring(2, 11)}`;
      return {
        id,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: layerIndex * 20 + Math.random() * 20,
        size: Math.random() * 3 + 1,
        color: currentNodeColors[Math.floor(Math.random() * currentNodeColors.length)],
        opacity: Math.random() * 0.8 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
        connections: [],
        velocity: {
          x: (Math.random() - 0.5) * 0.1,
          y: (Math.random() - 0.5) * 0.1,
          z: (Math.random() - 0.5) * 0.05
        }
      };
    };

    const createConnections = (nodes: Node[]): Connection[] => {
      const connections: Connection[] = [];
      nodes.forEach((node, i) => {
        const connectionCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < connectionCount; j++) {
          const targetIndex = Math.floor(Math.random() * nodes.length);
          if (targetIndex !== i) {
            const target = nodes[targetIndex];
            const distance = Math.sqrt(
              Math.pow(node.x - target.x, 2) + 
              Math.pow(node.y - target.y, 2)
            );
            if (distance < 30) {
              connections.push({
                from: node.id,
                to: target.id,
                opacity: Math.random() * 0.6 + 0.2,
                animationPhase: Math.random() * Math.PI * 2
              });
              node.connections.push(target.id);
            }
          }
        }
      });
      return connections;
    };

    return Array.from({ length: maxDepthLevels }, (_, i) => {
      const nodeCount = Math.floor(particleDensity * (1 - i * 0.1));
      const nodes = Array.from({ length: nodeCount }, () => createNode(i));
      const connections = createConnections(nodes);
      
      return {
        nodes,
        connections,
        speed: 1 - (i * 0.15),
        depth: i
      };
    });
  }, [currentNodeColors, particleDensity, maxDepthLevels]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    // Use modern way to add event listener
    try {
      // Modern browsers
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // Older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!enableParallax) return;
    scrollRef.current = window.scrollY;
  }, [enableParallax]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enableInteraction || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  }, [enableInteraction]);

  const findNodeAtPosition = useCallback((x: number, y: number): Node | null => {
    for (const layer of layers) {
      for (const node of layer.nodes) {
        const distance = Math.sqrt(
          Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
        );
        if (distance < node.size + 2) {
          return node;
        }
      }
    }
    return null;
  }, [layers]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableInteraction || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const clickedNode = findNodeAtPosition(x, y);
    if (clickedNode) {
      setHoveredNode(clickedNode.id);
      setTimeout(() => {
        setHoveredNode(null);
      }, 2000);
    }
  }, [enableInteraction, findNodeAtPosition]);

  const animate = useCallback((timestamp: number) => {
    if (!canvasRef.current || prefersReducedMotion) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    currentGradientColors.forEach((color, i) => {
      gradient.addColorStop(i / (currentGradientColors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const scrollOffset = enableParallax ? scrollRef.current * parallaxIntensity : 0;
    const time = timestamp * 0.001 * animationSpeed;

    layers.forEach((layer, layerIndex) => {
      const layerScrollOffset = scrollOffset * layer.speed;
      
      // Update node positions
      layer.nodes.forEach(node => {
        // Calculate mouse distance for slowdown effect
        const mouseDistance = Math.sqrt(
          Math.pow(mouseRef.current.x - node.x, 2) + 
          Math.pow(mouseRef.current.y - node.y, 2)
        );
        // Apply slowdown factor based on proximity to mouse
        const slowdownFactor = mouseDistance < 15 ? 
          Math.max(0.1, mouseDistance / 15) : 1; // Slow down to 10-100% speed when close to mouse
        
        // Apply velocity with slowdown
        node.x += node.velocity.x * slowdownFactor;
        node.y += node.velocity.y * slowdownFactor;
        node.z += node.velocity.z * slowdownFactor;
        
        // Wrap around edges
        if (node.x < -5) node.x = 105;
        if (node.x > 105) node.x = -5;
        if (node.y < -5) node.y = 105;
        if (node.y > 105) node.y = -5;
        
        // Pulse rate also slows down under mouse focus
        node.pulsePhase += 0.02 * slowdownFactor;
      });

      // Draw connections
      layer.connections.forEach(connection => {
        const fromNode = layer.nodes.find(n => n.id === connection.from);
        const toNode = layer.nodes.find(n => n.id === connection.to);
        
        if (fromNode && toNode) {
          const fromX = (fromNode.x / 100) * width;
          const fromY = ((fromNode.y + layerScrollOffset) / 100) * height;
          const toX = (toNode.x / 100) * width;
          const toY = ((toNode.y + layerScrollOffset) / 100) * height;
          
          connection.animationPhase += 0.01;
          const animatedOpacity = connection.opacity * 
            (0.5 + 0.5 * Math.sin(connection.animationPhase));
          
          const isConnectedToHovered = hoveredNode && 
            (connection.from === hoveredNode || connection.to === hoveredNode);
          
          ctx.strokeStyle = isConnectedToHovered 
            ? currentConnectionColor.replace('80', 'ff')
            : currentConnectionColor;
          ctx.globalAlpha = isConnectedToHovered ? 1 : animatedOpacity;
          ctx.lineWidth = isConnectedToHovered ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
        }
      });

      // Function to draw octagon
      const drawOctagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        const sides = 8;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides;
          const pointX = x + size * Math.cos(angle);
          const pointY = y + size * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(pointX, pointY);
          } else {
            ctx.lineTo(pointX, pointY);
          }
        }
        ctx.closePath();
        ctx.fill();
      };

      // Draw nodes
      layer.nodes.forEach(node => {
        const x = (node.x / 100) * width;
        const y = ((node.y + layerScrollOffset) / 100) * height;
        const pulseSize = node.size * (1 + 0.9 * Math.sin(node.pulsePhase));
        
        const isHovered = hoveredNode === node.id;
        const isConnected = hoveredNode && node.connections.includes(hoveredNode);
        
        // Mouse interaction
        const mouseDistance = Math.sqrt(
          Math.pow(mouseRef.current.x - node.x, 2) + 
          Math.pow(mouseRef.current.y - node.y, 2)
        );
        const mouseEffect = Math.max(0, 1.5 - mouseDistance / 20);
        
        const finalSize = pulseSize * (1 + mouseEffect * 3);
        const finalOpacity = node.opacity * (1 + mouseEffect * 0.3);
        
        // Glow effect
        if (isHovered || isConnected || mouseEffect > 0) {
          const glowSize = finalSize * 3;
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
          glowGradient.addColorStop(0, node.color + '40');
          glowGradient.addColorStop(1, node.color + '00');
          ctx.fillStyle = glowGradient;
          ctx.globalAlpha = 0.6;
          // Mantém o efeito de brilho como um círculo
          ctx.beginPath();
          ctx.arc(x, y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Main node as octagon
        ctx.fillStyle = node.color;
        ctx.globalAlpha = finalOpacity;
        drawOctagon(ctx, x, y, finalSize);
        
        // Inner highlight as octagon
        ctx.fillStyle = isDarkMode ? '#ffffff40' : '#ffffff80';
        ctx.globalAlpha = finalOpacity * 0.8;
        drawOctagon(ctx, x - finalSize * 0.3, y - finalSize * 0.3, finalSize * 0.4);
      });
    });

    ctx.globalAlpha = 1;
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [
    layers, 
    isPlaying, 
    hoveredNode, 
    enableParallax, 
    parallaxIntensity, 
    animationSpeed, 
    currentConnectionColor, 
    currentGradientColors,
    prefersReducedMotion,
    isDarkMode
  ]);

  // Reiniciar a animação quando o tema mudar
  useEffect(() => {
    if (isPlaying && !prefersReducedMotion) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isDarkMode, animate, isPlaying, prefersReducedMotion]);

  useEffect(() => {
    if (isPlaying && !prefersReducedMotion) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isPlaying, prefersReducedMotion]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleScroll, handleMouseMove]);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  const textColorClass = isDarkMode ? 'text-white' : 'text-gray-800';
  const buttonColorClass = isDarkMode 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white';
  const outlineButtonClass = isDarkMode
    ? 'border-white/20 text-white hover:bg-white/10'
    : 'border-gray-400/40 text-gray-800 hover:bg-gray-200/20';

  // Estilo personalizado para o cursor
  const cursorStyle = enableInteraction ? {
    cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>') 12 12, zoom-in`
  } : {};

  return (
    <motion.div 
      ref={containerRef}
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{ 
        backgroundColor: currentBackgroundColor,
        ...cursorStyle
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full magnifying-glass-cursor"
        onClick={handleCanvasClick}
      />
      
      {/* Overlay Content */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isContentVisible ? 1 : 0, y: isContentVisible ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Ornamento nórdico superior */}
          <div className="flex justify-center mb-2">
            <div className={`h-1 w-16 ${isDarkMode ? 'bg-blue-400/50' : 'bg-blue-600/50'}`}></div>
            <div className={`h-1 w-8 mx-1 ${isDarkMode ? 'bg-indigo-400/50' : 'bg-indigo-600/50'}`}></div>
            <div className={`h-1 w-16 ${isDarkMode ? 'bg-blue-400/50' : 'bg-blue-600/50'}`}></div>
          </div>
          
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold ${textColorClass} leading-tight`}>
            {/* Símbolo nórdico esquerdo */}
            <span className="hidden md:inline-block mx-2 text-3xl align-middle opacity-70">&#9733;</span>
            
            <span 
              className="font-nordic tracking-wider text-5xl md:text-7xl lg:text-8xl block mb-2 relative" 
              style={{ 
                textShadow: isDarkMode 
                  ? '0 0 10px rgba(96, 165, 250, 0.5), 0 0 20px rgba(96, 165, 250, 0.3)' 
                  : '0 0 10px rgba(30, 64, 175, 0.4), 0 0 20px rgba(30, 64, 175, 0.2)',
                WebkitTextStroke: isDarkMode ? '1px rgba(255, 255, 255, 0.15)' : '1px rgba(0, 0, 0, 0.1)',
                animation: 'pulse 3s infinite ease-in-out'
              }}
            >
              {title}
              <span 
                className="absolute inset-0 block"
                style={{
                  backgroundImage: isDarkMode 
                    ? 'linear-gradient(45deg, transparent 45%, rgba(96, 165, 250, 0.5) 50%, transparent 55%)' 
                    : 'linear-gradient(45deg, transparent 45%, rgba(30, 64, 175, 0.3) 50%, transparent 55%)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: '0% 0%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shine 3s infinite linear',
                  opacity: 0.8
                }}
              >
                {title}
              </span>
            </span>
            
            {/* Símbolo nórdico direito */}
            <span className="hidden md:inline-block mx-2 text-3xl align-middle opacity-70">&#9733;</span>
          </h1>
          
          {/* Ornamento nórdico inferior */}
          <div className="flex justify-center mb-6">
            <div className={`h-0.5 w-20 ${isDarkMode ? 'bg-blue-400/40' : 'bg-blue-600/40'}`}></div>
            <div className={`h-0.5 w-10 mx-1 ${isDarkMode ? 'bg-indigo-400/40' : 'bg-indigo-600/40'}`}></div>
            <div className={`h-0.5 w-20 ${isDarkMode ? 'bg-blue-400/40' : 'bg-blue-600/40'}`}></div>
          </div>
          
          <p className={`text-lg md:text-xl lg:text-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-2xl mx-auto leading-relaxed`}>
            {subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onCtaClick}
              size="lg"
              className={`${buttonColorClass} px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105`}
            >
              {ctaText}
            </Button>
            
            <Button
              onClick={toggleAnimation}
              variant="outline"
              size="lg"
              className={`${outlineButtonClass} px-6 py-3`}
            >
              {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPlaying ? 'Tô tonto' : 'Mete marcha'}
            </Button>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: isContentVisible ? 1 : 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{ translateX: "-50%" }}
        >
          <ChevronDown className={`w-8 h-8 animate-bounce ${isDarkMode ? 'text-white/60' : 'text-gray-800/60'}`} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default NetworkHero;
