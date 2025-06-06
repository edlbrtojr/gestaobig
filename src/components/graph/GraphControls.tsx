"use client";

import { useRef } from "react";
import * as d3 from "d3";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Search, 
  Eye, 
  EyeOff, 
  Filter 
} from "lucide-react";
import { useGraphContext } from "./GraphContext";

/**
 * Componente para controles de navegação e interação com o grafo
 * 
 * Este componente é responsável por:
 * 1. Fornecer botões para zoom in/out e reset
 * 2. Fornecer controles para filtros e visualização
 * 3. Exibir informações sobre o grafo (contagem de nós/relacionamentos)
 */
export function GraphControls() {
  const { 
    svgRef, 
    processedData, 
    view, 
    setViewMode,
    setEnableFisheye
  } = useGraphContext();
  
  // Referência para o último zoom aplicado
  const lastZoomRef = useRef<d3.ZoomTransform | null>(null);
  
  // Funções para controle de zoom
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    
    svg.transition()
      .duration(300)
      .call(zoom.scaleBy as any, 1.5);
  };
  
  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    
    svg.transition()
      .duration(300)
      .call(zoom.scaleBy as any, 0.75);
  };
  
  const handleResetZoom = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    
    svg.transition()
      .duration(500)
      .call(zoom.transform as any, d3.zoomIdentity);
  };
  
  // Alternar efeito fisheye
  const toggleFisheye = () => {
    setEnableFisheye(!view.enableFisheye);
  };
  
  // Calcular contagem de nós e relacionamentos
  const nodeCount = processedData?.nodes.length || 0;
  const relationshipCount = processedData?.relationships.length || 0;
  
  return (
    <>
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleZoomIn}
          title="Ampliar"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleZoomOut}
          title="Reduzir"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="outline" 
          onClick={handleResetZoom}
          title="Centralizar"
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Controles de visualização */}
      <div className="absolute top-4 left-4 z-10 flex flex-row gap-2">
        <Button
          size="icon"
          variant={view.enableFisheye ? "default" : "outline"}
          onClick={toggleFisheye}
          title={view.enableFisheye ? "Desativar efeito lupa" : "Ativar efeito lupa"}
        >
          {view.enableFisheye ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Indicador de contagem de nós */}
      <div className="absolute bottom-4 right-4 bg-card p-2 rounded-md text-xs border border-border shadow-sm">
        <p className="text-muted-foreground">
          Visualizando: <span className="font-medium">{nodeCount}</span> nós e{' '}
          <span className="font-medium">{relationshipCount}</span> conexões
        </p>
      </div>
    </>
  );
} 