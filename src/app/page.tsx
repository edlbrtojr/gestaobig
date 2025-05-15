import Link from "next/link";
import GraphContainer from "@/components/graph-container";
import ThemeToggle from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-10 w-full border-b border-[var(--card-border)] bg-[var(--background)]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">
            Sistema de Gestão de Riscos e Estratégias
          </h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
        <div className="mb-4">
          <p className="text-lg text-[var(--muted)]">
            Visualize as conexões entre riscos, oportunidades, planos de ação e
            estratégias em formato de grafo interativo.
          </p>

          <div className="flex gap-4 mt-4">
            <Link
              href="/api/seed"
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
              prefetch={false}
            >
              Gerar Dados de Exemplo
            </Link>
          </div>
        </div>

        <div
          className="flex-1 h-[85vh] min-h-[85vh] w-full bg-[var(--card-background)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-md graph-container"
          style={{ position: "relative" }}
        >
          <GraphContainer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="border border-[var(--card-border)] rounded-lg p-6 bg-[var(--card-background)] shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Tipos de Entidades</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#FF5252] mr-2"></span>
                <span>Riscos</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#4CAF50] mr-2"></span>
                <span>Planos de Ação</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#2196F3] mr-2"></span>
                <span>Ações</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#FFC107] mr-2"></span>
                <span>Estratégias</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#9C27B0] mr-2"></span>
                <span>Visão</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#673AB7] mr-2"></span>
                <span>Missão</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#FF9800] mr-2"></span>
                <span>Oportunidades</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#009688] mr-2"></span>
                <span>Departamentos</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#3F51B5] mr-2"></span>
                <span>Projetos</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#E91E63] mr-2"></span>
                <span>Objetivos</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#795548] mr-2"></span>
                <span>KPIs</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-[#00BCD4] mr-2"></span>
                <span>Tecnologias</span>
              </div>
            </div>
          </div>

          <div className="border border-[var(--card-border)] rounded-lg p-6 bg-[var(--card-background)] shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Instruções de Uso</h2>
            <ul className="space-y-3 list-disc pl-5 text-[var(--foreground)]">
              <li>
                Clique no botão <strong>"Gerar Dados de Exemplo"</strong> para
                carregar dados no Neo4j.
              </li>
              <li>Arraste os nós para reorganizar o grafo.</li>
              <li>Use o scroll do mouse para zoom in/out.</li>
              <li>
                <strong>Clique em um nó</strong> para destacar suas conexões e
                ver seus detalhes.
              </li>
              <li>
                Observe as relações entre as entidades através das arestas
                direcionadas.
              </li>
              <li>
                Use o botão de tema no canto superior direito para alternar
                entre modo claro e escuro.
              </li>
            </ul>
          </div>
        </div>

        <footer className="border-t border-[var(--card-border)] mt-4 pt-4 pb-8 text-center text-[var(--muted)]">
          <p>
            © {new Date().getFullYear()} - Sistema de Visualização de Grafos
            Neo4j
          </p>
        </footer>
      </div>
    </main>
  );
}
