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
  // Log inicial dos dados recebidos
  console.log(`NodeElement recebeu node ${node.id}:`, {
    id: node.id,
    label: node.label,
    labels: node.labels,
    allLabels: node.allLabels,
    properties: node.properties
  });
  
  // Obter o contexto do grafo para cores, tema e seleção
  const { colors, nodePriorities } = useGraphContext();
  
  // Obter cor do nó baseado no tipo e prioridades
  const getNodeColor = () => {
    console.log(`[Node ${node.id}] Label: ${node.label}, allLabels:`, node.allLabels);
    console.log(`[Node ${node.id}] nodePriorities:`, nodePriorities);
    
    // Verificar se temos múltiplos labels disponíveis (podem estar em labels ou allLabels)
    const multiLabels = node.allLabels || node.labels;
    
    // Se o nó tem múltiplos labels, usar prioridades
    if (multiLabels && Array.isArray(multiLabels) && multiLabels.length > 0) {
      console.log(`[Node ${node.id}] Tem múltiplos labels:`, multiLabels);
      
      // Verificar se temos prioridades definidas
      if (nodePriorities && nodePriorities.length > 0) {
        // Percorrer a lista de prioridades em ordem
        for (const priorityLabel of nodePriorities) {
          // Verificar se o nó possui este label
          if (multiLabels.includes(priorityLabel)) {
            const color = colors.nodeColors[priorityLabel];
            console.log(`[Node ${node.id}] Usando cor de label prioritário ${priorityLabel}:`, color);
            return color || colors.defaultColor;
          }
        }
      }
      
      // Se não encontrar nas prioridades ou não tiver prioridades definidas, usar o primeiro label
      const firstLabel = multiLabels[0];
      const color = colors.nodeColors[firstLabel];
      console.log(`[Node ${node.id}] Usando cor do primeiro label ${firstLabel}:`, color);
      return color || colors.defaultColor;
    }
    
    // Caso normal - sem múltiplos labels
    const color = colors.nodeColors[node.label];
    console.log(`[Node ${node.id}] Usando cor do label único ${node.label}:`, color);
    return color || colors.defaultColor;
  };
  
  const nodeColor = getNodeColor();
  
  // Cores baseadas no tema
  const { textColor, nodeBorderColor } = colors.getThemeColors();
  
  // Estados de opacidade baseados na seleção e conexão
  let fillOpacity = 0.7; // Aumentar opacidade default para melhor visibilidade
  let strokeOpacity = 0.5;
  
  if (isSelected) {
    fillOpacity = 1;
    strokeOpacity = 1;
  } else if (isConnected) {
    fillOpacity = 0.9;
    strokeOpacity = 0.7;
  }
  
  // Calcular tamanho do texto baseado no raio
  const fontSize = Math.max(10, Math.min(radius * 0.6, 16));
  
  return (
    <g
      className="node-element"
      data-id={node.id}
      transform={`translate(${node.x || 0},${node.y || 0})`}
      style={{ cursor: "pointer" }}
    >
      {/* Círculo principal do nó */}
      <circle
        className="node-circle"
        r={radius}
        fill={nodeColor}
        fillOpacity={fillOpacity}
        stroke={isSelected ? textColor : nodeBorderColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeOpacity={strokeOpacity}
        filter={isSelected ? "url(#node-shadow)" : undefined}
        onClick={() => onClick(node)}
      />
      
      {/* Rótulo de texto do nó */}
      <text
        className="node-label"
        textAnchor="middle"
        dy="0.3em"
        fill={textColor}
        fontSize={fontSize}
        fontWeight={isSelected ? "bold" : "normal"}
        pointerEvents="none"
        opacity={isSelected ? 1 : 0.9}
        filter={isSelected ? "url(#text-shadow)" : undefined}
      >
        {labelText && labelText.length > 12 ? `${labelText.substring(0, 12)}...` : labelText}
      </text>
    </g>
  );
}); 