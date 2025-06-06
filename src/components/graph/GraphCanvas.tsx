"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useGraphContext } from "./GraphContext";
import { NodeElement } from "./NodeElement";
import { RelationshipElement } from "./RelationshipElement";
import { D3Node, D3Link } from "@/types/graph";

/**
 * Componente para renderização do canvas SVG principal do grafo
 * 
 * Este componente é responsável por:
 * 1. Renderizar o SVG principal
 * 2. Configurar zoom e pan
 * 3. Renderizar definições SVG (sombras, filtros, marcadores)
 * 4. Orquestrar a renderização de nós e relacionamentos
 */
export function GraphCanvas() {
  const { 
    svgRef, 
    simulationRef,
    processedData,
    nodeMap,
    selection,
    setSelectedNode,
    setSelectedRelationship,
    setConnectedNodes,
    view,
    setViewMode,
    colors,
    getNodeRadius
  } = useGraphContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  
  // Configurar dimensões do canvas
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Configurar zoom e pan
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        const newTransform = event.transform;
        setTransform(newTransform);
      });
    
    svg.call(zoom as any);
    
    // Função para resetar o zoom
    const handleDoubleClick = () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    };
    
    svg.on("dblclick.zoom", null);
    svg.on("dblclick", handleDoubleClick);
    
    return () => {
      svg.on(".zoom", null);
      svg.on("dblclick", null);
    };
  }, [svgRef]);
  
  // Lidar com clique no fundo do SVG para limpar seleção
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Evitar propagação se o clique for em um elemento filho
    if (e.target !== e.currentTarget) return;
    
    // Limpar seleção
    setSelectedNode(null);
    setSelectedRelationship(null);
    setConnectedNodes([]);
    
    // Atualizar modo de visualização
    if (view.viewMode === "selection") {
      setViewMode("standard");
    }
  };
  
  // Lidar com clique em um nó
  const handleNodeClick = (node: D3Node) => {
    // Limpar seleção de relacionamento
    setSelectedRelationship(null);
    
    // Definir nó selecionado
    setSelectedNode(node);
    
    // Encontrar nós conectados
    const connectedNodeIds = getConnectedNodeIds(node.id);
    setConnectedNodes(connectedNodeIds);
    
    // Atualizar modo de visualização
    setViewMode("selection");
  };
  
  // Lidar com clique em um relacionamento
  const handleRelationshipClick = (relationship: D3Link) => {
    // Limpar seleção de nó
    setSelectedNode(null);
    setConnectedNodes([]);
    
    // Definir relacionamento selecionado
    setSelectedRelationship(relationship);
    
    // Atualizar modo de visualização
    setViewMode("selection");
  };
  
  // Encontrar nós conectados a um nó específico
  const getConnectedNodeIds = (nodeId: number): number[] => {
    if (!processedData) return [];
    
    const connected = new Set<number>();
    
    processedData.relationships.forEach((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : Number(link.source);
      const targetId = typeof link.target === "object" ? link.target.id : Number(link.target);
      
      if (sourceId === nodeId) connected.add(targetId);
      else if (targetId === nodeId) connected.add(sourceId);
    });
    
    return Array.from(connected);
  };
  
  // Verificar se um nó está conectado ao nó selecionado
  const isConnectedNode = (nodeId: number): boolean => {
    return selection.connectedNodes.includes(nodeId);
  };
  
  // Verificar se um nó está destacado na busca
  const isHighlightedNode = (nodeId: number): boolean => {
    // Implementar lógica de busca aqui
    return false;
  };
  
  // Encontrar a propriedade principal marcada como isPrimaryLabel
  const getNodeLabelText = (node: D3Node): string => {
    // Verificar se há uma propriedade marcada como isPrimaryLabel
    const primaryProperty = Object.entries(node.properties).find(([key, value]) => {
      // Verificar se temos um nodeMap auxiliar para rótulos (não é o nodeMap por ID)
      // Como o nodeMap é por ID e node.label é string, não podemos usá-los diretamente
      // Precisamos verificar de outra forma, ou adaptar a estrutura de dados

      // Verificação simplificada - procurar por propriedade marcada no schema
      return key === 'nome' || key === 'name'; // Implementação temporária simplificada
    });

    // Se encontrou uma propriedade marcada como principal, use seu valor
    if (primaryProperty) {
      return String(primaryProperty[1]);
    }

    // Fallback para o comportamento padrão: usar a propriedade 'nome' ou o primeiro valor não vazio
    if (node.properties.nome) {
      return node.properties.nome;
    }

    // Busca qualquer propriedade não vazia
    for (const [key, value] of Object.entries(node.properties)) {
      if (value && key !== 'id') {
        return String(value);
      }
    }

    // Último recurso: usar o ID do nó
    return `Node ${node.id}`;
  };
  
  if (!processedData) return null;
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden"
      onClick={handleBackgroundClick}
    >
      <svg
        ref={svgRef}
        className="w-full h-full bg-transparent text-foreground"
        style={{
          cursor: "grab",
          touchAction: "none"
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Definições SVG */}
        <defs>
          {/* Filtro de sombra para nós */}
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
            <feOffset in="blur" dx="0" dy="1" result="offsetBlur" />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Filtro de sombra para texto */}
          <filter id="text-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodOpacity="0.5" floodColor="#000000" />
          </filter>
          
          {/* Marcador de seta para relacionamentos */}
          <marker
            id="arrow"
            viewBox="0 -5 17 17"
            refX="15"
            refY="0"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path
              fill={colors.getThemeColors().textColor}
              d="M0,-5L10,0L0,5Z"
            />
          </marker>
        </defs>
        
        {/* Grupo principal com transformação de zoom */}
        <g transform={transform.toString()}>
          {/* Grupo de relacionamentos */}
          <g className="links">
            {processedData.relationships.map((relationship) => (
              <RelationshipElement
                key={`rel-${relationship.id}`}
                relationship={relationship}
                onClick={handleRelationshipClick}
                isSelected={selection.selectedRelationship?.id === relationship.id}
                getNodeRadius={getNodeRadius}
                nodeMap={nodeMap}
              />
            ))}
          </g>
          
          {/* Grupo de nós */}
          <g className="nodes">
            {processedData.nodes.map((node) => (
              <NodeElement
                key={`node-${node.id}`}
                node={node}
                radius={typeof getNodeRadius === 'function' ? getNodeRadius(node.id) : 20}
                onClick={() => handleNodeClick(node)}
                isSelected={selection.selectedNode?.id === node.id}
                isConnected={isConnectedNode(node.id)}
                isHighlighted={isHighlightedNode(node.id)}
                labelText={getNodeLabelText(node)}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
} 