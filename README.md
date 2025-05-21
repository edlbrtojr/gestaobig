# Sistema de Gestão de Riscos e Estratégias

Um aplicativo web interativo para visualização de grafos de relacionamentos entre riscos, oportunidades, planos de ação e estratégias organizacionais usando Neo4j e Next.js.

## Características

- Visualização interativa de grafos usando D3.js
- Conexão com banco de dados Neo4j para armazenamento de relacionamentos
- Modo claro/escuro responsivo
- Análise de conexões entre diferentes entidades organizacionais
- Filtros por tipo de entidade e relacionamentos
- Interface responsiva e moderna
- Manipulação dinâmica de nós e relações
- Registro e manutenção de estratégias organizacionais

## Tecnologias

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS, ShadCn
- **Backend**: Neo4j (Graph Database), Next.js API Routes
- **Visualização**: D3.js
- **Estilização**: CSS Modules, TailwindCSS

## Instalação

### Pré-requisitos

- Node.js 18+
- Docker (para Neo4j)

### Configuração

1. Clone o repositório

   ```bash
   git clone https://github.com/edlbrtojr/gestaobig.git
   cd gestaobig
   ```

2. Instale as dependências

   ```bash
   npm install
   ```

3. Inicie o Neo4j usando Docker

   ```bash
   docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/3d1Jun1or neo4j:latest
   ```

4. Configure as variáveis de ambiente

   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=3d1Jun1or
   ```

5. Inicie o servidor de desenvolvimento

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000` e clique em "Gerar Dados de Exemplo" para popular o banco com dados de demonstração

## Uso

- **Visualização do Grafo**: A tela principal mostra o grafo de relacionamentos
- **Interação**: Clique em um nó para ver suas conexões diretas e detalhes
- **Zoom**: Use o scroll do mouse para dar zoom in/out no grafo
- **Arrastar**: Mova nós clicando e arrastando para reorganizar o grafo
- **Tema**: Alterne entre modo claro e escuro com o botão no topo
- **Adição de Entidades**: Adicione novas entidades através do formulário específico
- **Criação de Relações**: Conecte entidades existentes através da interface de relações

## Documentação

Documentação detalhada está disponível na pasta `docs/`:

- [Visão Geral do Sistema](docs/visao-geral.md)
- [Arquitetura](docs/arquitetura.md)
- [API Documentação](docs/api.md)
- [Banco de Dados](docs/banco-dados.md)
- [Guia de Desenvolvimento](docs/desenvolvimento.md)
- [Guia de Implantação](docs/implantacao.md)

## Contribuição

Contribuições são bem-vindas. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Envie para o branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

MIT

---

Desenvolvido por Edilberto Junior
