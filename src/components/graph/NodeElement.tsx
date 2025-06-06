"use client";

import { memo } from "react";
import { D3Node } from "@/types/graph";
import { useGraphContext } from "./GraphContext";

interface NodeElementProps {
  node: D3Node;
  onClick: (node: D3Node) => void;
  isSelected: boolean;
  isConnected: boolean;
  isHighlighted: boolean;
  radius: number;
  labelText?: string;
}

/**
 * Componente para renderização de nós individuais no grafo
 * 
 * Este componente é responsável por:
 * 1. Renderizar círculos para representar nós
 * 2. Exibir rótulos de texto para os nós
 * 3. Aplicar estilos baseados no estado (selecionado, conectado, destacado)
 * 4. Lidar com eventos de clique
 */
export const NodeElement = memo(function NodeElement({
  node,
  onClick,
  isSelected,
  isConnected,
  isHighlighted,
  radius,
  labelText
}: NodeElementProps) {
  const { colors } = useGraphContext();
  
  // Obter cor do nó baseado no tipo
  const nodeColor = colors.nodeColors[node.label] || colors.defaultColor;
  
  // Calcular cor da borda baseada no estado
  const getBorderColor = () => {
    if (isSelected) return colors.getThemeColors().textColor;
    if (isConnected) return nodeColor;
    return nodeColor;
  };
  
  // Calcular opacidade baseada no estado
  const getOpacity = () => {
    if (isSelected) return 1;
    if (isConnected) return 0.8;
    if (isHighlighted) return 1;
    return isHighlighted ? 1 : 0.15;
  };
  
  // Calcular espessura da borda baseada no estado
  const getStrokeWidth = () => {
    if (isSelected) return 2.5;
    if (isConnected) return 1.5;
    return 1.5;
  };
  
  // Obter nome preferido do nó
  const getNodeName = () => {
    if (labelText) return labelText;
    
    return node.properties?.SIGLA || 
           node.properties?.sigla || 
           node.properties?.nome || 
           node.properties?.name || 
           `Node ${node.id}`;
  };
  
  // Calcular tamanho da fonte baseado no raio do nó
  const fontSize = Math.min(Math.max(radius * 0.3, 7), 10);
  
  // Calcular quantos caracteres cabem por linha
  const charsPerLine = Math.max(Math.floor((radius * 1.6) / (fontSize * 0.6)), 5);
  
  // Preparar nome para exibição
  const name = getNodeName();
  const displayName = () => {
    if (name.length <= charsPerLine) {
      return <tspan x={0} dy="0">{name}</tspan>;
    } else {
      const firstLine = name.substring(0, charsPerLine);
      let secondLine = "";
      
      if (name.length > charsPerLine * 2) {
        secondLine = name.substring(charsPerLine, charsPerLine * 2 - 3) + "...";
      } else {
        secondLine = name.substring(charsPerLine);
      }
      
      return (
        <>
          <tspan x={0} dy="-0.6em">{firstLine}</tspan>
          <tspan x={0} dy="1.2em">{secondLine}</tspan>
        </>
      );
    }
  };
  
  return (
    <g 
      className="node-element" 
      data-id={node.id}
      data-label={node.label}
      onClick={() => onClick(node)}
      style={{ cursor: "pointer" }}
    >
      {/* Círculo do nó */}
      <circle
        className="node-circle"
        r={radius}
        fill={nodeColor}
        stroke={getBorderColor()}
        strokeWidth={getStrokeWidth()}
        opacity={getOpacity()}
        style={{ 
          filter: "url(#node-shadow)",
          transition: "all 300ms ease-in-out"
        }}
      />
      
      {/* Texto do nome do nó */}
      <text
        className="node-name-text"
        dy={4}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={fontSize}
        opacity={getOpacity()}
        style={{ 
          filter: "url(#text-shadow)",
          fontWeight: "500",
          pointerEvents: "none",
          transition: "all 300ms ease-in-out"
        }}
      >
        {displayName()}
        <title>{name}</title>
      </text>
      
      {/* Texto do tipo do nó */}
      <text
        className="node-type-text"
        dy={radius + 14}
        textAnchor="middle"
        fill={colors.getThemeColors().mutedForegroundColor}
        fontSize="8px"
        fontStyle="italic"
        opacity={getOpacity()}
        style={{ 
          filter: "url(#text-shadow)",
          pointerEvents: "none",
          transition: "all 300ms ease-in-out"
        }}
      >
        {node.label || "Unknown"}
      </text>
    </g>
  );
}); 