"use client";

import { useState, useCallback, useEffect } from "react";
import { D3Node, D3Link } from "@/types/graph";

interface UseGraphSelectionProps {
  onNodeSelected?: (node: D3Node | null) => void;
  onRelationshipSelected?: (relationship: D3Link | null) => void;
  getConnectedNodeIds?: (nodeId: number) => number[];
}

/**
 * Hook para gerenciar estado de seleção de nós e relacionamentos
 * 
 * Este hook é responsável por:
 * 1. Manter estado de nó selecionado
 * 2. Manter estado de relacionamento selecionado
 * 3. Rastrear nós conectados ao nó selecionado
 * 4. Gerenciar modo de visualização (padrão, busca, seleção)
 * 5. Propagar eventos de seleção para callbacks externos
 */
export function useGraphSelection({
  onNodeSelected,
  onRelationshipSelected,
  getConnectedNodeIds = () => []
}: UseGraphSelectionProps = {}) {
  // Estado de seleção
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<D3Link | null>(null);
  const [connectedNodes, setConnectedNodes] = useState<number[]>([]);
  
  // Estado de visualização
  const [viewMode, setViewMode] = useState<"standard" | "search" | "selection">("standard");
  
  // Estado de edição
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  // Gerenciar nós conectados quando o nó selecionado muda
  useEffect(() => {
    if (selectedNode) {
      const connected = getConnectedNodeIds(selectedNode.id);
      setConnectedNodes(connected);
    } else {
      setConnectedNodes([]);
    }
  }, [selectedNode, getConnectedNodeIds]);
  
  // Propagar eventos de seleção para callbacks externos
  useEffect(() => {
    if (onNodeSelected) {
      onNodeSelected(selectedNode);
    }
  }, [selectedNode, onNodeSelected]);
  
  useEffect(() => {
    if (onRelationshipSelected) {
      onRelationshipSelected(selectedRelationship);
    }
  }, [selectedRelationship, onRelationshipSelected]);
  
  // Atualizar modo de visualização quando a seleção muda
  useEffect(() => {
    if (selectedNode || selectedRelationship) {
      setViewMode("selection");
    } else {
      setViewMode("standard");
    }
  }, [selectedNode, selectedRelationship]);
  
  // Handler para selecionar um nó
  const selectNode = useCallback((node: D3Node | null) => {
    // Se o mesmo nó já estiver selecionado, não fazer nada
    if (selectedNode && node && selectedNode.id === node.id) return;
    
    // Limpar seleção de relacionamento
    setSelectedRelationship(null);
    setIsEditingRelationship(false);
    
    // Atualizar nó selecionado
    setSelectedNode(node);
    
    // Limpar estado de edição
    setIsEditing(false);
    setFormChanged(false);
    
    // Atualizar modo de visualização
    if (node) {
      setViewMode("selection");
    } else {
      setViewMode("standard");
    }
  }, [selectedNode]);
  
  // Handler para selecionar um relacionamento
  const selectRelationship = useCallback((relationship: D3Link | null) => {
    // Se o mesmo relacionamento já estiver selecionado, não fazer nada
    if (selectedRelationship && relationship && selectedRelationship.id === relationship.id) return;
    
    // Limpar seleção de nó
    setSelectedNode(null);
    setConnectedNodes([]);
    setIsEditing(false);
    
    // Atualizar relacionamento selecionado
    setSelectedRelationship(relationship);
    
    // Limpar estado de edição
    setIsEditingRelationship(false);
    setFormChanged(false);
    
    // Atualizar modo de visualização
    if (relationship) {
      setViewMode("selection");
    } else {
      setViewMode("standard");
    }
  }, [selectedRelationship]);
  
  // Handler para limpar todas as seleções
  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedRelationship(null);
    setConnectedNodes([]);
    setIsEditing(false);
    setIsEditingRelationship(false);
    setFormChanged(false);
    setViewMode("standard");
  }, []);
  
  // Handler para alternar para modo de edição
  const startEditing = useCallback(() => {
    if (selectedNode) {
      setIsEditing(true);
    } else if (selectedRelationship) {
      setIsEditingRelationship(true);
    }
  }, [selectedNode, selectedRelationship]);
  
  // Handler para cancelar edição
  const cancelEditing = useCallback(() => {
    if (formChanged) {
      setShowExitConfirmation(true);
    } else {
      setIsEditing(false);
      setIsEditingRelationship(false);
      setFormChanged(false);
    }
  }, [formChanged]);
  
  // Handler para confirmar saída sem salvar
  const confirmExit = useCallback(() => {
    setIsEditing(false);
    setIsEditingRelationship(false);
    setFormChanged(false);
    setShowExitConfirmation(false);
  }, []);
  
  return {
    // Estado de seleção
    selectedNode,
    selectedRelationship,
    connectedNodes,
    
    // Handlers de seleção
    selectNode,
    selectRelationship,
    setConnectedNodes,
    clearSelection,
    
    // Estado de visualização
    viewMode,
    setViewMode,
    
    // Estado de edição
    isEditing,
    isEditingRelationship,
    formChanged,
    showExitConfirmation,
    
    // Handlers de edição
    setIsEditing,
    setIsEditingRelationship,
    setFormChanged,
    startEditing,
    cancelEditing,
    confirmExit,
    setShowExitConfirmation
  };
} 