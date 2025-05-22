"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import GraphView from "./graph-view";
import { GraphData } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Expand, Shrink } from "lucide-react";
import { useTheme } from "./theme-provider";
import Image from "next/image";

interface GraphContainerProps {
  data: GraphData;
  onNodeSelected?: (node: any) => void;
  onRelationshipSelected?: (relationship: any) => void;
  searchTerm?: string;
}

// Using memo to prevent unnecessary re-renders when props haven't changed
const GraphContainer = memo(
  function GraphContainerInner({ 
    data, 
    onNodeSelected,
    onRelationshipSelected,
    searchTerm
  }: GraphContainerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeRef = useRef<number>(0);
    const dotsRef = useRef<Array<{ baseX: number; baseY: number }>>([]);
    const { theme } = useTheme();

    // Force immediate render of grid with default color
    const forceInitializeGrid = useCallback(() => {
      console.log("Force initializing grid");
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        console.log("Canvas or container not available");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.log("Context not available");
        return;
      }

      // Get dimensions from container
      const rect = container.getBoundingClientRect();
      canvas.width =
        Math.max(rect.width, container.clientWidth) || window.innerWidth;
      canvas.height =
        Math.max(rect.height, container.clientHeight) || window.innerHeight;

      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);

      // Define layout
      const spacing = 25;
      const dotSize = 1.2;
      const cols = Math.floor(canvas.width / spacing);
      const rows = Math.floor(canvas.height / spacing);
      const offsetX = (canvas.width - (cols - 1) * spacing) / 2;
      const offsetY = (canvas.height - (rows - 1) * spacing) / 2;

      // Default color based on document background
      const computedStyle = getComputedStyle(document.documentElement);
      const isDarkMode = computedStyle
        .getPropertyValue("--background")
        .trim()
        .startsWith("oklch(0.12");
      const dotColor = isDarkMode
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(0, 0, 0, 0.12)";

      console.log(`Using color: ${dotColor}, dark mode: ${isDarkMode}`);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = dotColor;

      // Draw static grid initially
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }, []);

    const toggleFullscreen = useCallback(() => {
      setIsFullscreen((prev) => !prev);
    }, []);

    // Set mounted state and initialize grid immediately once DOM is ready
    useEffect(() => {
      setIsMounted(true);

      // Try to initialize immediately
      forceInitializeGrid();

      // Also try after a very short delay
      const immediateTimeout = setTimeout(forceInitializeGrid, 10);

      // And another attempt slightly later to be sure
      const delayedTimeout = setTimeout(forceInitializeGrid, 100);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        clearTimeout(immediateTimeout);
        clearTimeout(delayedTimeout);
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
      };
    }, [forceInitializeGrid]);

    // Create a dotted grid background with subtle wave animation
    // This effect runs after initial rendering and handles the animated grid
    useEffect(() => {
      // Skip if not mounted yet
      if (!isMounted) return;

      console.log("Setting up animated grid, theme:", theme);

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Initialize grid parameters
      const spacing = 25; // Distance between dots
      const dotSize = 1.2; // Size of dots

      // Wave animation parameters
      const waveAmplitude = 1.5; // Very small amplitude
      const waveFrequency = 0.0015; // Very slow waves
      const waveSpeed = 0.0004; // Very slow movement

      const initializeDots = () => {
        // Force dimensions to be set correctly
        const rect = container.getBoundingClientRect();
        canvas.width =
          Math.max(rect.width, container.clientWidth) || window.innerWidth;
        canvas.height =
          Math.max(rect.height, container.clientHeight) || window.innerHeight;

        // Clear previous dots
        dotsRef.current = [];

        // Calculate grid dimensions
        const cols = Math.floor(canvas.width / spacing);
        const rows = Math.floor(canvas.height / spacing);

        // Center the grid in the canvas
        const offsetX = (canvas.width - (cols - 1) * spacing) / 2;
        const offsetY = (canvas.height - (rows - 1) * spacing) / 2;

        // Create dots at grid positions
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const baseX = offsetX + i * spacing;
            const baseY = offsetY + j * spacing;

            dotsRef.current.push({
              baseX,
              baseY,
            });
          }
        }

        console.log(`Initialized ${dotsRef.current.length} dots`);
      };

      const animateDots = (timestamp: number) => {
        if (!canvas || !ctx) return;

        // Update time reference
        if (!timeRef.current) {
          timeRef.current = timestamp;
        }

        // Calculate time delta for smooth animation regardless of framerate
        const currentTime = timestamp;
        
        // Simple frame rate limiting - only update every ~100ms (10fps)
        // This significantly reduces CPU usage while keeping animation smooth enough
        if (timestamp - timeRef.current < 100) {
          // Skip this frame if not enough time has passed
          animationRef.current = requestAnimationFrame(animateDots);
          return;
        }
        
        // Update time reference for frame limiting
        timeRef.current = timestamp;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set dot color based on theme - with safe fallback
        let dotColor = "rgba(0, 0, 0, 0.12)"; // Default light mode

        if (theme === "dark") {
          dotColor = "rgba(255, 255, 255, 0.12)";
        } else if (theme === "light") {
          dotColor = "rgba(0, 0, 0, 0.12)";
        } else {
          // Try to detect from CSS if theme is not explicitly known
          const computedStyle = getComputedStyle(document.documentElement);
          const isDarkMode = computedStyle
            .getPropertyValue("--background")
            .trim()
            .startsWith("oklch(0.12");
          dotColor = isDarkMode
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(0, 0, 0, 0.12)";
        }

        ctx.fillStyle = dotColor;

        // Draw each dot with slight wave offset
        dotsRef.current.forEach((dot) => {
          // Calculate wave offsets - very subtle movement
          // Each dot gets a slightly different wave based on position
          const xOffset =
            Math.sin(dot.baseX * waveFrequency + currentTime * waveSpeed) *
            waveAmplitude;
          const yOffset =
            Math.cos(dot.baseY * waveFrequency + currentTime * waveSpeed) *
            waveAmplitude;

          // Draw the dot with wave offset
          ctx.beginPath();
          ctx.arc(
            dot.baseX + xOffset,
            dot.baseY + yOffset,
            dotSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        // Continue animation loop
        animationRef.current = requestAnimationFrame(animateDots);
      };

      // Initialize and start animation with a slight delay to ensure container dimensions are ready
      const initializeAnimation = () => {
        // Cancel any existing animation frame
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        initializeDots();
        animationRef.current = requestAnimationFrame(animateDots);
      };

      // Initialize immediately
      initializeAnimation();

      // Also initialize after a short delay to ensure layout is complete
      initTimeoutRef.current = setTimeout(() => {
        initializeAnimation();
        initTimeoutRef.current = null;
      }, 50);

      // Handle window resizing
      const handleResize = debounce(() => {
        initializeDots();
      }, 250);

      window.addEventListener("resize", handleResize);

      // Reinitialize when fullscreen changes
      const fullscreenChangeTimeout = setTimeout(initializeAnimation, 100);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        clearTimeout(fullscreenChangeTimeout);
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
        timeRef.current = 0;
      };
    }, [theme, isFullscreen, isMounted]); // Depend on theme, fullscreen state and mounted state

    // Simple debounce function to prevent excessive resize calculations
    function debounce(fn: Function, ms: number) {
      let timer: NodeJS.Timeout | null = null;
      return (...args: any[]) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          fn(...args);
          timer = null;
        }, ms);
      };
    }

    // Add escape key listener to exit fullscreen mode
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isFullscreen) {
          setIsFullscreen(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      // Handle body scroll locking
      if (isFullscreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }, [isFullscreen]);

    // Adicionar um novo useEffect que reage às mudanças de tema
    useEffect(() => {
      if (!isMounted) return;

      // Breve timeout para garantir que as novas variáveis CSS estão aplicadas
      const updateGraphColors = setTimeout(() => {
        console.log("Theme changed, updating graph colors");

        // Force grid redraw with new theme colors
        forceInitializeGrid();

        // Reiniciar a animação dos pontos se necessário
        if (containerRef.current && canvasRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;

          // Limpar pontos existentes e reinicializar
          dotsRef.current = [];
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
          }

          // Redefinir o tempo de referência para evitar saltos na animação
          timeRef.current = 0;
        }
      }, 50);

      return () => clearTimeout(updateGraphColors);
    }, [theme, isMounted, forceInitializeGrid]);

    return (
      <div
        ref={containerRef}
        className={`relative flex w-full overflow-hidden ${
          isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"
        }`}
      >
        {/* Dotted grid background with subtle wave effect */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0 opacity-70 dark:opacity-50"
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {/* FIEAC Logo */}
        <div className="absolute bottom-3 right-3 z-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <Image
            src={
              theme === "dark"
                ? "/images/logo-fieac-branco.png"
                : "/images/logo-fieac-azul.png"
            }
            alt="FIEAC Logo"
            width={120}
            height={40}
            className="h-auto object-contain"
            priority={false}
          />
        </div>

        {/* Fullscreen toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Shrink className="w-5 h-5" />
          ) : (
            <Expand className="w-5 h-5" />
          )}
        </Button>

        <div className="relative w-full h-full overflow-hidden">
          {data.nodes.length > 0 ? (
            <GraphView 
              data={data} 
              onNodeSelected={onNodeSelected} 
              onRelationshipSelected={onRelationshipSelected}
              searchHighlight={searchTerm}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center p-6 max-w-md">
                <Image
                  src="/empty-graph.png"
                  width={150}
                  height={150}
                  alt="No data"
                  className="mx-auto mb-4 opacity-40"
                />
                <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Não há nós ou conexões para exibir. Adicione elementos ao grafo ou ajuste os filtros.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary rerenders
    // Only rerender if the data nodes or relationships actually changed
    // or if the search term changed
    return (
      prevProps.data.nodes.length === nextProps.data.nodes.length &&
      prevProps.data.relationships.length === nextProps.data.relationships.length &&
      prevProps.searchTerm === nextProps.searchTerm
    );
  }
);

// Add display name for debugging
GraphContainer.displayName = "GraphContainer";

export default GraphContainer;
