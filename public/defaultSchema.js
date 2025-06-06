// Generated from schema.ts DEFAULT_SCHEMA
module.exports = {
  nodeTypes: {
    Empresa: {
      label: "Empresa",
      description: "Representa uma das empresas do sistema (FIEAC, SESI, SENAI, IEL)",
      properties: [
        { name: "nome", type: "string", required: true },
        { name: "sigla", type: "string", required: true },
        { name: "email", type: "string", required: true },
        { name: "superintendente", type: "string", required: false },
        { name: "diretor", type: "string", required: false }
      ],
      color: "#4C8EDA"
    },
    Unidade: {
      label: "Unidade",
      description: "Representa uma unidade organizacional (meio ou fim)",
      properties: [
        { name: "nome", type: "string", required: true },
        { name: "sigla", type: "string", required: true },
        { name: "tipo", type: "enum", required: true, options: ["APOIO", "NEGÓCIO"] },
        { name: "categoria", type: "enum", required: true, options: ["MEIO", "FIM"] },
        { name: "email", type: "string", required: false },
        { name: "gestor", type: "string", required: false },
        { name: "membros", type: "string", required: false },
        { name: "contagem_membros", type: "number", required: false }
      ],
      color: "#57C7E3"
    },
    Missao: {
      label: "Missao",
      description: "Define a missão de uma empresa",
      properties: [
        { name: "nome", type: "string", required: true },
        { name: "descricao", type: "string", required: true },
        { name: "definida_em", type: "date", required: false },
        { name: "ultima_alteracao_em", type: "date", required: false }
      ],
      color: "#D9534F"
    },
    Visao: {
      label: "Visao",
      description: "Define a visão de uma empresa",
      properties: [
        { name: "nome", type: "string", required: true },
        { name: "descricao", type: "string", required: true },
        { name: "definida_em", type: "date", required: false },
        { name: "ultima_alteracao_em", type: "date", required: false }
      ],
      color: "#8CC823"
    },
    Proposito: {
      label: "Proposito",
      description: "Define o propósito de uma empresa",
      properties: [
        { name: "nome", type: "string", required: true },
        { name: "descricao", type: "string", required: true },
        { name: "definida_em", type: "date", required: false },
        { name: "ultima_alteracao_em", type: "date", required: false }
      ],
      color: "#F79A20"
    },
    Negocio: {
      label: "Negocio",
      description: "Define um tipo de negócio",
      properties: [
        { name: "tipo", type: "string", required: true }
      ],
      color: "#FFC454"
    },
    SistemaApoio: {
      label: "SistemaApoio",
      description: "Representa o sistema de apoio compartilhado",
      properties: [
        { name: "nome", type: "string", required: true },
        { name: "descricao", type: "string", required: false }
      ],
      color: "#C780E8"
    }
  },
  relationshipTypes: {
    POSSUI: {
      type: "POSSUI",
      description: "Indica que uma empresa possui uma unidade",
      sourceNodeTypes: ["Empresa"],
      targetNodeTypes: ["Unidade"],
      bidirectional: false
    },
    TEM_PROPOSITO: {
      type: "TEM_PROPOSITO",
      description: "Conecta uma empresa ao seu propósito",
      sourceNodeTypes: ["Empresa"],
      targetNodeTypes: ["Proposito"],
      bidirectional: false
    },
    TEM_MISSAO: {
      type: "TEM_MISSAO",
      description: "Conecta uma empresa à sua missão",
      sourceNodeTypes: ["Empresa"],
      targetNodeTypes: ["Missao"],
      bidirectional: false
    },
    TEM_VISAO: {
      type: "TEM_VISAO",
      description: "Conecta uma empresa à sua visão",
      sourceNodeTypes: ["Empresa"],
      targetNodeTypes: ["Visao"],
      bidirectional: false
    },
    INCLUI: {
      type: "INCLUI",
      description: "Indica que o sistema de apoio inclui uma unidade meio",
      sourceNodeTypes: ["SistemaApoio"],
      targetNodeTypes: ["Unidade"],
      bidirectional: false
    },
    PRESTA_SERVICO_PARA: {
      type: "PRESTA_SERVICO_PARA",
      description: "Indica que o sistema de apoio presta serviço para uma empresa",
      sourceNodeTypes: ["SistemaApoio"],
      targetNodeTypes: ["Empresa"],
      bidirectional: false
    },
    ATUA_EM: {
      type: "ATUA_EM",
      description: "Indica o tipo de negócio em que uma unidade atua",
      sourceNodeTypes: ["Unidade"],
      targetNodeTypes: ["Negocio"],
      bidirectional: false
    }
  }
}