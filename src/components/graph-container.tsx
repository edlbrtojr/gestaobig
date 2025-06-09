"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import GraphView from "./graph-view";
import { GraphData } from "@/types/graph";
import { Button } from "@/components/ui/button";
import { Expand, Shrink, SlidersHorizontal, X } from "lucide-react";
import { useTheme } from "./theme-provider";
import Image from "next/image";
import FilterControls, { FilterState } from "./filter-controls";

interface GraphContainerProps {
  data: GraphData;
  onNodeSelected?: (node: any) => void;
  onRelationshipSelected?: (relationship: any) => void;
  searchTerm?: string;
  onFilterChange?: (filters: FilterState) => void;
  nodePriorities?: string[]; // Prioridades de labels para nós com múltiplos tipos
}

// Using memo to prevent unnecessary re-renders when props haven't changed
const GraphContainer = memo(
  function GraphContainerInner({ 
    data, 
    onNodeSelected,
    onRelationshipSelected,
    searchTerm,
    onFilterChange,
    nodePriorities = [] 
  }: GraphContainerProps) {
    console.log("GraphContainer recebeu nodePriorities:", nodePriorities);
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [graphKey, setGraphKey] = useState(0); // Add a key to force remounting GraphView
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeRef = useRef<number>(0);
    const dotsRef = useRef<Array<{ baseX: number; baseY: number }>>([]);
    const { theme, setTheme } = useTheme();
    const [searchResults, setSearchResults] = useState<{count: number, term: string} | null>(null);
    const [noResultsMessage, setNoResultsMessage] = useState<string | null>(null);
    
    const lightLogo = "/images/logo-fieac-azul.png";
    const darkLogo = "/images/logo-Sitema%20fieac-branco.png";
    const orgName = "FIEAC";

    // Handle filter changes in fullscreen mode
    const handleFilterChange = (filters: FilterState) => {
      if (onFilterChange) {
        onFilterChange(filters);
      }
    };

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
      // Increment the key to force GraphView to remount completely
      setGraphKey(prev => prev + 1);
      
      setIsFullscreen((prev) => {
        const newValue = !prev;
        
        // Immediately adjust body and document style for responsive behavior
        if (newValue) {
          document.body.style.overflow = "hidden";
          document.documentElement.style.overflow = "hidden";
          document.body.style.position = "fixed";
          document.body.style.width = "100%";
          document.body.style.top = `-${window.scrollY}px`;
        } else {
          document.body.style.overflow = "";
          document.documentElement.style.overflow = "";
          document.body.style.position = "";
          document.body.style.width = "";
          const scrollY = document.body.style.top;
          document.body.style.top = "";
          if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
          }
        }
        
        return newValue;
      });
      
      // Reset isMounted to force a complete reinitialization of the component
      setIsMounted(false);
      
      // Add a slight delay to allow DOM updates and enforce proper dimensions
      setTimeout(() => {
        // When entering fullscreen mode
        if (!isFullscreen && fullscreenRef.current) {
          fullscreenRef.current.style.position = 'fixed';
          fullscreenRef.current.style.top = '0';
          fullscreenRef.current.style.left = '0';
          fullscreenRef.current.style.right = '0';
          fullscreenRef.current.style.bottom = '0';
          fullscreenRef.current.style.width = `${window.innerWidth}px`;
          fullscreenRef.current.style.height = `${window.innerHeight}px`;
          fullscreenRef.current.style.zIndex = '9999';
        }
        
        // Re-mount the component
        setIsMounted(true);
        
        // After a slight delay, force grid to redraw and reset dimensions
        setTimeout(() => {
          forceInitializeGrid();
          
          // When exiting fullscreen, ensure we resize properly and reset any explicit dimensions
          if (isFullscreen && fullscreenRef.current) {
            // Reset explicit dimensions to allow container to size naturally
            fullscreenRef.current.style.position = '';
            fullscreenRef.current.style.top = '';
            fullscreenRef.current.style.left = '';
            fullscreenRef.current.style.right = '';
            fullscreenRef.current.style.bottom = '';
            fullscreenRef.current.style.width = '';
            fullscreenRef.current.style.height = '';
            fullscreenRef.current.style.zIndex = '';
            
            // Force a redraw after dimensions are reset
            setTimeout(() => {
              forceInitializeGrid();
            }, 100);
          }
        }, 100);
      }, 50);
    }, [forceInitializeGrid, isFullscreen]);

    // Set mounted state and initialize grid immediately once DOM is ready
    useEffect(() => {
      setIsMounted(true);

      // Try to initialize immediately
      forceInitializeGrid();

      // Also try after a very short delay
      const immediateTimeout = setTimeout(forceInitializeGrid, 10);
      
      // Listen for search results count events
      const handleSearchResults = (event: CustomEvent) => {
        if (event.detail) {
          // If count is 0 or not provided, clear the search results display
          if (!event.detail.count) {
            setSearchResults(null);
            
            // If there's a search term but no results, show the no results message
            if (event.detail.term && event.detail.term.trim() !== '') {
              setNoResultsMessage(`Nenhum resultado encontrado para "${event.detail.term}"`);
            } else {
              setNoResultsMessage(null);
            }
            return;
          }
          
          setSearchResults({
            count: event.detail.count,
            term: event.detail.term
          });
          setNoResultsMessage(null);
        }
      };
      
      // Listen for clear search term events
      const handleClearSearch = () => {
        setSearchResults(null);
        setNoResultsMessage(null);
        
        // We shouldn't try to modify the filter state directly here
        // Instead dispatch an event that the parent component should listen for
        window.dispatchEvent(new CustomEvent('searchCleared', {}));
      };
      
      window.addEventListener('searchResultsCount', handleSearchResults as EventListener);
      window.addEventListener('clearSearchTerm', handleClearSearch as EventListener);
      
      return () => {
        clearTimeout(immediateTimeout);
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
        }
        window.removeEventListener('searchResultsCount', handleSearchResults as EventListener);
        window.removeEventListener('clearSearchTerm', handleClearSearch as EventListener);
      };
    }, [forceInitializeGrid, onFilterChange]);

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
        
        // Update fullscreen dimensions if active
        if (isFullscreen && fullscreenRef.current) {
          fullscreenRef.current.style.width = `${window.innerWidth}px`;
          fullscreenRef.current.style.height = `${window.innerHeight}px`;
        }
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

      // Create a handler for window resize
      const handleResize = () => {
        if (isFullscreen && fullscreenRef.current) {
          fullscreenRef.current.style.width = `${window.innerWidth}px`;
          fullscreenRef.current.style.height = `${window.innerHeight}px`;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", handleResize);

      // Handle body scroll locking
      if (isFullscreen) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
        document.body.style.top = `-${window.scrollY}px`;
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        const scrollY = document.body.style.top;
        document.body.style.top = "";
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", handleResize);
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = "";
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

    // Clear search results notification when search term changes to empty string
    useEffect(() => {
      if (!searchTerm) {
        setSearchResults(null);
        setNoResultsMessage(null);
      }
    }, [searchTerm]);

    return (
      <div
        ref={fullscreenRef}
        className={`relative ${
          isFullscreen 
            ? "fixed inset-0 z-[9999] w-screen h-screen bg-background" 
            : "w-full h-full"
        }`}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
        } : undefined}
      >
        <div
          ref={containerRef}
          className="relative flex w-full h-full overflow-hidden"
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

          {/* Organization Logo */}
          <div className="absolute bottom-3 right-3 z-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <Image
              src={lightLogo}
              alt={`${orgName} Logo`}
              width={120}
              height={40}
              className="h-auto object-contain dark:hidden"
              priority={false}
            />
            <Image
              src={darkLogo}
              alt={`${orgName} Logo`}
              width={120}
              height={40}
              className="hidden h-auto object-contain dark:block"
              priority={false}
            />
          </div>

          {/* Fullscreen toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-[10000]"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? (
              <Shrink className="w-5 h-5" />
            ) : (
              <Expand className="w-5 h-5" />
            )}
          </Button>

          {/* Search results notification */}
          {searchResults && (
            <div className="absolute top-2 left-2 z-50 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md py-2 px-3 shadow-sm transition-all duration-300 transform-gpu">
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {searchResults.count} resultado(s) para "{searchResults.term}"
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 w-6 p-0" 
                  onClick={() => {
                    // Clear local search results state
                    setSearchResults(null);
                    setNoResultsMessage(null);
                    
                    // Tell the graph to return to standard mode and clear highlighting
                    window.dispatchEvent(new CustomEvent('clearSearchTerm', {}));
                    
                    // Signal to remove search highlights
                    window.dispatchEvent(new CustomEvent('searchResultsCount', { 
                      detail: { count: 0, term: '' } 
                    }));
                    
                    // Dispatch event to notify parent components that search was cleared
                    window.dispatchEvent(new CustomEvent('searchCleared', {}));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* No results notification */}
          {noResultsMessage && !searchResults && (
            <div className="absolute top-2 left-2 z-50 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md py-2 px-3 shadow-sm transition-all duration-300 transform-gpu">
              <div className="flex items-center">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {noResultsMessage}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-6 w-6 p-0" 
                  onClick={() => {
                    // Clear the no results message
                    setNoResultsMessage(null);
                    
                    // Tell the graph to return to standard mode
                    window.dispatchEvent(new CustomEvent('clearSearchTerm', {}));
                    
                    // Dispatch event to notify parent components that search was cleared
                    window.dispatchEvent(new CustomEvent('searchCleared', {}));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="relative w-full h-full overflow-hidden">
            {data.nodes.length > 0 ? (
              <GraphView 
                data={data} 
                onNodeSelected={onNodeSelected} 
                onRelationshipSelected={onRelationshipSelected}
                searchHighlight={searchTerm}
                nodePriorities={nodePriorities}
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
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary rerenders
    // Only rerender if the data nodes or relationships actually changed
    // or if the search term changed or if node priorities changed
    
    // Verificar se as prioridades mudaram
    const prevPriorities = prevProps.nodePriorities || [];
    const nextPriorities = nextProps.nodePriorities || [];
    
    // Se o tamanho das prioridades for diferente, rerender
    if (prevPriorities.length !== nextPriorities.length) {
      return false;
    }
    
    // Se alguma prioridade mudou, rerender
    for (let i = 0; i < prevPriorities.length; i++) {
      if (prevPriorities[i] !== nextPriorities[i]) {
        return false;
      }
    }
    
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
