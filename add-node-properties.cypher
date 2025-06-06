// Script para adicionar propriedades aos nós do schema
// Transação 1: Adicionar propriedades aos nós do tipo Sistema
MATCH (config:_SchemaConfig {name: "systemSchema"})
MATCH (nodeType:_NodeLabelSchema {name: "Sistema"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nome",
  type: "string",
  required: true,
  nodeType: "Sistema"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "descricao",
  type: "string",
  required: false,
  nodeType: "Sistema"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "sigla",
  type: "string",
  required: false,
  nodeType: "Sistema"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "versao",
  type: "string",
  required: false,
  nodeType: "Sistema"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "dataImplementacao",
  type: "date",
  required: false,
  nodeType: "Sistema"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "status",
  type: "enum",
  required: true,
  options: ["Ativo", "Inativo", "Em Desenvolvimento", "Descontinuado"],
  defaultValue: "Ativo",
  nodeType: "Sistema"
});

// Transação 2: Adicionar propriedades aos nós do tipo Instituicao
MATCH (config:_SchemaConfig {name: "systemSchema"})
MATCH (nodeType:_NodeLabelSchema {name: "Instituicao"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nome",
  type: "string",
  required: true,
  nodeType: "Instituicao"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "cnpj",
  type: "string",
  required: false,
  nodeType: "Instituicao"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "sigla",
  type: "string",
  required: false,
  nodeType: "Instituicao"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "descricao",
  type: "string",
  required: false,
  nodeType: "Instituicao"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "dataCriacao",
  type: "date",
  required: false,
  nodeType: "Instituicao"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "uf",
  type: "string",
  required: false,
  nodeType: "Instituicao"
});

// Transação 3: Adicionar propriedades aos nós do tipo UnidadeNegocio
MATCH (config:_SchemaConfig {name: "systemSchema"})
MATCH (nodeType:_NodeLabelSchema {name: "UnidadeNegocio"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nome",
  type: "string",
  required: true,
  nodeType: "UnidadeNegocio"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "instituicao",
  type: "string",
  required: true,
  nodeType: "UnidadeNegocio"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "descricao",
  type: "string",
  required: false,
  nodeType: "UnidadeNegocio"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "sigla",
  type: "string",
  required: false,
  nodeType: "UnidadeNegocio"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "responsavel",
  type: "string",
  required: false,
  nodeType: "UnidadeNegocio"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "dataImplementacao",
  type: "date",
  required: false,
  nodeType: "UnidadeNegocio"
});

// Transação 4: Adicionar propriedades aos nós do tipo OrganizationalUnit
MATCH (config:_SchemaConfig {name: "systemSchema"})
MATCH (nodeType:_NodeLabelSchema {name: "OrganizationalUnit"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nome",
  type: "string",
  required: true,
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nivel",
  type: "number",
  required: true,
  defaultValue: "1",
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "instituicao",
  type: "string",
  required: false,
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "tipo",
  type: "enum",
  required: true,
  options: ["Estratégica", "Tática", "Operacional", "Apoio"],
  defaultValue: "Operacional",
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "categoria",
  type: "enum",
  required: false,
  options: ["Diretoria", "Gerência", "Coordenação", "Setor", "Núcleo"],
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "compartilhada",
  type: "boolean",
  required: false,
  defaultValue: "false",
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "descricao",
  type: "string",
  required: false,
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "sigla",
  type: "string",
  required: false,
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "responsavel",
  type: "string",
  required: false,
  nodeType: "OrganizationalUnit"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "dataCriacao",
  type: "date",
  required: false,
  nodeType: "OrganizationalUnit"
});

// Transação 5: Adicionar propriedades aos nós de áreas específicas (Governança, Direção, Superintendência, etc.)
MATCH (config:_SchemaConfig {name: "systemSchema"})
UNWIND ["Governanca", "Direcao", "Superintendencia", "Gerencia", "AreaFim", "UnidadeRegional", 
        "AreaApoio", "AreaMeio", "Assessoria", "Compliance", "AreasCompartilhadas"] AS labelName
MATCH (nodeType:_NodeLabelSchema {name: labelName})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nome",
  type: "string",
  required: true,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "descricao",
  type: "string",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "sigla",
  type: "string",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "responsavel",
  type: "string",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "email",
  type: "string",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "telefone",
  type: "string",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "numeroColaboradores",
  type: "number",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "dataCriacao",
  type: "date",
  required: false,
  nodeType: labelName
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "status",
  type: "enum",
  required: false,
  options: ["Ativo", "Inativo", "Em Reestruturação"],
  defaultValue: "Ativo",
  nodeType: labelName
});

// Transação 6: Adicionar propriedades adicionais específicas para cada tipo de área
// Governança
MATCH (nodeType:_NodeLabelSchema {name: "Governanca"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "tipoGovernanca",
  type: "enum",
  required: false,
  options: ["Corporativa", "TI", "Dados", "Projetos"],
  nodeType: "Governanca"
});

// Direção
MATCH (nodeType:_NodeLabelSchema {name: "Direcao"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "tipoDirecao",
  type: "enum",
  required: false,
  options: ["Presidência", "Vice-Presidência", "Diretoria Executiva", "Diretoria"],
  nodeType: "Direcao"
});

// Superintendência
MATCH (nodeType:_NodeLabelSchema {name: "Superintendencia"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "tipoSuperintendencia",
  type: "enum",
  required: false,
  options: ["Executiva", "Regional", "Técnica", "Administrativa"],
  nodeType: "Superintendencia"
});

// Compliance
MATCH (nodeType:_NodeLabelSchema {name: "Compliance"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "tipoCompliance",
  type: "enum",
  required: false,
  options: ["Regulatório", "Ético", "Interno", "Externo"],
  nodeType: "Compliance"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nivelRisco",
  type: "enum",
  required: false,
  options: ["Baixo", "Médio", "Alto", "Muito Alto"],
  nodeType: "Compliance"
});

// UnidadeRegional
MATCH (nodeType:_NodeLabelSchema {name: "UnidadeRegional"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "regiao",
  type: "enum",
  required: false,
  options: ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"],
  nodeType: "UnidadeRegional"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "uf",
  type: "string",
  required: false,
  nodeType: "UnidadeRegional"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "cidade",
  type: "string",
  required: false,
  nodeType: "UnidadeRegional"
});

// Transação 7: Adicionar propriedades para os nós do sistema
MATCH (config:_SchemaConfig {name: "systemSchema"})
MATCH (nodeType:_NodeLabelSchema {name: "_User"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "email",
  type: "string",
  required: true,
  nodeType: "_User"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "name",
  type: "string",
  required: true,
  nodeType: "_User"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "password",
  type: "string",
  required: false,
  nodeType: "_User"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "active",
  type: "boolean",
  required: true,
  defaultValue: "true",
  nodeType: "_User"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "createdAt",
  type: "date",
  required: true,
  nodeType: "_User"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "lastLogin",
  type: "date",
  required: false,
  nodeType: "_User"
});

// Role
MATCH (nodeType:_NodeLabelSchema {name: "_Role"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "name",
  type: "string",
  required: true,
  nodeType: "_Role"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "description",
  type: "string",
  required: false,
  nodeType: "_Role"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "createdAt",
  type: "date",
  required: true,
  nodeType: "_Role"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "updatedAt",
  type: "date",
  required: false,
  nodeType: "_Role"
});

// Permission
MATCH (nodeType:_NodeLabelSchema {name: "_Permission"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "name",
  type: "string",
  required: true,
  nodeType: "_Permission"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "resource",
  type: "string",
  required: true,
  nodeType: "_Permission"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "action",
  type: "enum",
  required: true,
  options: ["create", "read", "update", "delete", "manage", "publish"],
  nodeType: "_Permission"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "description",
  type: "string",
  required: false,
  nodeType: "_Permission"
});

// Transação 8: Adicionar propriedades para o nó Dashboard
MATCH (config:_SchemaConfig {name: "systemSchema"})
MATCH (nodeType:_NodeLabelSchema {name: "Dashboard"})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "nome",
  type: "string",
  required: true,
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "descricao",
  type: "string",
  required: false,
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "tipo",
  type: "enum",
  required: false,
  options: ["Estratégico", "Tático", "Operacional", "Financeiro", "Recursos Humanos"],
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "dataCriacao",
  type: "date",
  required: false,
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "ultimaAtualizacao",
  type: "date",
  required: false,
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "responsavel",
  type: "string",
  required: false,
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "url",
  type: "string",
  required: false,
  nodeType: "Dashboard"
})
MERGE (nodeType)-[:HAS_PROPERTY]->(:_SchemaProperty {
  name: "visibilidade",
  type: "enum",
  required: false,
  options: ["Público", "Restrito", "Confidencial"],
  defaultValue: "Restrito",
  nodeType: "Dashboard"
});

// Transação 9: Atualizar o schema para refletir a adição de propriedades
MATCH (config:_SchemaConfig {name: "systemSchema"})
SET config.updatedAt = datetime(),
    config.version = "1.1.0"
RETURN config.name, config.version, config.updatedAt;
