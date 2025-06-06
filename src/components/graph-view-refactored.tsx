"use client";

import { useState } from "react";
import { Graph } from "./graph";
import { GraphData, D3Node, D3Link } from "@/types/graph";

/**
 * Componente wrapper que substitui o GraphView original com a implementação refatorada
 * 
 * Este componente mantém a mesma API do GraphView original para garantir compatibilidade
 * com o restante da aplicação, mas internamente usa a nova implementação modular.
 */
export default function GraphViewRefactored({
  data,
  searchTerm,
  onNodeSelected,
  onRelationshipSelected
}: {
  data: GraphData;
  searchTerm?: string;
  onNodeSelected?: (node: D3Node | null) => void;
  onRelationshipSelected?: (relationship: D3Link | null) => void;
}) {
  // Repassar todas as props para o novo componente Graph
  return (
    <div className="w-full h-full relative">
      <Graph
        data={data}
        searchTerm={searchTerm}
        onNodeSelected={onNodeSelected}
        onRelationshipSelected={onRelationshipSelected}
      />
    </div>
  );
} 