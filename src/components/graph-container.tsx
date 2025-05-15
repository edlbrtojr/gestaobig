"use client";

import { useEffect, useState } from "react";
import GraphView from "./graph-view";
import { GraphData } from "@/types/graph";

export default function GraphContainer() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    relationships: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchGraphData() {
    setIsLoading(true);
    setError(null);

    try {
      // Add cache-busting parameter to prevent browser caching
      const response = await fetch(`/api/graph?t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      console.error("Failed to fetch graph data:", err);
      setError(
        "Falha ao carregar os dados do grafo. Verifique se o Neo4j está em execução."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Called when the "Gerar Dados de Exemplo" button is clicked
  async function seedDatabase() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/seed", { method: "POST" });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // After seeding, fetch the graph data
      await fetchGraphData();
    } catch (err) {
      console.error("Failed to seed database:", err);
      setError(
        "Falha ao gerar dados de exemplo. Verifique se o Neo4j está em execução."
      );
      setIsLoading(false);
    }
  }

  // Handle DOM event for the seed button
  const handleSeedButtonClick = (e: Event) => {
    e.preventDefault();
    void seedDatabase();
  };

  // Add click event listener to the seed button
  useEffect(() => {
    const seedButton = document.querySelector('a[href="/api/seed"]');
    if (seedButton) {
      seedButton.addEventListener("click", handleSeedButtonClick);
    }

    return () => {
      if (seedButton) {
        seedButton.removeEventListener("click", handleSeedButtonClick);
      }
    };
  }, []);

  // Fetch graph data on component mount
  useEffect(() => {
    fetchGraphData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--card-background)]">
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--primary)] border-r-transparent"
            role="status"
          >
            <span className="sr-only">Carregando...</span>
          </div>
          <p className="mt-4 text-[var(--muted)]">
            Carregando dados do grafo...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--card-background)]">
        <div className="text-center max-w-md p-6">
          <div className="text-[var(--danger)] text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--danger)]">
            Erro ao carregar dados
          </h3>
          <p className="text-[var(--muted)] mb-4">{error}</p>
          <button
            onClick={fetchGraphData}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no nodes
  if (graphData.nodes.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--card-background)]">
        <div className="text-center max-w-md p-6">
          <div className="text-[var(--warning)] text-5xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-[var(--muted)] mb-4">
            Não foram encontrados dados no grafo. Clique no botão "Gerar Dados
            de Exemplo" para criar dados de demonstração.
          </p>
          <button
            onClick={seedDatabase}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
          >
            Gerar Dados de Exemplo
          </button>
        </div>
      </div>
    );
  }

  // Render the graph when data is available
  return (
    <div className="h-full w-full" style={{ position: "absolute", inset: 0 }}>
      <GraphView data={graphData} />
    </div>
  );
}
