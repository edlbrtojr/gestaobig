"use client";

import { useMemo, useState, useEffect } from "react";
import { D3Node, D3Link, GraphData } from "@/types/graph";

/**
 * Hook para processar e transformar dados do grafo
 * 
 * Este hook é responsável por:
 * 1. Filtrar nós do sistema
 * 2. Transformar dados Neo4j em formato compatível com D3
 * 3. Calcular metadados como contagens de conexões
 * 4. Calcular níveis hierárquicos
 * 5. Categorizar nós por tipo
 */
export function useGraphData(data: GraphData) {
  // Estado para armazenar níveis hierárquicos dos nós
  const [hierarchyLevels, setHierarchyLevels] = useState<Record<number, number>>({});
  // Estado para armazenar nós categorizados por tipo
  const [categorizedNodes, setCategorizedNodes] = useState<Record<string, D3Node[]>>({});
  // Estado para armazenar centros de grupos para layout
  const [groupCentersMap, setGroupCentersMap] = useState<Record<string, { x: number; y: number; r: number }>>({});
  // Mapa de contagem de conexões para cada nó
  const [connectionCounts, setConnectionCounts] = useState<Map<number, number>>(new Map());

  // Processa os dados do grafo para formato compatível com D3
  const [processedData, nodeMap] = useMemo(() => {
    if (!data.nodes.length) return [null, new Map<number, D3Node>()];
    
    // Criar mapa de nós excluindo nós do sistema
    const map = new Map<number, D3Node>();
    const systemNodeTypes = ["NodeVisibility", "NodePermission"];

    // Processar nós - filtrar nós do sistema
    const processedNodes = data.nodes
      .filter((node) => !systemNodeTypes.includes(node.label))
      .map((node) => {
        const nodeId =
          typeof node.id === "object" && node.id !== null
            ? node.id.low
            : Number(node.id);

        const d3Node = {
          ...node,
          id: nodeId,
        } as D3Node;
        map.set(nodeId, d3Node);
        return d3Node;
      });

    // Filtrar relacionamentos que envolvem nós do sistema
    const filteredRelationships = data.relationships.filter((rel) => {
      const sourceId =
        typeof rel.source === "object" && rel.source !== null
          ? rel.source.low
          : Number(rel.source);
      const targetId =
        typeof rel.target === "object" && rel.target !== null
          ? rel.target.low
          : Number(rel.target);

      // Verificar se o nó de origem e destino estão no conjunto filtrado
      return map.has(sourceId) && map.has(targetId);
    }) as D3Link[];

    return [
      {
        nodes: processedNodes,
        relationships: filteredRelationships,
      },
      map,
    ];
  }, [data]);

  // Calcular contagem de conexões para cada nó
  useEffect(() => {
    if (!processedData) return;
    
    const counts = new Map<number, number>();
    
    // Inicializar contagem para todos os nós
    processedData.nodes.forEach(node => {
      counts.set(node.id, 0);
    });
    
    // Contar conexões para cada nó
    processedData.relationships.forEach(link => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source;
      const targetId = typeof link.target === "object" ? link.target.id : link.target;
      
      counts.set(sourceId, (counts.get(sourceId) || 0) + 1);
      counts.set(targetId, (counts.get(targetId) || 0) + 1);
    });
    
    setConnectionCounts(counts);
  }, [processedData]);

  // Calcular níveis hierárquicos baseados nos relacionamentos
  useEffect(() => {
    if (!processedData || !processedData.nodes.length || !processedData.relationships.length) return;

    // Função auxiliar para extrair ID de nó com segurança
    const safeExtractNodeId = (id: any): number => {
      if (id === null || id === undefined) return -1;
      if (typeof id === "object" && id !== null && "low" in id) return id.low;
      return Number(id);
    };

    // Contar arestas de entrada e saída para cada nó
    const incomingEdges: Record<number, number> = {};
    const outgoingEdges: Record<number, number> = {};

    processedData.relationships.forEach((rel) => {
      const sourceId = typeof rel.source === "object" ? rel.source.id : Number(rel.source);
      const targetId = typeof rel.target === "object" ? rel.target.id : Number(rel.target);

      incomingEdges[targetId] = (incomingEdges[targetId] || 0) + 1;
      outgoingEdges[sourceId] = (outgoingEdges[sourceId] || 0) + 1;
    });

    // Identificar nós raiz (nós com arestas de saída mas sem arestas de entrada)
    const rootNodeIds = processedData.nodes
      .filter((node) => {
        const nodeId = node.id;
        return outgoingEdges[nodeId] && !incomingEdges[nodeId];
      })
      .map((node) => node.id);

    // Se não houver nós raiz claros, usar nós com mais arestas de saída do que de entrada
    if (rootNodeIds.length === 0) {
      rootNodeIds.push(
        ...processedData.nodes
          .filter((node) => {
            const nodeId = node.id;
            return (outgoingEdges[nodeId] || 0) > (incomingEdges[nodeId] || 0);
          })
          .map((node) => node.id)
      );
    }

    // Se ainda não houver raízes, usar qualquer nó com o maior número de conexões
    if (rootNodeIds.length === 0 && processedData.nodes.length > 0) {
      const nodeWithMostConnections = processedData.nodes.reduce(
        (max, node) => {
          const nodeId = node.id;
          const connections = (outgoingEdges[nodeId] || 0) + (incomingEdges[nodeId] || 0);
          return connections > max.connections ? { id: nodeId, connections } : max;
        },
        { id: -1, connections: -1 }
      );

      if (nodeWithMostConnections.id !== -1) {
        rootNodeIds.push(nodeWithMostConnections.id);
      }
    }

    // Construir lista de adjacência para o grafo
    const adjList: Record<number, number[]> = {};
    processedData.relationships.forEach((rel) => {
      const sourceId = typeof rel.source === "object" ? rel.source.id : Number(rel.source);
      const targetId = typeof rel.target === "object" ? rel.target.id : Number(rel.target);

      if (!adjList[sourceId]) adjList[sourceId] = [];
      if (!adjList[targetId]) adjList[targetId] = [];

      adjList[sourceId].push(targetId);
    });

    // Atribuir níveis hierárquicos usando BFS a partir dos nós raiz
    const newHierarchyLevels: Record<number, number> = {};
    const visited = new Set<number>();

    // Fila para BFS com [nodeId, level]
    const queue: [number, number][] = rootNodeIds.map((id) => [id, 0]);

    while (queue.length > 0) {
      const [nodeId, level] = queue.shift()!;

      if (visited.has(nodeId)) {
        // Se já vimos este nó antes, manter o nível mínimo
        newHierarchyLevels[nodeId] = Math.min(level, newHierarchyLevels[nodeId] || Infinity);
        continue;
      }

      visited.add(nodeId);
      newHierarchyLevels[nodeId] = level;

      // Adicionar vizinhos à fila
      const neighbors = adjList[nodeId] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push([neighbor, level + 1]);
        }
      }
    }

    // Para nós não visitados, atribuir um nível intermediário
    const maxLevel = Math.max(...Object.values(newHierarchyLevels), 0);
    const defaultLevel = Math.ceil(maxLevel / 2);

    processedData.nodes.forEach((node) => {
      const nodeId = node.id;
      if (!visited.has(nodeId)) {
        newHierarchyLevels[nodeId] = defaultLevel;
      }
    });

    setHierarchyLevels(newHierarchyLevels);

    // Calcular centros de grupos para layout
    if (processedData.nodes.length > 0) {
      // Obter todas as etiquetas únicas de nós
      const uniqueLabels = Array.from(new Set(processedData.nodes.map((node) => node.label)));
      
      // Calcular centros de grupos (será usado para layout)
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight - 100;
      
      const centers = calculateGroupCenters(containerWidth, containerHeight, uniqueLabels);
      setGroupCentersMap(centers);
    }
  }, [processedData]);

  // Categorizar nós por tipo
  useEffect(() => {
    if (!processedData) return;
    
    const categorized: Record<string, D3Node[]> = {};
    
    processedData.nodes.forEach((node) => {
      if (!categorized[node.label]) categorized[node.label] = [];
      categorized[node.label].push(node);
    });
    
    // Ordenar nós em cada categoria por nome
    Object.keys(categorized).forEach((category) => {
      categorized[category].sort((a, b) => {
        const nameA = a.properties?.name || "";
        const nameB = b.properties?.name || "";
        return nameA.localeCompare(nameB);
      });
    });
    
    setCategorizedNodes(categorized);
  }, [processedData]);

  // Função para calcular centros de grupos para layout semântico
  const calculateGroupCenters = (
    width: number,
    height: number,
    labels: string[]
  ): Record<string, { x: number; y: number; r: number }> => {
    const centers: Record<string, { x: number; y: number; r: number }> = {};
    const centerX = width / 2;
    const centerY = height / 2;

    // Distância base do centro para as órbitas de grupo
    const baseRadius = Math.min(width, height) * 0.25;

    // Distribuir as etiquetas uniformemente em um círculo
    labels.forEach((label, i) => {
      const angle = (i / labels.length) * 2 * Math.PI;
      const x = centerX + baseRadius * Math.cos(angle);
      const y = centerY + baseRadius * Math.sin(angle);
      const r = baseRadius * 0.4;

      centers[label] = { x, y, r };
    });

    return centers;
  };

  // Função para calcular raio do nó baseado no número de conexões
  const getNodeRadius = (nodeId: number): number => {
    const connectionCount = connectionCounts.get(nodeId) || 0;
    const minRadius = 22;
    const maxRadius = 60;
    const minConnections = 0;
    const maxConnections = Math.max(...Array.from(connectionCounts.values()), 1);
    
    if (maxConnections === minConnections) return minRadius;

    // Usar uma função de escala mais suave com raiz quadrada para distribuição mais uniforme
    const connectionFactor =
      Math.sqrt(connectionCount - minConnections) /
      Math.sqrt(maxConnections - minConnections);
    
    return minRadius + (maxRadius - minRadius) * connectionFactor;
  };

  // Função para obter nós conectados a um nó específico
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

  return {
    processedData,
    nodeMap,
    hierarchyLevels,
    categorizedNodes,
    groupCentersMap,
    connectionCounts,
    getNodeRadius,
    getConnectedNodeIds
  };
} 