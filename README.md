# Sistema de Gestão de Riscos e Estratégias

Um aplicativo web interativo para visualização de grafos de relacionamentos entre riscos, oportunidades, planos de ação e estratégias organizacionais usando Neo4j e Next.js.

## Configuração Inicial da Organização

Após a remoção dos dados padrão codificados, é necessário inicializar a configuração da organização antes de usar o aplicativo. Siga estes passos:

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Em um terminal separado, execute o script de inicialização:
   ```bash
   npm run init-config
   ```

Este script irá:
- Procurar por imagens de logo no diretório `/public/images`
- Criar uma configuração inicial da organização
- Armazenar no banco de dados Neo4j

Se você não executar esta etapa de inicialização, verá mensagens de erro sobre configuração ausente ao tentar acessar o aplicativo.

Você pode personalizar as configurações da organização posteriormente através da interface de administração em `/settings/organization`.

## Características

- Visualização interativa de grafos usando D3.js
- Conexão com banco de dados Neo4j para armazenamento de relacionamentos
- Modo claro/escuro responsivo
- Análise de conexões entre diferentes entidades organizacionais
- Filtros por tipo de entidade e relacionamentos
- Interface responsiva e moderna
- Manipulação dinâmica de nós e relações
- Registro e manutenção de estratégias organizacionais
- Sistema de permissões com usuários de teste para testar diferentes níveis de acesso

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
   docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/SuaSenhaAqui neo4j:latest
   ```

4. Configure as variáveis de ambiente

   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=SuaSenhaAqui
   ```

5. Inicie o servidor de desenvolvimento

   ```bash
   npm run dev
   ```

6. Inicialize a configuração da organização

   ```bash
   npm run init-config
   ```

7. Acesse `http://localhost:3000` e clique em "Gerar Dados de Exemplo" para popular o banco com dados de demonstração

### Configuração de Usuários de Teste (Opcional)

Para testar a aplicação com diferentes níveis de privilégios:

1. Execute o script de criação de usuários de teste:

   ```powershell
   # No Windows (PowerShell)
   .\scripts\setup-test-users.ps1
   ```

   Este script criará 5 usuários diferentes com diferentes níveis de permissão:
   
   - **admin_user**: Administrador com acesso total
   - **editor_user**: Editor que pode modificar dados mas não gerenciar usuários
   - **analyst_user**: Analista com acesso de leitura e publicação
   - **reader_user**: Leitor com acesso somente leitura
   - **limited_user**: Usuário com acesso muito limitado

2. Após a criação, você pode alternar entre esses usuários usando o seletor de usuários no canto superior direito da aplicação

## Uso

- **Visualização do Grafo**: A tela principal mostra o grafo de relacionamentos
- **Interação**: Clique em um nó para ver suas conexões diretas e detalhes
- **Zoom**: Use o scroll do mouse para dar zoom in/out no grafo
- **Arrastar**: Mova nós clicando e arrastando para reorganizar o grafo
- **Tema**: Alterne entre modo claro e escuro com o botão no topo
- **Adição de Entidades**: Adicione novas entidades através do formulário específico
- **Criação de Relações**: Conecte entidades existentes através da interface de relações
- **Teste de Privilégios**: Alterne entre diferentes usuários no seletor no cabeçalho para testar níveis de acesso

## Usuários e Privilégios

O sistema inclui 5 tipos de usuários para testar diferentes níveis de acesso:

| Usuário | Papel | Descrição | Permissões |
|---------|------|-----------|------------|
| admin_user | Administrador | Acesso total ao sistema | Criar usuários, gerenciar configurações, editar dados, ler dados, publicar relatórios, gerenciar papéis |
| editor_user | Editor | Pode modificar dados | Editar dados, ler dados |
| analyst_user | Analista | Acesso de leitura e publicação | Ler dados, publicar relatórios |
| reader_user | Leitor | Acesso somente leitura | Ler dados |
| limited_user | Acesso Limitado | Acesso muito restrito | Acesso restrito a dados específicos |

## Gerenciamento de Visibilidade de Nós

O sistema inclui um recurso avançado de gerenciamento de visibilidade de nós que permite controlar quais usuários podem ver quais nós no grafo:

### Características

- **Visibilidade Restrita**: Limite quais nós cada perfil de usuário pode visualizar
- **Propagação de Visibilidade**: Se um nó é oculto, suas conexões também são automaticamente ocultas
- **Operações em Massa**: Conceda ou revogue acesso a múltiplos nós de uma só vez
- **Filtros Avançados**: Filtre nós por tipo, visibilidade e mais para gerenciamento facilitado

### Como Utilizar

1. Acesse as **Configurações** > **Administração** > **Visibilidade de Nós**
2. Use os filtros para encontrar os nós que deseja configurar
3. Selecione os nós e aplique uma das seguintes operações:
   - **Restringir Visibilidade**: Torna nós visíveis apenas para funções específicas
   - **Tornar Público**: Torna nós visíveis para todos os usuários
   - **Conceder Acesso**: Concede permissão para funções específicas verem nós restritos
   - **Revogar Acesso**: Remove permissão para funções específicas verem nós restritos

### Impacto na Visualização

- Usuários só verão os nós aos quais têm acesso explícito
- Relacionamentos entre nós ocultos e visíveis são automaticamente filtrados
- Administradores mantêm visibilidade completa de todos os nós

### Configuração Inicial

Execute o script de configuração para preparar o esquema de permissões:

```powershell
# No Windows (PowerShell)
.\scripts\setup-permissions.ps1
```

Este script criará as estruturas de dados necessárias para gerenciar permissões de nós.

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

## Estrutura do Banco de Dados

O banco de dados é estruturado com os seguintes tipos de nós:

- **Empresa**: Representa as empresas do sistema (FIEAC, SESI, SENAI, IEL)
- **Unidade**: Representa unidades organizacionais (categorizadas como MEIO ou FIM)
- **Missao**: Define a missão de uma empresa
- **Visao**: Define a visão de uma empresa
- **Proposito**: Define o propósito de uma empresa
- **Negocio**: Define um tipo de negócio
- **SistemaApoio**: Representa o sistema de áreas compartilhadas

Estes nós se relacionam através das seguintes relações:

- **POSSUI**: Conecta uma Empresa a suas Unidades
- **TEM_PROPOSITO**: Conecta uma Empresa ao seu Propósito
- **TEM_MISSAO**: Conecta uma Empresa à sua Missão
- **TEM_VISAO**: Conecta uma Empresa à sua Visão
- **INCLUI**: Relaciona o SistemaApoio às Unidades de apoio
- **PRESTA_SERVICO_PARA**: Relaciona o SistemaApoio às Empresas
- **ATUA_EM**: Conecta uma Unidade ao seu tipo de Negócio

## Inicialização do Banco de Dados

Para inicializar o banco de dados com a estrutura organizacional definida:

```bash
node scripts/clear-db.js --init
```

Este comando irá:
1. Limpar o banco de dados atual (preservando configurações de schema)
2. Executar o script `create_database.cypher` para criar a estrutura organizacional

Para apenas limpar o banco sem inicializar:

```bash
node scripts/clear-db.js
```

## Desenvolvimento

```bash
npm run dev
```

## Testes

```bash
npm test
```

## Build

```bash
npm run build
```

## Visualização no Neo4j Browser

Para uma melhor visualização no Neo4j Browser, experimente estas queries:

```cypher
// Visualizar empresas e suas unidades fim
MATCH (e:Empresa)-[:POSSUI]->(u:Unidade {categoria: "FIM"})
RETURN e, u

// Visualizar missão, visão e propósito de todas as empresas
MATCH (e:Empresa)
OPTIONAL MATCH (e)-[:TEM_MISSAO]->(m:Missao)
OPTIONAL MATCH (e)-[:TEM_VISAO]->(v:Visao)
OPTIONAL MATCH (e)-[:TEM_PROPOSITO]->(p:Proposito)
RETURN e, m, v, p

// Visualizar sistema de apoio compartilhado
MATCH (s:SistemaApoio)-[:PRESTA_SERVICO_PARA]->(e:Empresa)
RETURN s, e

// Visualizar unidades fim e seus tipos de negócio
MATCH (u:Unidade {categoria: "FIM"})-[:ATUA_EM]->(n:Negocio)
RETURN u, n
```

## Estilo de Visualização

Para melhorar a visualização no Neo4j Browser, aplique este estilo:

```
:style {
  "node": {
    "diameter": "50px",
    "color": "#A5ABB6",
    "border-color": "#9AA1AC",
    "border-width": "2px",
    "text-color-internal": "#FFFFFF",
    "font-size": "10px"
  },
  "relationship": {
    "color": "#A5ABB6",
    "shaft-width": "1px",
    "font-size": "8px",
    "padding": "3px",
    "text-color-external": "#000000",
    "text-color-internal": "#FFFFFF"
  },
  "node.Empresa": {
    "color": "#4C8EDA",
    "border-color": "#2870c2"
  },
  "node.Unidade": {
    "color": "#57C7E3",
    "border-color": "#23b3d7"
  },
  "node.Missao": {
    "color": "#D9534F",
    "border-color": "#be3e3b"
  },
  "node.Visao": {
    "color": "#8CC823",
    "border-color": "#6db417"
  },
  "node.Proposito": {
    "color": "#F79A20",
    "border-color": "#e78b13"
  },
  "node.Negocio": {
    "color": "#FFC454",
    "border-color": "#d7a013"
  },
  "node.SistemaApoio": {
    "color": "#C780E8",
    "border-color": "#9453af"
  }
}
```
