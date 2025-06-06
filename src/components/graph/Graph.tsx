"use client";

import { GraphProvider } from "./GraphProvider";
import { GraphCanvas } from "./GraphCanvas";
import { GraphControls } from "./GraphControls";
import { NodeDetails } from "./NodeDetails";
import { RelationshipDetails } from "./RelationshipDetails";
import { useGraphContext } from "./GraphContext";
import { GraphData, D3Node, D3Link } from "@/types/graph";

interface GraphProps {
  data: GraphData;
  onNodeSelected?: (node: D3Node | null) => void;
  onRelationshipSelected?: (relationship: D3Link | null) => void;
  searchTerm?: string;
}

/**
 * Componente interno que renderiza o conteúdo do grafo usando o contexto
 */
function GraphContent() {
  const { 
    selection, 
    setSelectedNode, 
    setSelectedRelationship,
    setConnectedNodes
  } = useGraphContext();
  
  // Manipuladores de eventos para atualização de nós e relacionamentos
  const handleNodeUpdate = (updatedNode: D3Node) => {
    // Atualizar o nó no estado
    setSelectedNode(updatedNode);
  };
  
  const handleNodeDelete = (deletedNode: D3Node) => {
    // Limpar seleção após exclusão
    setSelectedNode(null);
    setConnectedNodes([]);
  };
  
  const handleRelationshipUpdate = (updatedRelationship: D3Link) => {
    // Atualizar o relacionamento no estado
    setSelectedRelationship(updatedRelationship);
  };
  
  const handleRelationshipDelete = (deletedRelationship: D3Link) => {
    // Limpar seleção após exclusão
    setSelectedRelationship(null);
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Canvas principal do grafo */}
      <GraphCanvas />
      
      {/* Controles de navegação e interação */}
      <GraphControls />
      
      {/* Painel de detalhes do nó selecionado */}
      {selection.selectedNode && (
        <NodeDetails
          node={selection.selectedNode}
          onClose={() => setSelectedNode(null)}
          onNodeUpdate={handleNodeUpdate}
          onNodeDelete={handleNodeDelete}
        />
      )}
      
      {/* Painel de detalhes do relacionamento selecionado */}
      {selection.selectedRelationship && !selection.selectedNode && (
        <RelationshipDetails
          relationship={selection.selectedRelationship}
          onClose={() => setSelectedRelationship(null)}
          onRelationshipUpdate={handleRelationshipUpdate}
          onRelationshipDelete={handleRelationshipDelete}
        />
      )}
    </div>
  );
}

/**
 * Componente principal do grafo que integra todos os componentes modulares
 * 
 * Este componente é responsável por:
 * 1. Fornecer o contexto do grafo através do GraphProvider
 * 2. Renderizar o canvas, controles e painéis de detalhes
 * 3. Gerenciar callbacks para eventos de seleção
 */
export function Graph({
  data,
  onNodeSelected,
  onRelationshipSelected,
  searchTerm
}: GraphProps) {
  return (
    <GraphProvider 
      data={data} 
      searchTerm={searchTerm}
      onNodeSelected={onNodeSelected}
      onRelationshipSelected={onRelationshipSelected}
    >
      <GraphContent />
    </GraphProvider>
  );
} 