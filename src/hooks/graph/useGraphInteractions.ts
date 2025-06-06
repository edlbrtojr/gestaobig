"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { D3Node, D3Link } from "@/types/graph";

interface UseGraphInteractionsProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  simulationRef: React.RefObject<d3.Simulation<D3Node, D3Link> | null>;
  onNodeClick?: (node: D3Node) => void;
  onRelationshipClick?: (relationship: D3Link) => void;
  onBackgroundClick?: () => void;
  enableFisheye?: boolean;
  applyFisheyeDistortion?: (center: { x: number; y: number } | null) => void;
}

/**
 * Hook para gerenciar interatividade do grafo
 * 
 * Este hook é responsável por:
 * 1. Configurar comportamento de zoom e pan
 * 2. Gerenciar eventos de clique em nós, relacionamentos e fundo
 * 3. Implementar comportamento de arrastar nós
 * 4. Gerenciar efeito fisheye (lupa)
 */
export function useGraphInteractions({
  svgRef,
  simulationRef,
  onNodeClick,
  onRelationshipClick,
  onBackgroundClick,
  enableFisheye = false,
  applyFisheyeDistortion
}: UseGraphInteractionsProps) {
  // Referência para o zoom atual
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  // Referência para a última transformação de zoom
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  
  // Configurar zoom e pan
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    // Criar comportamento de zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        // Atualizar transformação
        transformRef.current = event.transform;
        
        // Aplicar transformação ao grupo principal
        const g = svg.select("g");
        if (g.size() > 0) {
          g.attr("transform", event.transform.toString());
        }
      });
    
    // Armazenar referência ao zoom
    zoomRef.current = zoom;
    
    // Aplicar zoom ao SVG
    svg.call(zoom as any);
    
    // Desabilitar zoom com duplo clique (será usado para reset)
    svg.on("dblclick.zoom", null);
    
    // Configurar duplo clique para reset de zoom
    svg.on("dblclick", () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    });
    
    // Configurar clique no fundo para limpar seleção
    svg.on("click", (event) => {
      // Verificar se o clique foi no fundo (SVG) e não em um elemento filho
      if (event.target === svgRef.current && onBackgroundClick) {
        onBackgroundClick();
      }
    });
    
    // Configurar evento de movimento do mouse para efeito fisheye
    svg.on("mousemove", (event) => {
      if (enableFisheye && applyFisheyeDistortion) {
        const [x, y] = d3.pointer(event);
        
        // Converter coordenadas para o espaço da simulação
        const transform = transformRef.current;
        const simX = (x - transform.x) / transform.k;
        const simY = (y - transform.y) / transform.k;
        
        applyFisheyeDistortion({ x: simX, y: simY });
      }
    });
    
    // Limpar eventos ao desmontar
    return () => {
      svg.on(".zoom", null);
      svg.on("dblclick", null);
      svg.on("click", null);
      svg.on("mousemove", null);
    };
  }, [svgRef, onBackgroundClick, enableFisheye, applyFisheyeDistortion]);
  
  // Configurar comportamento de arrastar nós
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const simulation = simulationRef.current;
    
    // Criar comportamento de arrastar
    const drag = d3.drag<SVGGElement, D3Node>()
      .clickDistance(5) // Permitir cliques com até 5 pixels de movimento
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    
    // Aplicar comportamento de arrastar aos nós
    svg.selectAll(".nodes g.node-element").call(drag as any);
    
    // Configurar cliques em nós
    svg.selectAll(".nodes g.node-element").on("click", (event, d) => {
      event.stopPropagation();
      if (onNodeClick) onNodeClick(d as D3Node);
    });
    
    // Configurar cliques em relacionamentos
    svg.selectAll(".links g.relationship-element").on("click", (event, d) => {
      event.stopPropagation();
      if (onRelationshipClick) onRelationshipClick(d as D3Link);
    });
    
    // Limpar eventos ao desmontar
    return () => {
      svg.selectAll(".nodes g.node-element").on(".drag", null);
      svg.selectAll(".nodes g.node-element").on("click", null);
      svg.selectAll(".links g.relationship-element").on("click", null);
    };
  }, [svgRef, simulationRef, onNodeClick, onRelationshipClick]);
  
  // Funções para controle de zoom
  const zoomIn = useCallback((scale: number = 1.5) => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    
    svg.transition()
      .duration(300)
      .call(zoom.scaleBy as any, scale);
  }, [svgRef]);
  
  const zoomOut = useCallback((scale: number = 0.75) => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    
    svg.transition()
      .duration(300)
      .call(zoom.scaleBy as any, scale);
  }, [svgRef]);
  
  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    
    svg.transition()
      .duration(500)
      .call(zoom.transform as any, d3.zoomIdentity);
  }, [svgRef]);
  
  // Função para centralizar em um nó específico
  const centerOnNode = useCallback((nodeId: number, scale: number = 1.5) => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const zoom = zoomRef.current;
    const nodeElement = svg.select(`.nodes g.node-element[data-id="${nodeId}"]`);
    
    if (nodeElement.empty()) return;
    
    // Obter posição do nó
    const transform = nodeElement.attr("transform");
    const match = transform?.match(/translate\(([^,]+),([^)]+)\)/);
    
    if (match) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      
      // Obter dimensões do SVG
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      // Calcular transformação para centralizar o nó
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Criar transformação
      const newTransform = d3.zoomIdentity
        .translate(centerX - x * scale, centerY - y * scale)
        .scale(scale);
      
      // Aplicar transformação com animação
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, newTransform);
    }
  }, [svgRef]);
  
  return {
    zoomIn,
    zoomOut,
    resetZoom,
    centerOnNode,
    currentTransform: transformRef.current
  };
} 