"use client";

import { memo } from "react";
import { D3Node, D3Link } from "@/types/graph";
import { useGraphContext } from "./GraphContext";

interface RelationshipElementProps {
  relationship: D3Link;
  onClick: (relationship: D3Link) => void;
  isSelected: boolean;
  getNodeRadius: (nodeId: number) => number;
  nodeMap: Map<number, D3Node>;
}

/**
 * Componente para renderização de relacionamentos individuais no grafo
 * 
 * Este componente é responsável por:
 * 1. Renderizar linhas para representar relacionamentos
 * 2. Exibir rótulos de texto para os relacionamentos
 * 3. Aplicar estilos baseados no estado (selecionado)
 * 4. Lidar com eventos de clique
 */
export const RelationshipElement = memo(function RelationshipElement({
  relationship,
  onClick,
  isSelected,
  getNodeRadius,
  nodeMap
}: RelationshipElementProps) {
  const { colors } = useGraphContext();
  const { textColor, linkColor } = colors.getThemeColors();
  
  // Extrair IDs de origem e destino
  const sourceId = typeof relationship.source === "object" 
    ? relationship.source.id 
    : Number(relationship.source);
    
  const targetId = typeof relationship.target === "object" 
    ? relationship.target.id 
    : Number(relationship.target);
  
  // Obter nós de origem e destino
  const sourceNode = nodeMap.get(sourceId);
  const targetNode = nodeMap.get(targetId);
  
  // Se não encontrar os nós, não renderizar
  if (!sourceNode || !targetNode) return null;
  
  // Calcular posições de início e fim da linha
  const sourceX = sourceNode.x || 0;
  const sourceY = sourceNode.y || 0;
  const targetX = targetNode.x || 0;
  const targetY = targetNode.y || 0;
  
  // Calcular raios dos nós
  const sourceRadius = getNodeRadius(sourceId);
  const targetRadius = getNodeRadius(targetId);
  
  // Calcular ângulos para ajustar as linhas para começar nas bordas dos círculos
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx);
  
  // Calcular pontos de início e fim da linha
  const x1 = sourceX + sourceRadius * Math.cos(angle);
  const y1 = sourceY + sourceRadius * Math.sin(angle);
  const x2 = targetX - targetRadius * Math.cos(angle);
  const y2 = targetY - targetRadius * Math.sin(angle);
  
  // Calcular posição do texto (ponto médio)
  const textX = (sourceX + targetX) / 2;
  const textY = (sourceY + targetY) / 2;
  
  // Calcular cor e opacidade baseadas no estado
  const getStrokeColor = () => isSelected ? textColor : linkColor;
  const getStrokeOpacity = () => isSelected ? 1 : 0.6;
  const getStrokeWidth = () => isSelected ? 2.5 : 1.5;
  const getTextOpacity = () => isSelected ? 1 : 0.8;
  const getFontWeight = () => isSelected ? "bold" : "normal";
  
  return (
    <g 
      className="relationship-element" 
      data-id={relationship.id}
      data-type={relationship.type}
      style={{ cursor: "pointer" }}
    >
      {/* Linha do relacionamento */}
      <line
        className="relationship-line"
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={getStrokeColor()}
        strokeOpacity={getStrokeOpacity()}
        strokeWidth={getStrokeWidth()}
        markerEnd="url(#arrow)"
        onClick={() => onClick(relationship)}
        style={{ transition: "all 300ms ease-in-out" }}
      />
      
      {/* Texto do tipo de relacionamento */}
      <text
        className="relationship-text"
        x={textX}
        y={textY}
        dy="-7"
        textAnchor="middle"
        fill={textColor}
        fontSize="11px"
        fontWeight={getFontWeight()}
        opacity={getTextOpacity()}
        onClick={() => onClick(relationship)}
        style={{ 
          pointerEvents: "all",
          transition: "all 300ms ease-in-out"
        }}
      >
        {relationship.type}
      </text>
    </g>
  );
}); 