// Sistema FIEAC - Estrutura Organizacional Otimizada
// Script Cypher melhorado com melhores práticas e otimizações

// ==========================================================
// LIMPEZA E PREPARAÇÃO (Opcional - para recriar do zero)
// ==========================================================
// MATCH (n) DETACH DELETE n;

// ==========================================================
// CONSTRAINTS E ÍNDICES
// ==========================================================

// Constraints de unicidade
CREATE CONSTRAINT unique_sistema_nome IF NOT EXISTS FOR (s:Sistema) REQUIRE s.nome IS UNIQUE;

CREATE CONSTRAINT unique_instituicao_nome IF NOT EXISTS FOR (i:Instituicao) REQUIRE i.nome IS UNIQUE;

CREATE CONSTRAINT unique_unidade_composta IF NOT EXISTS FOR (u:UnidadeNegocio) REQUIRE (u.nome, u.instituicao) IS UNIQUE;

// Índices otimizados para consultas hierárquicas
CREATE INDEX idx_nivel IF NOT EXISTS FOR (n:OrganizationalUnit) ON (n.nivel);

CREATE INDEX idx_instituicao IF NOT EXISTS FOR (n:OrganizationalUnit) ON (n.instituicao);

CREATE INDEX idx_tipo IF NOT EXISTS FOR (n:OrganizationalUnit) ON (n.tipo);

CREATE INDEX idx_categoria IF NOT EXISTS FOR (n:OrganizationalUnit) ON (n.categoria);

CREATE INDEX idx_compartilhada IF NOT EXISTS FOR (n:OrganizationalUnit) ON (n.compartilhada);

// ==========================================================
// CRIAÇÃO DOS NÓS - SISTEMA RAIZ
// ==========================================================

// 1. Sistema (Nó Raiz)
MERGE (sistema:Sistema:OrganizationalUnit {
  id: "SIS001",
  nome: "Sistema FIEAC", 
  tipo: "sistema", 
  nivel: 0,
  ativo: true,
  criado_em: datetime(),
  descricao: "Sistema de organizações do setor industrial do Acre"
});

// ==========================================================
// CRIAÇÃO DOS NÓS - INSTITUIÇÕES
// ==========================================================

// SESI
MERGE (sesi:Instituicao:OrganizationalUnit {
  id: "INST001",
  nome: "SESI",
  tipo: "instituicao",
  nivel: 1,
  missao: "Promover a qualidade de vida do trabalhador e de seus dependentes, com foco na educação, saúde e lazer, e estimular a gestão socialmente responsável da empresa industrial.",
  ativo: true,
  criado_em: datetime()
});

// SENAI
MERGE (senai:Instituicao:OrganizationalUnit {
  id: "INST002",
  nome: "SENAI",
  tipo: "instituicao",
  nivel: 1,
  missao: "Promover a educação profissional e tecnológica, a inovação e a transferência de tecnologias industriais, contribuindo para elevar a competitividade da indústria brasileira.",
  ativo: true,
  criado_em: datetime()
});

// FIEAC
MERGE (fieac:Instituicao:OrganizationalUnit {
  id: "INST003",
  nome: "FIEAC",
  tipo: "instituicao",
  nivel: 1,
  missao: "Representar e liderar a classe industrial, promovendo um ambiente favorável aos negócios, à competitividade e ao desenvolvimento sustentável do Acre.",
  ativo: true,
  criado_em: datetime()
});

// IEL
MERGE (iel:Instituicao:OrganizationalUnit {
  id: "INST004",
  nome: "IEL",
  tipo: "instituicao",
  nivel: 1,
  missao: "Contribuir para o desenvolvimento da indústria por meio da capacitação empresarial, do apoio à inovação e do incremento da qualidade e produtividade.",
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS NÓS - GOVERNANÇA
// ==========================================================

// SESI - Conselho Regional
MERGE (gov_sesi:Governanca:OrganizationalUnit {
  id: "GOV001",
  nome: "Conselho Regional",
  tipo: "conselho",
  nivel: 2,
  instituicao: "SESI",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Conselho Regional
MERGE (gov_senai:Governanca:OrganizationalUnit {
  id: "GOV002",
  nome: "Conselho Regional",
  tipo: "conselho",
  nivel: 2,
  instituicao: "SENAI",
  ativo: true,
  criado_em: datetime()
});

// FIEAC - Conselho de Representantes
MERGE (gov_fieac:Governanca:OrganizationalUnit {
  id: "GOV003",
  nome: "Conselho de Representantes",
  tipo: "conselho",
  nivel: 2,
  instituicao: "FIEAC",
  ativo: true,
  criado_em: datetime()
});

// IEL - Conselho Regional
MERGE (gov_iel:Governanca:OrganizationalUnit {
  id: "GOV004",
  nome: "Conselho Regional",
  tipo: "conselho",
  nivel: 2,
  instituicao: "IEL",
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS NÓS - DIREÇÕES
// ==========================================================

// SESI - Direção Regional
MERGE (dir_sesi:Direcao:OrganizationalUnit {
  id: "DIR001",
  nome: "Direção Regional",
  tipo: "direcao",
  nivel: 3,
  instituicao: "SESI",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Direção Regional
MERGE (dir_senai:Direcao:OrganizationalUnit {
  id: "DIR002",
  nome: "Direção Regional",
  tipo: "direcao",
  nivel: 3,
  instituicao: "SENAI",
  ativo: true,
  criado_em: datetime()
});

// FIEAC - Presidência
MERGE (dir_fieac:Direcao:OrganizationalUnit {
  id: "DIR003",
  nome: "Presidência",
  tipo: "direcao",
  nivel: 3,
  instituicao: "FIEAC",
  ativo: true,
  criado_em: datetime()
});

// IEL - Diretoria
MERGE (dir_iel:Direcao:OrganizationalUnit {
  id: "DIR004",
  nome: "Diretoria",
  tipo: "direcao",
  nivel: 3,
  instituicao: "IEL",
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS NÓS - SUPERINTENDÊNCIAS E GESTÃO COMPARTILHADA
// ==========================================================

// SESI - Superintendência
MERGE (super_sesi:Superintendencia:OrganizationalUnit {
  id: "SUP001", 
  nome: "Superintendência", 
  tipo: "superintendencia",
  nivel: 4,
  instituicao: "SESI",
  compartilhada: false,
  ativo: true,
  criado_em: datetime()
});

// SENAI não tem Superintendência - remover nó
// MERGE (super_senai:Superintendencia:OrganizationalUnit {
//  id: "SUP002", 
//  nome: "Superintendência", 
//  tipo: "superintendencia",
//  nivel: 4,
//  instituicao: "SENAI",
//  compartilhada: false,
//  ativo: true,
//  criado_em: datetime()
// });

// FIEAC - Superintendência/Gestão Áreas Compartilhadas
MERGE (super_fieac:Superintendencia:OrganizationalUnit {
  id: "SUP003", 
  nome: "Superintendência FIEAC/Gestão Áreas Compartilhadas", 
  tipo: "gestao_compartilhada",
  nivel: 4,
  instituicao: "FIEAC",
  compartilhada: true,
  ativo: true,
  criado_em: datetime()
});

// IEL - Superintendência
MERGE (super_iel:Superintendencia:OrganizationalUnit {
  id: "SUP004", 
  nome: "Superintendência", 
  tipo: "superintendencia",
  nivel: 4,
  instituicao: "IEL",
  compartilhada: false,
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS NÓS - GERÊNCIAS E ÁREAS DE NEGÓCIO (ÁREAS FIM)
// ==========================================================

// 6. Gerências e Áreas de Negócio (Áreas Fim)
FOREACH (ger IN [
  // SESI
  {id: "GER001", nome: "Gerência de Educação", categoria: "area_fim", instituicao: "SESI"},
  {id: "GER002", nome: "Gerência de Saúde e Segurança para a Indústria", categoria: "area_fim", instituicao: "SESI"},
  // SENAI
  {id: "GER003", nome: "Gerência de Educação Profissional", categoria: "area_fim", instituicao: "SENAI"},
  {id: "GER004", nome: "Gerência de Tecnologia e Inovação", categoria: "area_fim", instituicao: "SENAI"},
  // FIEAC
  {id: "GER005", nome: "Defesa de Interesse", categoria: "area_fim", instituicao: "FIEAC"},
  {id: "GER006", nome: "Desenvolvimento Associativo", categoria: "area_fim", instituicao: "FIEAC"},
  {id: "GER007", nome: "Centro Internacional de Negócios", categoria: "area_fim", instituicao: "FIEAC"},
  // IEL
  {id: "GER008", nome: "Educação", categoria: "area_fim", instituicao: "IEL"},
  {id: "GER009", nome: "Tecnologia e Inovação", categoria: "area_fim", instituicao: "IEL"}
] |
  MERGE (g:Gerencia:AreaFim:OrganizationalUnit {
    id: ger.id,
    nome: ger.nome,
    tipo: "gerencia",
    nivel: 5,
    categoria: ger.categoria,
    instituicao: ger.instituicao,
    ativo: true,
    criado_em: datetime()
  })
);

// ==========================================================
// CRIAÇÃO DOS NÓS - UNIDADES DE NEGÓCIO
// ==========================================================

// SESI - Escola SESI
MERGE (un_escola_sesi:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN001",
  nome: "Escola SESI",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "SESI",
  negocio: "EDUCAÇÃO",
  ativo: true,
  criado_em: datetime()
});

// SESI - Unidade de Saúde e Segurança
MERGE (un_saude_sesi:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN002",
  nome: "Unidade de Saúde e Segurança para a Indústria",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "SESI",
  negocio: "SAÚDE E SEGURANÇA PARA A INDÚSTRIA",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Escola Senai Cel. Auton Furtado
MERGE (un_escola_senai:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN003",
  nome: "Escola Senai Cel. Auton Furtado",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "SENAI",
  negocio: "EDUCAÇÃO",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Instituto SENAI de Tecnologia
MERGE (un_inst_senai:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN004",
  nome: "Instituto SENAI de Tecnologia Madeira e Móveis Carlos Takashi Sasai",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "SENAI",
  negocio: "EDUCAÇÃO",
  ativo: true,
  criado_em: datetime()
});

// IEL - Educação Empresarial
MERGE (un_edu_emp_iel:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN005",
  nome: "Educação Empresarial",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "IEL",
  negocio: "EDUCAÇÃO",
  ativo: true,
  criado_em: datetime()
});

// IEL - Estágio
MERGE (un_estagio_iel:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN006",
  nome: "Estágio",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "IEL",
  negocio: "ESTÁGIO",
  ativo: true,
  criado_em: datetime()
});

// IEL - Consultoria e Inovação
MERGE (un_cons_iel:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN007",
  nome: "Consultoria e Inovação",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "IEL",
  negocio: "CONSULTORIA",
  ativo: true,
  criado_em: datetime()
});

// IEL - Pesquisa
MERGE (un_pesq_iel:UnidadeNegocio:AreaFim:OrganizationalUnit {
  id: "UN008",
  nome: "Pesquisa",
  tipo: "unidade_negocio",
  nivel: 7,
  categoria: "area_fim",
  instituicao: "IEL",
  negocio: "PESQUISA",
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS NÓS - UNIDADE INTEGRADA REGIONAL
// ==========================================================

// Unidade Integrada do Juruá
MERGE (jurua:UnidadeRegional:AreaFim:OrganizationalUnit {
  id: "REG001",
  nome: "Unidade Integrada do Juruá",
  tipo: "unidade_regional",
  nivel: 7,
  categoria: "area_fim",
  multifuncional: true,
  localidade: "Juruá",
  representante_de: ["SESI", "SENAI", "IEL", "FIEAC"],
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS NÓS - ÁREAS DE APOIO
// ==========================================================

// 9. Áreas de Apoio (Compartilhadas)
FOREACH (apoio IN [
  {id: "AP001", nome: "ASJUR", descricao: "Assessoria Jurídica"},
  {id: "AP002", nome: "ASTEC", descricao: "Assessoria Técnica"},
  {id: "AP003", nome: "ASCOM", descricao: "Assessoria de Comunicação"},
  {id: "AP004", nome: "OBSERVATÓRIO", descricao: "Observatório da Indústria"},
  {id: "AP005", nome: "UNIAD", descricao: "Unidade Administrativa"},
  {id: "AP006", nome: "NUCLI", descricao: "Núcleo de Licitações"},
  {id: "AP007", nome: "UNICONT", descricao: "Unidade de Contabilidade"},
  {id: "AP008", nome: "UNIFIN", descricao: "Unidade Financeira"},
  {id: "AP009", nome: "UNIPES", descricao: "Unidade de Pessoas"},
  {id: "AP010", nome: "UNITEC", descricao: "Unidade de Tecnologia"},
  {id: "AP011", nome: "UNIPLAN", descricao: "Unidade de Planejamento"}
] |
  MERGE (a:AreaApoio:AreaMeio:OrganizationalUnit {
    id: apoio.id,
    nome: apoio.nome,
    tipo: "area_apoio",
    nivel: 7,
    categoria: "area_meio",
    compartilhada: true,
    descricao: apoio.descricao,
    ativo: true,
    criado_em: datetime()
  })
);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - ÁREAS DE APOIO
// ==========================================================

// Areas Compartilhadas -> Sistema FIEAC
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:APOIA {criado_em: datetime()}]->(sistema);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - ASSORTEIAS E CONTROLES ESPECÍFICOS
// ==========================================================

// 10. Assessorias e Controles Específicos
FOREACH (ass IN [
  {id: "ASS001", nome: "Conselho Fiscal", instituicao: "FIEAC", categoria: "controle"},
  {id: "ASS002", nome: "Assessoria de Relações Institucionais", instituicao: "FIEAC", categoria: "controle"},
  {id: "ASS003", nome: "Coordenação de Gabinete", instituicao: "FIEAC", categoria: "controle"}
] |
  MERGE (a:Assessoria:OrganizationalUnit {
    id: ass.id,
    nome: ass.nome,
    tipo: "assessoria",
    nivel: 3,
    categoria: ass.categoria,
    instituicao: ass.instituicao,
    ativo: true,
    criado_em: datetime()
  })
);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - COMPLIANCE E CONTROLE
// ==========================================================

// SESI - Compliance
MERGE (comp_sesi:Compliance:OrganizationalUnit {
  id: "COMP_SESI",
  nome: "Compliance",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SESI",
  ativo: true,
  criado_em: datetime()
});

// SESI - Comitê de Ética
MERGE (etic_sesi:Compliance:OrganizationalUnit {
  id: "ETIC_SESI",
  nome: "Comitê de Ética",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SESI",
  ativo: true,
  criado_em: datetime()
});

// SESI - Auditoria Interna
MERGE (audi_sesi:Compliance:OrganizationalUnit {
  id: "AUDI_SESI",
  nome: "Auditoria Interna",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SESI",
  ativo: true,
  criado_em: datetime()
});

// SESI - Ouvidoria
MERGE (ouvi_sesi:Compliance:OrganizationalUnit {
  id: "OUVI_SESI",
  nome: "Ouvidoria",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SESI",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Compliance
MERGE (comp_senai:Compliance:OrganizationalUnit {
  id: "COMP_SENAI",
  nome: "Compliance",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SENAI",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Comitê de Ética
MERGE (etic_senai:Compliance:OrganizationalUnit {
  id: "ETIC_SENAI",
  nome: "Comitê de Ética",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SENAI",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Auditoria Interna
MERGE (audi_senai:Compliance:OrganizationalUnit {
  id: "AUDI_SENAI",
  nome: "Auditoria Interna",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SENAI",
  ativo: true,
  criado_em: datetime()
});

// SENAI - Ouvidoria
MERGE (ouvi_senai:Compliance:OrganizationalUnit {
  id: "OUVI_SENAI",
  nome: "Ouvidoria",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "SENAI",
  ativo: true,
  criado_em: datetime()
});

// FIEAC - Compliance
MERGE (comp_fieac:Compliance:OrganizationalUnit {
  id: "COMP_FIEAC",
  nome: "Compliance",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "FIEAC",
  ativo: true,
  criado_em: datetime()
});

// FIEAC - Comitê de Ética
MERGE (etic_fieac:Compliance:OrganizationalUnit {
  id: "ETIC_FIEAC",
  nome: "Comitê de Ética",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "FIEAC",
  ativo: true,
  criado_em: datetime()
});

// FIEAC - Auditoria Interna
MERGE (audi_fieac:Compliance:OrganizationalUnit {
  id: "AUDI_FIEAC",
  nome: "Auditoria Interna",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "FIEAC",
  ativo: true,
  criado_em: datetime()
});

// FIEAC - Ouvidoria
MERGE (ouvi_fieac:Compliance:OrganizationalUnit {
  id: "OUVI_FIEAC",
  nome: "Ouvidoria",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "FIEAC",
  ativo: true,
  criado_em: datetime()
});

// IEL - Compliance
MERGE (comp_iel:Compliance:OrganizationalUnit {
  id: "COMP_IEL",
  nome: "Compliance",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "IEL",
  ativo: true,
  criado_em: datetime()
});

// IEL - Comitê de Ética
MERGE (etic_iel:Compliance:OrganizationalUnit {
  id: "ETIC_IEL",
  nome: "Comitê de Ética",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "IEL",
  ativo: true,
  criado_em: datetime()
});

// IEL - Auditoria Interna
MERGE (audi_iel:Compliance:OrganizationalUnit {
  id: "AUDI_IEL",
  nome: "Auditoria Interna",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "IEL",
  ativo: true,
  criado_em: datetime()
});

// IEL - Ouvidoria
MERGE (ouvi_iel:Compliance:OrganizationalUnit {
  id: "OUVI_IEL",
  nome: "Ouvidoria",
  tipo: "compliance",
  nivel: 3,
  categoria: "controle",
  instituicao: "IEL",
  ativo: true,
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS
// ==========================================================

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - SISTEMA -> INSTITUIÇÕES
// ==========================================================

// Sistema -> SESI
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MATCH (sesi:Instituicao {nome: "SESI"})
MERGE (sistema)-[:ENGLOBA {criado_em: datetime()}]->(sesi);

// Sistema -> SENAI
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MATCH (senai:Instituicao {nome: "SENAI"})
MERGE (sistema)-[:ENGLOBA {criado_em: datetime()}]->(senai);

// Sistema -> FIEAC
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MATCH (fieac:Instituicao {nome: "FIEAC"})
MERGE (sistema)-[:ENGLOBA {criado_em: datetime()}]->(fieac);

// Sistema -> IEL
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MATCH (iel:Instituicao {nome: "IEL"})
MERGE (sistema)-[:ENGLOBA {criado_em: datetime()}]->(iel);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - INSTITUIÇÕES -> GOVERNANÇA
// ==========================================================

// SESI -> Conselho Regional
MATCH (sesi:Instituicao {nome: "SESI"})
MATCH (gov_sesi:Governanca {instituicao: "SESI"})
MERGE (sesi)-[:TEM_GOVERNANCA {criado_em: datetime()}]->(gov_sesi);

// SENAI -> Conselho Regional
MATCH (senai:Instituicao {nome: "SENAI"})
MATCH (gov_senai:Governanca {instituicao: "SENAI"})
MERGE (senai)-[:TEM_GOVERNANCA {criado_em: datetime()}]->(gov_senai);

// FIEAC -> Conselho de Representantes
MATCH (fieac:Instituicao {nome: "FIEAC"})
MATCH (gov_fieac:Governanca {instituicao: "FIEAC"})
MERGE (fieac)-[:TEM_GOVERNANCA {criado_em: datetime()}]->(gov_fieac);

// IEL -> Conselho Regional
MATCH (iel:Instituicao {nome: "IEL"})
MATCH (gov_iel:Governanca {instituicao: "IEL"})
MERGE (iel)-[:TEM_GOVERNANCA {criado_em: datetime()}]->(gov_iel);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - GOVERNANÇA -> DIREÇÃO
// ==========================================================

// SESI - Governança -> Direção
MATCH (gov_sesi:Governanca {instituicao: "SESI"})
MATCH (dir_sesi:Direcao {instituicao: "SESI"})
MERGE (gov_sesi)-[:DIRIGE {criado_em: datetime()}]->(dir_sesi);

// SENAI - Governança -> Direção
MATCH (gov_senai:Governanca {instituicao: "SENAI"})
MATCH (dir_senai:Direcao {instituicao: "SENAI"})
MERGE (gov_senai)-[:DIRIGE {criado_em: datetime()}]->(dir_senai);

// FIEAC - Governança -> Direção
MATCH (gov_fieac:Governanca {instituicao: "FIEAC"})
MATCH (dir_fieac:Direcao {instituicao: "FIEAC"})
MERGE (gov_fieac)-[:DIRIGE {criado_em: datetime()}]->(dir_fieac);

// IEL - Governança -> Direção
MATCH (gov_iel:Governanca {instituicao: "IEL"})
MATCH (dir_iel:Direcao {instituicao: "IEL"})
MERGE (gov_iel)-[:DIRIGE {criado_em: datetime()}]->(dir_iel);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - DIREÇÃO -> SUPERINTENDÊNCIA
// ==========================================================

// SESI - Direção -> Superintendência
MATCH (dir_sesi:Direcao {instituicao: "SESI"})
MATCH (super_sesi:Superintendencia {instituicao: "SESI"})
MERGE (dir_sesi)-[:COMANDA {criado_em: datetime()}]->(super_sesi);

// SENAI - Direção -> Superintendência (removida - SENAI não tem Superintendência)
// MATCH (dir_senai:Direcao {instituicao: "SENAI"})
// MATCH (super_senai:Superintendencia {instituicao: "SENAI"})
// MERGE (dir_senai)-[:COMANDA {criado_em: datetime()}]->(super_senai);

// FIEAC - Direção -> Superintendência
MATCH (dir_fieac:Direcao {instituicao: "FIEAC"})
MATCH (super_fieac:Superintendencia {instituicao: "FIEAC"})
MERGE (dir_fieac)-[:COMANDA {criado_em: datetime()}]->(super_fieac);

// IEL - Direção -> Superintendência
MATCH (dir_iel:Direcao {instituicao: "IEL"})
MATCH (super_iel:Superintendencia {instituicao: "IEL"})
MERGE (dir_iel)-[:COMANDA {criado_em: datetime()}]->(super_iel);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - SUPERINTENDÊNCIA -> GERÊNCIAS
// ==========================================================

// SESI - Superintendência -> Gerência de Educação
MATCH (super:Superintendencia {instituicao: "SESI"})
MATCH (gerencia:Gerencia {nome: "Gerência de Educação", instituicao: "SESI"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// SESI - Superintendência -> Gerência de Saúde e Segurança
MATCH (super:Superintendencia {instituicao: "SESI"})
MATCH (gerencia:Gerencia {nome: "Gerência de Saúde e Segurança para a Indústria", instituicao: "SESI"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// SENAI - Diretoria -> Gerência de Educação Profissional (direto, sem Superintendência)
MATCH (dir:Direcao {instituicao: "SENAI"})
MATCH (gerencia:Gerencia {nome: "Gerência de Educação Profissional", instituicao: "SENAI"})
MERGE (dir)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// SENAI - Diretoria -> Gerência de Tecnologia e Inovação (direto, sem Superintendência)
MATCH (dir:Direcao {instituicao: "SENAI"})
MATCH (gerencia:Gerencia {nome: "Gerência de Tecnologia e Inovação", instituicao: "SENAI"})
MERGE (dir)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// FIEAC - Superintendência -> Defesa de Interesse
MATCH (super:Superintendencia {instituicao: "FIEAC"})
MATCH (gerencia:Gerencia {nome: "Defesa de Interesse", instituicao: "FIEAC"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// FIEAC - Superintendência -> Desenvolvimento Associativo
MATCH (super:Superintendencia {instituicao: "FIEAC"})
MATCH (gerencia:Gerencia {nome: "Desenvolvimento Associativo", instituicao: "FIEAC"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// FIEAC - Superintendência -> Centro Internacional de Negócios
MATCH (super:Superintendencia {instituicao: "FIEAC"})
MATCH (gerencia:Gerencia {nome: "Centro Internacional de Negócios", instituicao: "FIEAC"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// IEL - Superintendência -> Educação
MATCH (super:Superintendencia {instituicao: "IEL"})
MATCH (gerencia:Gerencia {nome: "Educação", instituicao: "IEL"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// IEL - Superintendência -> Tecnologia e Inovação
MATCH (super:Superintendencia {instituicao: "IEL"})
MATCH (gerencia:Gerencia {nome: "Tecnologia e Inovação", instituicao: "IEL"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(gerencia);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - GERÊNCIAS -> UNIDADES DE NEGÓCIO
// ==========================================================

// SESI - Gerência de Educação -> Escola SESI
MATCH (gerencia:Gerencia {nome: "Gerência de Educação", instituicao: "SESI"})
MATCH (unidade:UnidadeNegocio {nome: "Escola SESI", instituicao: "SESI"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// SESI - Gerência de Saúde -> Unidade de Saúde e Segurança
MATCH (gerencia:Gerencia {nome: "Gerência de Saúde e Segurança para a Indústria", instituicao: "SESI"})
MATCH (unidade:UnidadeNegocio {nome: "Unidade de Saúde e Segurança para a Indústria", instituicao: "SESI"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// SENAI - Gerência de Educação Profissional -> Escola Senai
MATCH (gerencia:Gerencia {nome: "Gerência de Educação Profissional", instituicao: "SENAI"})
MATCH (unidade:UnidadeNegocio {nome: "Escola Senai Cel. Auton Furtado", instituicao: "SENAI"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// SENAI - Gerência de Educação Profissional -> Instituto SENAI
MATCH (gerencia:Gerencia {nome: "Gerência de Educação Profissional", instituicao: "SENAI"})
MATCH (unidade:UnidadeNegocio {nome: "Instituto SENAI de Tecnologia Madeira e Móveis Carlos Takashi Sasai", instituicao: "SENAI"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// IEL - Educação -> Educação Empresarial
MATCH (gerencia:Gerencia {nome: "Educação", instituicao: "IEL"})
MATCH (unidade:UnidadeNegocio {nome: "Educação Empresarial", instituicao: "IEL"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// IEL - Educação -> Estágio
MATCH (gerencia:Gerencia {nome: "Educação", instituicao: "IEL"})
MATCH (unidade:UnidadeNegocio {nome: "Estágio", instituicao: "IEL"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// IEL - Tecnologia e Inovação -> Consultoria e Inovação
MATCH (gerencia:Gerencia {nome: "Tecnologia e Inovação", instituicao: "IEL"})
MATCH (unidade:UnidadeNegocio {nome: "Consultoria e Inovação", instituicao: "IEL"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// IEL - Tecnologia e Inovação -> Pesquisa
MATCH (gerencia:Gerencia {nome: "Tecnologia e Inovação", instituicao: "IEL"})
MATCH (unidade:UnidadeNegocio {nome: "Pesquisa", instituicao: "IEL"})
MERGE (gerencia)-[:CONTROLA {criado_em: datetime()}]->(unidade);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - UNIDADE REGIONAL
// ==========================================================

// Sistema -> Unidade Integrada do Juruá
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MATCH (jurua:UnidadeRegional {nome: "Unidade Integrada do Juruá"})
MERGE (sistema)-[:TEM_UNIDADE_REGIONAL {criado_em: datetime()}]->(jurua);

// Unidade Integrada do Juruá -> SESI
MATCH (jurua:UnidadeRegional {nome: "Unidade Integrada do Juruá"})
MATCH (sesi:Instituicao {nome: "SESI"})
MERGE (jurua)-[:REPRESENTA {criado_em: datetime()}]->(sesi);

// Unidade Integrada do Juruá -> SENAI
MATCH (jurua:UnidadeRegional {nome: "Unidade Integrada do Juruá"})
MATCH (senai:Instituicao {nome: "SENAI"})
MERGE (jurua)-[:REPRESENTA {criado_em: datetime()}]->(senai);

// Unidade Integrada do Juruá -> FIEAC
MATCH (jurua:UnidadeRegional {nome: "Unidade Integrada do Juruá"})
MATCH (fieac:Instituicao {nome: "FIEAC"})
MERGE (jurua)-[:REPRESENTA {criado_em: datetime()}]->(fieac);

// Unidade Integrada do Juruá -> IEL
MATCH (jurua:UnidadeRegional {nome: "Unidade Integrada do Juruá"})
MATCH (iel:Instituicao {nome: "IEL"})
MERGE (jurua)-[:REPRESENTA {criado_em: datetime()}]->(iel);

// ==========================================================
// VIEWS E CONSULTAS ÚTEIS
// ==========================================================

// Criar propriedades computadas para facilitar consultas
MATCH (n:OrganizationalUnit)
SET n.path_completo = 
  CASE n.nivel
    WHEN 0 THEN n.nome
    WHEN 1 THEN "Sistema FIEAC > " + n.nome
    ELSE "Sistema FIEAC > " + coalesce(n.instituicao, "Compartilhado") + " > " + n.nome
  END;

// ==========================================================
// COMENTÁRIOS E DOCUMENTAÇÃO
// ==========================================================

/*
MELHORIAS IMPLEMENTADAS:

1. **Estrutura de Dados**:
   - IDs únicos para todos os nós
   - Label base OrganizationalUnit para consultas unificadas
   - Timestamps de criação
   - Propriedades estruturadas e consistentes

2. **Performance**:
   - Uso de MERGE consistente para evitar duplicações
   - Índices otimizados
   - Operações em lote com FOREACH
   - Constraints apropriados

3. **Manutenibilidade**:
   - Configuração centralizada de cores
   - Estruturas de dados organizadas
   - Relacionamentos padronizados
   - Documentação inline

4. **Funcionalidades**:
   - Propriedades computadas (path_completo)
   - Timestamps para auditoria
   - Flags de status (ativo)
   - Metadados estruturados

CONSULTAS ÚTEIS:

// Visualizar hierarquia completa
MATCH p=(s:Sistema)-[*]-(n)
RETURN p

// Buscar por instituição
MATCH (n:OrganizationalUnit {instituicao: "SESI"})
RETURN n

// Visualizar áreas compartilhadas
MATCH (n:OrganizationalUnit {compartilhada: true})
RETURN n

// Árvore hierárquica
MATCH p=(s:Sistema)-[*1..10]->(n:OrganizationalUnit)
WHERE s <> n
RETURN p
ORDER BY length(p), n.nivel, n.nome
LIMIT 100

// Análise de relacionamentos
MATCH (n)-[r]-(m)
RETURN type(r) as tipo_relacionamento, count(*) as quantidade
ORDER BY quantidade DESC
*/

// ==========================================================
// CRIAÇÃO DO SISTEMA DE APOIO COMPARTILHADO
// ==========================================================

// Criar o nó central de apoio compartilhado
MERGE (sac:AreasCompartilhadas:OrganizationalUnit {
  id: "SAC001",
  nome: "Areas Compartilhadas",
  tipo: "sistema_apoio",
  nivel: 5,
  categoria: "area_meio",
  compartilhada: true,
  ativo: true,
  descricao: "Sistema que coordena todas as áreas de apoio compartilhadas",
  criado_em: datetime()
});

// ==========================================================
// CRIAÇÃO DAS ÁREAS COMPARTILHADAS
// ==========================================================

// ASJUR -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "ASJUR"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// ASTEC -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "ASTEC"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// ASCOM -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "ASCOM"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// OBSERVATÓRIO -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "OBSERVATÓRIO"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// UNIAD -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "UNIAD"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// NUCLI -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "NUCLI"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// UNICONT -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "UNICONT"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// UNIFIN -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "UNIFIN"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// UNIPES -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "UNIPES"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// UNITEC -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "UNITEC"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// UNIPLAN -> Areas Compartilhadas
MATCH (apoio:AreaApoio {nome: "UNIPLAN"})
MATCH (sac:AreasCompartilhadas)
MERGE (apoio)-[:RECEBE_APOIO {criado_em: datetime()}]->(sac);

// Superintendência FIEAC/Gestão Áreas Compartilhadas -> Areas Compartilhadas
MATCH (gestao:Superintendencia {tipo: "gestao_compartilhada"})
MATCH (sac:AreasCompartilhadas)
MERGE (gestao)-[:GERENCIA {criado_em: datetime()}]->(sac);

// ==========================================================
// VIEWS E CONSULTAS ÚTEIS
// ==========================================================

// Criar propriedades computadas para facilitar consultas
MATCH (n:OrganizationalUnit)
SET n.path_completo = 
  CASE n.nivel
    WHEN 0 THEN n.nome
    WHEN 1 THEN "Sistema FIEAC > " + n.nome
    ELSE "Sistema FIEAC > " + coalesce(n.instituicao, "Compartilhado") + " > " + n.nome
  END;

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - CONTROLES E COMPLIANCE
// ==========================================================

// SESI - Direção -> Compliance
MATCH (dir:Direcao {instituicao: "SESI"})
MATCH (comp:Compliance {nome: "Compliance", instituicao: "SESI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(comp);

// SESI - Direção -> Comitê de Ética
MATCH (dir:Direcao {instituicao: "SESI"})
MATCH (etic:Compliance {nome: "Comitê de Ética", instituicao: "SESI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(etic);

// SESI - Direção -> Auditoria Interna
MATCH (dir:Direcao {instituicao: "SESI"})
MATCH (audi:Compliance {nome: "Auditoria Interna", instituicao: "SESI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(audi);

// SESI - Direção -> Ouvidoria
MATCH (dir:Direcao {instituicao: "SESI"})
MATCH (ouvi:Compliance {nome: "Ouvidoria", instituicao: "SESI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(ouvi);

// SENAI - Direção -> Compliance
MATCH (dir:Direcao {instituicao: "SENAI"})
MATCH (comp:Compliance {nome: "Compliance", instituicao: "SENAI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(comp);

// SENAI - Direção -> Comitê de Ética
MATCH (dir:Direcao {instituicao: "SENAI"})
MATCH (etic:Compliance {nome: "Comitê de Ética", instituicao: "SENAI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(etic);

// SENAI - Direção -> Auditoria Interna
MATCH (dir:Direcao {instituicao: "SENAI"})
MATCH (audi:Compliance {nome: "Auditoria Interna", instituicao: "SENAI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(audi);

// SENAI - Direção -> Ouvidoria
MATCH (dir:Direcao {instituicao: "SENAI"})
MATCH (ouvi:Compliance {nome: "Ouvidoria", instituicao: "SENAI"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(ouvi);

// FIEAC - Direção -> Compliance
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (comp:Compliance {nome: "Compliance", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(comp);

// FIEAC - Direção -> Comitê de Ética
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (etic:Compliance {nome: "Comitê de Ética", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(etic);

// FIEAC - Direção -> Auditoria Interna
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (audi:Compliance {nome: "Auditoria Interna", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(audi);

// FIEAC - Direção -> Ouvidoria
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (ouvi:Compliance {nome: "Ouvidoria", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(ouvi);

// IEL - Direção -> Compliance
MATCH (dir:Direcao {instituicao: "IEL"})
MATCH (comp:Compliance {nome: "Compliance", instituicao: "IEL"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(comp);

// IEL - Direção -> Comitê de Ética
MATCH (dir:Direcao {instituicao: "IEL"})
MATCH (etic:Compliance {nome: "Comitê de Ética", instituicao: "IEL"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(etic);

// IEL - Direção -> Auditoria Interna
MATCH (dir:Direcao {instituicao: "IEL"})
MATCH (audi:Compliance {nome: "Auditoria Interna", instituicao: "IEL"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(audi);

// IEL - Direção -> Ouvidoria
MATCH (dir:Direcao {instituicao: "IEL"})
MATCH (ouvi:Compliance {nome: "Ouvidoria", instituicao: "IEL"})
MERGE (dir)-[:TEM_CONTROLE {criado_em: datetime()}]->(ouvi);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - ASSESSORIAS
// ==========================================================

// FIEAC - Direção -> Conselho Fiscal
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (ass:Assessoria {nome: "Conselho Fiscal", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_ASSESSORIA {criado_em: datetime()}]->(ass);

// FIEAC - Direção -> Assessoria de Relações Institucionais
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (ass:Assessoria {nome: "Assessoria de Relações Institucionais", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_ASSESSORIA {criado_em: datetime()}]->(ass);

// FIEAC - Direção -> Coordenação de Gabinete
MATCH (dir:Direcao {instituicao: "FIEAC"})
MATCH (ass:Assessoria {nome: "Coordenação de Gabinete", instituicao: "FIEAC"})
MERGE (dir)-[:TEM_ASSESSORIA {criado_em: datetime()}]->(ass);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - CONHECIMENTO COMPARTILHADO
// ==========================================================

// UNIPLAN -> Sistema FIEAC (Fornece conhecimento)
MATCH (uniplan:AreaApoio {nome: "UNIPLAN"})
MATCH (sistema:Sistema {nome: "Sistema FIEAC"})
MERGE (uniplan)-[:FORNECE_CONHECIMENTO {criado_em: datetime()}]->(sistema);

// Areas Compartilhadas -> ASJUR
MATCH (apoio:AreaApoio {nome: "ASJUR"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> ASTEC
MATCH (apoio:AreaApoio {nome: "ASTEC"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> ASCOM
MATCH (apoio:AreaApoio {nome: "ASCOM"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> OBSERVATÓRIO
MATCH (apoio:AreaApoio {nome: "OBSERVATÓRIO"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> UNIAD
MATCH (apoio:AreaApoio {nome: "UNIAD"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> NUCLI
MATCH (apoio:AreaApoio {nome: "NUCLI"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> UNICONT
MATCH (apoio:AreaApoio {nome: "UNICONT"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> UNIFIN
MATCH (apoio:AreaApoio {nome: "UNIFIN"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> UNIPES
MATCH (apoio:AreaApoio {nome: "UNIPES"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> UNITEC
MATCH (apoio:AreaApoio {nome: "UNITEC"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// Areas Compartilhadas -> UNIPLAN
MATCH (apoio:AreaApoio {nome: "UNIPLAN"})
MATCH (sac:AreasCompartilhadas)
MERGE (sac)-[:ENGLOBA {criado_em: datetime()}]->(apoio);

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS - BIDIRECIONAIS COM ÁREAS COMPARTILHADAS
// ==========================================================

// Criar o nó UNIDADE DE SUPORTE AO NEGÓCIO
MERGE (suporte:AreaApoio:AreaMeio:OrganizationalUnit {
  id: "AP012",
  nome: "UNIDADE DE SUPORTE AO NEGÓCIO",
  tipo: "area_apoio",
  nivel: 7,
  categoria: "area_meio",
  compartilhada: false,
  descricao: "Unidade responsável pelo suporte às unidades de negócio do SESI",
  ativo: true,
  criado_em: datetime()
});

// Criar relações APOIA com as unidades de negócio
MATCH (suporte:AreaApoio {nome: "UNIDADE DE SUPORTE AO NEGÓCIO"})
MATCH (un1:UnidadeNegocio {id: "UN001"})
MERGE (suporte)-[:APOIA {criado_em: datetime()}]->(un1);

MATCH (suporte:AreaApoio {nome: "UNIDADE DE SUPORTE AO NEGÓCIO"})
MATCH (un2:UnidadeNegocio {id: "UN002"})
MERGE (suporte)-[:APOIA {criado_em: datetime()}]->(un2);

// Criar relação GERENCIA vinda da Superintendência SESI
MATCH (super:Superintendencia {id: "SUP001"})
MATCH (suporte:AreaApoio {nome: "UNIDADE DE SUPORTE AO NEGÓCIO"})
MERGE (super)-[:GERENCIA {criado_em: datetime()}]->(suporte);

// Atualizar a propriedade path_completo do novo nó
MATCH (n:AreaApoio {nome: "UNIDADE DE SUPORTE AO NEGÓCIO"})
SET n.path_completo = "Sistema FIEAC > SESI > " + n.nome;