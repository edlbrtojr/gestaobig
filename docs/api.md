# Documentação da API

## 1. Visão Geral da API

O Sistema de Gestão de Riscos e Estratégias implementa uma API RESTful baseada em Next.js API Routes. Esta API serve como interface entre o frontend e o banco de dados Neo4j, fornecendo endpoints para gerenciar nós, relacionamentos e visualização de grafos.

## 2. Estrutura da API

A API está organizada nas seguintes categorias principais:

```
src/app/api/
├── node/        # Endpoints para gerenciar nós (entidades)
├── relationship/ # Endpoints para gerenciar relacionamentos
├── graph/       # Endpoints para recuperar dados do grafo
└── seed/        # Endpoints para inicialização de dados
```

## 3. Endpoints da API

### 3.1 API de Nós

Estes endpoints gerenciam as entidades do grafo (Riscos, Oportunidades, Ações e Estratégias).

#### Operações CRUD para nós:
- Criar novos nós
- Recuperar nós existentes
- Atualizar propriedades de nós
- Excluir nós

### 3.2 API de Relacionamentos

Estes endpoints gerenciam as conexões entre diferentes nós no grafo.

#### Operações CRUD para relacionamentos:
- Criar novos relacionamentos entre nós
- Recuperar relacionamentos existentes
- Atualizar propriedades de relacionamentos
- Excluir relacionamentos

### 3.3 API de Grafo

Estes endpoints fornecem dados consolidados do grafo para visualização.

#### Funcionalidades:
- Recuperar dados completos do grafo
- Filtrar nós por tipo ou propriedades
- Limitar o tamanho dos resultados

### 3.4 API de Seed

Estes endpoints são usados para inicializar o banco de dados com dados de exemplo.

#### Funcionalidades:
- Criar conjuntos de dados de amostra para demonstração
- Limpar o banco de dados para reinicialização

## 4. Comunicação com a API

As APIs são acessadas através de requisições HTTP padrão:

- `GET`: Para recuperar dados
- `POST`: Para criar novos recursos
- `PUT`: Para atualizar recursos existentes
- `DELETE`: Para remover recursos

## 5. Formato de Dados

As APIs trabalham principalmente com dados no formato JSON:

### Exemplo de Nó:
```json
{
  "id": "123",
  "label": "Risk",
  "properties": {
    "name": "Falha na Cadeia de Suprimentos",
    "description": "Interrupção na cadeia de suprimentos",
    "impact": "High",
    "probability": "Medium"
  }
}
```

### Exemplo de Relacionamento:
```json
{
  "id": "456",
  "startNode": "123",
  "endNode": "789",
  "type": "MITIGATES",
  "properties": {
    "effectiveness": "High"
  }
}
```

## 6. Segurança

A API implementa as seguintes medidas de segurança básicas:

- Validação de entrada
- Sanitização de parâmetros
- Prevenção de injeção Cypher usando parâmetros

## 7. Base URL

Para desenvolvimento local:
```
http://localhost:3000/api
```

## 8. Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Erro de validação ou parâmetros inválidos
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro não tratado no servidor

## 9. Formatos de Erro

Todas as respostas de erro seguem um formato consistente:

```json
{
  "error": true,
  "message": "Descrição do erro",
  "details": {
    "campo": ["Mensagem de erro detalhada"]
  }
}
```

## 10. Exemplos de Uso

### 10.1 Criação de um Risco e uma Ação, e Conexão Entre Eles

```javascript
// 1. Criar um risco
const risk = await fetch('/api/entities/Risk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Risco Regulatório',
    description: 'Mudanças em regulamentações governamentais',
    impact: 'High',
    probability: 'Medium'
  })
}).then(res => res.json());

// 2. Criar uma ação
const action = await fetch('/api/entities/Action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Monitoramento Regulatório',
    description: 'Sistema de monitoramento de mudanças regulatórias',
    status: 'In Progress'
  })
}).then(res => res.json());

// 3. Criar um relacionamento entre eles
await fetch('/api/relationships', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startNodeId: action.id,
    endNodeId: risk.id,
    type: 'MITIGATES',
    properties: {
      effectiveness: 'High'
    }
  })
}).then(res => res.json());
```

### 10.2 Consulta de Grafo Filtrado

```javascript
// Consultar apenas riscos e ações com alto impacto
const graphData = await fetch('/api/graph?types=Risk,Action&impact=High')
  .then(res => res.json());

// Renderizar o grafo com os dados
renderGraph(graphData);
```

## 11. Rate Limiting e Segurança

Melhorias futuras podem incluir:
- Implementação de rate limiting
- Autenticação de usuários
- Autorização baseada em papéis

## 12. Documentação Adicional

### 12.1 Esquemas de Entidade

#### Risk
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "impact": "string (Low, Medium, High, Very High)",
  "probability": "string (Low, Medium, High, Very High)"
}
```

#### Opportunity
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "potential": "string (Low, Medium, High, Very High)",
  "feasibility": "string (Low, Medium, High, Very High)"
}
```

#### Action
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "string (Not Started, In Progress, Completed)",
  "dueDate": "string (ISO date, optional)"
}
```

#### Strategy
```json
{
  "id": "string",
  "name": "string",
  "description": "string", 
  "timeframe": "string (Short-term, Medium-term, Long-term)",
  "priority": "string (Low, Medium, High)"
}
```

### 12.2 Tipos de Relacionamento

- `INFLUENCES`: Uma entidade influencia outra
- `MITIGATES`: Uma ação mitiga um risco
- `ENABLES`: Uma entidade habilita ou facilita outra
- `PART_OF`: Mostra relações hierárquicas dentro do mesmo tipo de entidade
- `RELATED_TO`: Relacionamento genérico quando um tipo mais específico não se aplica 