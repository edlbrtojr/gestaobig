"use client";

import { useState, useEffect, useMemo } from "react";
import { D3Node } from "@/types/graph";

interface UseGraphSearchProps {
  nodes: D3Node[];
  searchTerm?: string;
}

/**
 * Hook para gerenciar busca de nós no grafo
 * 
 * Este hook é responsável por:
 * 1. Filtrar nós com base no termo de busca
 * 2. Manter um conjunto de IDs de nós correspondentes
 * 3. Notificar sobre resultados da busca
 */
export function useGraphSearch({ nodes, searchTerm }: UseGraphSearchProps) {
  // Estado para armazenar IDs dos nós correspondentes à busca
  const [matchingNodeIds, setMatchingNodeIds] = useState<Set<number>>(new Set());
  
  // Memorizar resultados da busca
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      return {
        matchingNodes: [],
        matchingNodeIds: new Set<number>(),
        hasResults: false,
        resultCount: 0
      };
    }
    
    const term = searchTerm.toLowerCase().trim();
    const matching: D3Node[] = [];
    const matchingIds = new Set<number>();
    
    // Buscar em todas as propriedades dos nós
    nodes.forEach(node => {
      // Verificar nome do nó
      const nodeName = String(
        node.properties?.name || 
        node.properties?.nome || 
        node.properties?.SIGLA || 
        node.properties?.sigla || 
        ""
      ).toLowerCase();
      
      // Verificar tipo do nó
      const nodeType = String(node.label || "").toLowerCase();
      
      // Verificar outras propriedades
      let matchesInProps = false;
      if (node.properties) {
        for (const [key, value] of Object.entries(node.properties)) {
          if (String(value).toLowerCase().includes(term)) {
            matchesInProps = true;
            break;
          }
        }
      }
      
      // Se corresponder a qualquer critério, adicionar aos resultados
      if (nodeName.includes(term) || nodeType.includes(term) || matchesInProps) {
        matching.push(node);
        matchingIds.add(node.id);
      }
    });
    
    return {
      matchingNodes: matching,
      matchingNodeIds: matchingIds,
      hasResults: matching.length > 0,
      resultCount: matching.length
    };
  }, [nodes, searchTerm]);
  
  // Atualizar estado quando os resultados da busca mudarem
  useEffect(() => {
    setMatchingNodeIds(searchResults.matchingNodeIds);
    
    // Disparar evento personalizado para notificar sobre resultados da busca
    if (searchTerm && searchTerm.trim() !== "") {
      window.dispatchEvent(
        new CustomEvent("searchResultsCount", {
          detail: { 
            count: searchResults.resultCount, 
            term: searchTerm 
          }
        })
      );
    } else {
      // Limpar contagem quando não houver termo de busca
      window.dispatchEvent(
        new CustomEvent("searchResultsCount", {
          detail: { count: 0, term: "" }
        })
      );
    }
  }, [searchResults, searchTerm]);
  
  // Limpar resultados da busca quando o componente for desmontado
  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent("searchResultsCount", {
          detail: { count: 0, term: "" }
        })
      );
    };
  }, []);
  
  return {
    ...searchResults,
    isSearchActive: !!searchTerm && searchTerm.trim() !== ""
  };
} 