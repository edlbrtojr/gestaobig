"use client";

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { D3Node, D3Link } from "@/types/graph";

interface UseGraphSimulationProps {
  nodes: D3Node[];
  links: D3Link[];
  width: number;
  height: number;
  getNodeRadius: (nodeId: number) => number;
}

/**
 * Hook para gerenciar a simulação de força D3.js
 * 
 * Este hook é responsável por:
 * 1. Configurar e inicializar a simulação D3
 * 2. Gerenciar forças e parâmetros da simulação
 * 3. Lidar com atualizações de dados e dimensões
 * 4. Fornecer funções para interação com a simulação
 */
export function useGraphSimulation({
  nodes,
  links,
  width,
  height,
  getNodeRadius
}: UseGraphSimulationProps) {
  // Referência para a simulação D3
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  // Inicializar ou atualizar a simulação quando os dados ou dimensões mudam
  useEffect(() => {
    // Se não houver nós, limpar a simulação existente
    if (!nodes.length) {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      return;
    }

    // Parar a simulação existente, se houver
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Criar uma nova simulação
    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => (d as D3Node).id)
          .distance(250) // Distância maior entre nós para melhor visualização
          .strength(0.15) // Força reduzida para conexões mais soltas
      )
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength(-1200) // Repulsão mais forte para espaçar nós
          .distanceMax(800) // Distância máxima para efeito de repulsão
      )
      .force(
        "center",
        d3.forceCenter(width / 2, height / 2).strength(0.03) // Força central reduzida
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => getNodeRadius((d as D3Node).id) + 50) // Raio de colisão baseado no tamanho do nó
          .strength(0.7) // Força de colisão aumentada
      )
      .force(
        "radial",
        d3
          .forceRadial(
            width * 0.3, // Raio para distribuição radial
            width / 2,
            height / 2
          )
          .strength(0.05) // Força radial suave
      )
      .alpha(0.6) // Energia inicial mais alta para movimento mais dinâmico
      .alphaDecay(0.008); // Decaimento mais rápido para estabilização

    // Configurar decaimento de velocidade para movimento mais fluido
    simulation.velocityDecay(0.3); // Valor menor = movimento mais fluido

    // Armazenar a simulação na referência
    simulationRef.current = simulation;

    // Limpar ao desmontar
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, links, width, height, getNodeRadius]);

  // Função para configurar comportamento de arrastar
  const createDragBehavior = (onDragStart?: () => void, onDragEnd?: () => void) => {
    if (!simulationRef.current) return null;

    return d3
      .drag<Element, D3Node>()
      .clickDistance(5) // Permitir cliques até 5 pixels de movimento
      .on("start", (event, d) => {
        if (onDragStart) onDragStart();
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (onDragEnd) onDragEnd();
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  };

  // Função para reiniciar a simulação com energia específica
  const restartSimulation = (alpha: number = 0.3) => {
    if (simulationRef.current) {
      simulationRef.current.alpha(alpha).restart();
    }
  };

  // Função para parar a simulação
  const stopSimulation = () => {
    if (simulationRef.current) {
      simulationRef.current.stop();
    }
  };

  // Função para aplicar distorção fisheye (efeito de lupa)
  const applyFisheyeDistortion = (
    center: { x: number; y: number } | null,
    radius: number = 200,
    factor: number = 2.5
  ) => {
    if (!center || !simulationRef.current) return;

    // Aplicar distorção a cada nó
    nodes.forEach((node) => {
      if (node.fx !== null || node.fy !== null) return; // Pular nós fixos

      // Calcular distância do centro de distorção
      const dx = (node.x || 0) - center.x;
      const dy = (node.y || 0) - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        // Calcular fator de distorção (diminui com a distância)
        const distortionFactor = 1 + factor * (1 - distance / radius);

        // Aplicar distorção a partir do ponto central
        node.x = center.x + dx * distortionFactor;
        node.y = center.y + dy * distortionFactor;
      }
    });
  };

  // Retornar a referência da simulação e funções úteis
  return {
    simulationRef,
    createDragBehavior,
    restartSimulation,
    stopSimulation,
    applyFisheyeDistortion
  };
} 