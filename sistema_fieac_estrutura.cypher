// Sistema FIEAC - Estrutura Organizacional
// Script Cypher para criação da estrutura organizacional do Sistema FIEAC

// ==========================================================
// CONSTRAINTS E ÍNDICES
// ==========================================================

// Constraints de unicidade
CREATE CONSTRAINT sistema_nome IF NOT EXISTS FOR (s:Sistema) REQUIRE s.nome IS UNIQUE;
CREATE CONSTRAINT instituicao_nome IF NOT EXISTS FOR (i:Instituicao) REQUIRE i.nome IS UNIQUE;
CREATE CONSTRAINT unidade_nome_instituicao IF NOT EXISTS FOR (u:UnidadeNegocio) REQUIRE (u.nome, u.instituicao) IS UNIQUE;

// Newer syntax for creating indexes
CREATE INDEX FOR (n:Sistema) ON (n.nivel);
CREATE INDEX FOR (n:Instituicao) ON (n.nivel);
CREATE INDEX FOR (n:Governanca) ON (n.nivel);
CREATE INDEX FOR (n:Direcao) ON (n.nivel);
CREATE INDEX FOR (n:Superintendencia) ON (n.nivel);
CREATE INDEX FOR (n:Gerencia) ON (n.nivel);
CREATE INDEX FOR (n:AreaFim) ON (n.categoria);
CREATE INDEX FOR (n:AreaMeio) ON (n.categoria);
CREATE INDEX FOR (n:UnidadeNegocio) ON (n.negocio);

// ==========================================================
// CRIAÇÃO DOS NÓS
// ==========================================================

// 1. Sistema (Nó Raiz)
MERGE (sistema:Sistema {
  nome: "Sistema FIEAC", 
  tipo: "sistema", 
  nivel: 0
})
SET sistema.cor = "#1f4e79";

// 2. Instituições
MERGE (sesi:Instituicao {
  nome: "SESI", 
  tipo: "instituicao", 
  nivel: 1,
  missao: "Promover a qualidade de vida do trabalhador e de seus dependentes, com foco na educação, saúde e lazer, e estimular a gestão socialmente responsável da empresa industrial."
})
SET sesi.cor = "#4472c4";

MERGE (senai:Instituicao {
  nome: "SENAI", 
  tipo: "instituicao", 
  nivel: 1,
  missao: "Promover a educação profissional e tecnológica, a inovação e a transferência de tecnologias industriais, contribuindo para elevar a competitividade da indústria brasileira."
})
SET senai.cor = "#4472c4";

MERGE (fieac:Instituicao {
  nome: "FIEAC", 
  tipo: "instituicao", 
  nivel: 1,
  missao: "Representar e liderar a classe industrial, promovendo um ambiente favorável aos negócios, à competitividade e ao desenvolvimento sustentável do Acre."
})
SET fieac.cor = "#4472c4";

MERGE (iel:Instituicao {
  nome: "IEL", 
  tipo: "instituicao", 
  nivel: 1,
  missao: "Contribuir para o desenvolvimento da indústria por meio da capacitação empresarial, do apoio à inovação e do incremento da qualidade e produtividade."
})
SET iel.cor = "#4472c4";

// 3. Governança (Conselhos)
MERGE (conselho_sesi:Governanca {
  nome: "Conselho Regional", 
  tipo: "conselho", 
  nivel: 2, 
  instituicao: "SESI"
})
SET conselho_sesi.cor = "#6fa8dc";

MERGE (conselho_senai:Governanca {
  nome: "Conselho Regional", 
  tipo: "conselho", 
  nivel: 2, 
  instituicao: "SENAI"
})
SET conselho_senai.cor = "#6fa8dc";

MERGE (conselho_fieac:Governanca {
  nome: "Conselho de Representantes", 
  tipo: "conselho", 
  nivel: 2, 
  instituicao: "FIEAC"
})
SET conselho_fieac.cor = "#6fa8dc";

MERGE (conselho_iel:Governanca {
  nome: "Conselho Regional", 
  tipo: "conselho", 
  nivel: 2, 
  instituicao: "IEL"
})
SET conselho_iel.cor = "#6fa8dc";

// 4. Direção
MERGE (direcao_sesi:Direcao {
  nome: "Direção Regional", 
  tipo: "direcao", 
  nivel: 3, 
  instituicao: "SESI"
})
SET direcao_sesi.cor = "#34a853";

MERGE (direcao_senai:Direcao {
  nome: "Direção Regional", 
  tipo: "direcao", 
  nivel: 3, 
  instituicao: "SENAI"
})
SET direcao_senai.cor = "#34a853";

MERGE (direcao_fieac:Direcao {
  nome: "Presidência", 
  tipo: "direcao", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET direcao_fieac.cor = "#34a853";

MERGE (direcao_iel:Direcao {
  nome: "Diretoria", 
  tipo: "direcao", 
  nivel: 3, 
  instituicao: "IEL"
})
SET direcao_iel.cor = "#34a853";

// 5. Superintendência
MERGE (super_sesi:Superintendencia {
  nome: "Superintendência", 
  tipo: "superintendencia", 
  nivel: 4, 
  instituicao: "SESI"
})
SET super_sesi.cor = "#93c47d";

MERGE (super_senai:Superintendencia {
  nome: "Superintendência", 
  tipo: "superintendencia", 
  nivel: 4, 
  instituicao: "SENAI"
})
SET super_senai.cor = "#93c47d";

MERGE (super_iel:Superintendencia {
  nome: "Superintendência", 
  tipo: "superintendencia", 
  nivel: 4, 
  instituicao: "IEL"
})
SET super_iel.cor = "#93c47d";

// Gestão de Áreas Compartilhadas
MERGE (gestao_compartilhada:GestaoCompartilhada {
  nome: "Superintendência FIEAC/Gestão Áreas Compartilhadas", 
  tipo: "gestao_compartilhada", 
  nivel: 4, 
  instituicao: "FIEAC"
})
SET gestao_compartilhada.cor = "#93c47d";

// 6. Gerências/Focos Estratégicos (Áreas Fim)

// SESI
MERGE (gerencia_educacao_sesi:Gerencia:AreaFim {
  nome: "Gerência de Educação", 
  tipo: "gerencia", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "SESI"
})
SET gerencia_educacao_sesi.cor = "#ff9900";

MERGE (gerencia_saude_sesi:Gerencia:AreaFim {
  nome: "Gerência de Saúde e Segurança para a Indústria", 
  tipo: "gerencia", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "SESI"
})
SET gerencia_saude_sesi.cor = "#ff9900";

// SENAI
MERGE (gerencia_edprof_senai:Gerencia:AreaFim {
  nome: "Gerência de Educação Profissional", 
  tipo: "gerencia", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "SENAI"
})
SET gerencia_edprof_senai.cor = "#ff9900";

MERGE (gerencia_tecino_senai:Gerencia:AreaFim {
  nome: "Gerência de Tecnologia e Inovação", 
  tipo: "gerencia", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "SENAI"
})
SET gerencia_tecino_senai.cor = "#ff9900";

// FIEAC
MERGE (defesa_interesse:Gerencia:AreaFim {
  nome: "Defesa de Interesse", 
  tipo: "negocio", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "FIEAC"
})
SET defesa_interesse.cor = "#ff9900";

MERGE (des_associativo:Gerencia:AreaFim {
  nome: "Desenvolvimento Associativo", 
  tipo: "negocio", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "FIEAC"
})
SET des_associativo.cor = "#ff9900";

MERGE (cin:Gerencia:AreaFim {
  nome: "Centro Internacional de Negócios", 
  tipo: "negocio", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "FIEAC"
})
SET cin.cor = "#ff9900";

// IEL
MERGE (educacao_iel:Gerencia:AreaFim {
  nome: "Educação", 
  tipo: "foco_estrategico", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "IEL"
})
SET educacao_iel.cor = "#ff9900";

MERGE (tecino_iel:Gerencia:AreaFim {
  nome: "Tecnologia e Inovação", 
  tipo: "foco_estrategico", 
  categoria: "area_fim", 
  nivel: 5, 
  instituicao: "IEL"
})
SET tecino_iel.cor = "#ff9900";

// 7. Unidades de Negócio

// SESI
MERGE (escola_sesi:UnidadeNegocio:AreaFim {
  nome: "Escola SESI", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "SESI",
  negocio: "EDUCAÇÃO"
})
SET escola_sesi.cor = "#ff9900";

MERGE (sst_sesi:UnidadeNegocio:AreaFim {
  nome: "Unidade de Saúde e Segurança para a Indústria", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "SESI",
  negocio: "SAÚDE E SEGURANÇA PARA A INDÚSTRIA"
})
SET sst_sesi.cor = "#ff9900";

// SENAI
MERGE (escola_senai:UnidadeNegocio:AreaFim {
  nome: "Escola Senai Cel. Auton Furtado", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "SENAI",
  negocio: "EDUCAÇÃO"
})
SET escola_senai.cor = "#ff9900";

MERGE (ist_senai:UnidadeNegocio:AreaFim {
  nome: "Instituto SENAI de Tecnologia Madeira e Móveis Carlos Takashi Sasai", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "SENAI",
  negocio: "EDUCAÇÃO"
})
SET ist_senai.cor = "#ff9900";

// IEL
MERGE (edu_empresarial:UnidadeNegocio:AreaFim {
  nome: "Educação Empresarial", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "IEL",
  negocio: "EDUCAÇÃO"
})
SET edu_empresarial.cor = "#ff9900";

MERGE (estagio_iel:UnidadeNegocio:AreaFim {
  nome: "Estágio", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "IEL",
  negocio: "ESTÁGIO"
})
SET estagio_iel.cor = "#ff9900";

MERGE (consultoria_iel:UnidadeNegocio:AreaFim {
  nome: "Consultoria e Inovação", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "IEL",
  negocio: "CONSULTORIA"
})
SET consultoria_iel.cor = "#ff9900";

MERGE (pesquisa_iel:UnidadeNegocio:AreaFim {
  nome: "Pesquisa", 
  tipo: "unidade_negocio", 
  categoria: "area_fim", 
  nivel: 6, 
  instituicao: "IEL",
  negocio: "PESQUISA"
})
SET pesquisa_iel.cor = "#ff9900";

// 8. Unidade Integrada do Juruá
MERGE (jurua:UnidadeRegional:AreaFim {
  nome: "Unidade Integrada do Juruá", 
  tipo: "unidade_regional", 
  categoria: "area_fim", 
  nivel: 6, 
  multifuncional: true, 
  localidade: "Juruá",
  representante_de: ["SESI", "SENAI", "IEL", "FIEAC"]
})
SET jurua.cor = "#ff9900";

// 9. Áreas de Apoio (Compartilhadas)
MERGE (asjur:AreaApoio:AreaMeio {
  nome: "ASJUR", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Assessoria Jurídica"
})
SET asjur.cor = "#9900ff";

MERGE (astec:AreaApoio:AreaMeio {
  nome: "ASTEC", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Assessoria Técnica"
})
SET astec.cor = "#9900ff";

MERGE (ascom:AreaApoio:AreaMeio {
  nome: "ASCOM", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Assessoria de Comunicação"
})
SET ascom.cor = "#9900ff";

MERGE (observatorio:AreaApoio:AreaMeio {
  nome: "OBSERVATÓRIO", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Observatório da Indústria"
})
SET observatorio.cor = "#9900ff";

MERGE (uniad:AreaApoio:AreaMeio {
  nome: "UNIAD", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Unidade Administrativa"
})
SET uniad.cor = "#9900ff";

MERGE (nucli:AreaApoio:AreaMeio {
  nome: "NUCLI", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Núcleo de Licitações"
})
SET nucli.cor = "#9900ff";

MERGE (unicont:AreaApoio:AreaMeio {
  nome: "UNICONT", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Unidade de Contabilidade"
})
SET unicont.cor = "#9900ff";

MERGE (unifin:AreaApoio:AreaMeio {
  nome: "UNIFIN", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Unidade Financeira"
})
SET unifin.cor = "#9900ff";

MERGE (unipes:AreaApoio:AreaMeio {
  nome: "UNIPES", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Unidade de Pessoas"
})
SET unipes.cor = "#9900ff";

MERGE (unitec:AreaApoio:AreaMeio {
  nome: "UNITEC", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Unidade de Tecnologia"
})
SET unitec.cor = "#9900ff";

MERGE (uniplan:AreaApoio:AreaMeio {
  nome: "UNIPLAN", 
  tipo: "area_apoio", 
  categoria: "area_meio", 
  nivel: 7, 
  compartilhada: true, 
  descricao: "Unidade de Planejamento"
})
SET uniplan.cor = "#9900ff";

// 11. Assessorias e Controles Específicos
MERGE (conselho_fiscal:Assessoria {
  nome: "Conselho Fiscal", 
  tipo: "assessoria", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET conselho_fiscal.cor = "#cc0000";

MERGE (assri:Assessoria {
  nome: "Assessoria de Relações Institucionais", 
  tipo: "assessoria", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET assri.cor = "#cc0000";

MERGE (gabinete:Assessoria {
  nome: "Coordenação de Gabinete", 
  tipo: "assessoria", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET gabinete.cor = "#cc0000";

// 12. Compliance e Controle
MERGE (compliance_sesi:Compliance {
  nome: "Compliance", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SESI"
})
SET compliance_sesi.cor = "#cc0000";

MERGE (compliance_senai:Compliance {
  nome: "Compliance", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SENAI"
})
SET compliance_senai.cor = "#cc0000";

MERGE (compliance_fieac:Compliance {
  nome: "Compliance", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET compliance_fieac.cor = "#cc0000";

MERGE (compliance_iel:Compliance {
  nome: "Compliance", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "IEL"
})
SET compliance_iel.cor = "#cc0000";

MERGE (etica_sesi:Compliance {
  nome: "Comitê de Ética", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SESI"
})
SET etica_sesi.cor = "#cc0000";

MERGE (etica_senai:Compliance {
  nome: "Comitê de Ética", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SENAI"
})
SET etica_senai.cor = "#cc0000";

MERGE (etica_fieac:Compliance {
  nome: "Comitê de Ética", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET etica_fieac.cor = "#cc0000";

MERGE (etica_iel:Compliance {
  nome: "Comitê de Ética", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "IEL"
})
SET etica_iel.cor = "#cc0000";

MERGE (auditoria_sesi:Compliance {
  nome: "Auditoria Interna", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SESI"
})
SET auditoria_sesi.cor = "#cc0000";

MERGE (auditoria_senai:Compliance {
  nome: "Auditoria Interna", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SENAI"
})
SET auditoria_senai.cor = "#cc0000";

MERGE (auditoria_fieac:Compliance {
  nome: "Auditoria Interna", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET auditoria_fieac.cor = "#cc0000";

MERGE (auditoria_iel:Compliance {
  nome: "Auditoria Interna", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "IEL"
})
SET auditoria_iel.cor = "#cc0000";

MERGE (ouvidoria_sesi:Compliance {
  nome: "Ouvidoria", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SESI"
})
SET ouvidoria_sesi.cor = "#cc0000";

MERGE (ouvidoria_senai:Compliance {
  nome: "Ouvidoria", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "SENAI"
})
SET ouvidoria_senai.cor = "#cc0000";

MERGE (ouvidoria_fieac:Compliance {
  nome: "Ouvidoria", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "FIEAC"
})
SET ouvidoria_fieac.cor = "#cc0000";

MERGE (ouvidoria_iel:Compliance {
  nome: "Ouvidoria", 
  tipo: "compliance", 
  categoria: "controle", 
  nivel: 3, 
  instituicao: "IEL"
})
SET ouvidoria_iel.cor = "#cc0000";

// ==========================================================
// CRIAÇÃO DOS RELACIONAMENTOS
// ==========================================================

// 1. Hierarquia Principal - Sistema -> Instituições
MERGE (sistema)-[:ENGLOBA]->(sesi)
MERGE (sistema)-[:ENGLOBA]->(senai)
MERGE (sistema)-[:ENGLOBA]->(fieac)
MERGE (sistema)-[:ENGLOBA]->(iel);

// 2. Instituições -> Governança
MERGE (sesi)-[:TEM_GOVERNANCA]->(conselho_sesi)
MERGE (senai)-[:TEM_GOVERNANCA]->(conselho_senai)
MERGE (fieac)-[:TEM_GOVERNANCA]->(conselho_fieac)
MERGE (iel)-[:TEM_GOVERNANCA]->(conselho_iel);

// 3. Governança -> Direção
MERGE (conselho_sesi)-[:DIRIGE]->(direcao_sesi)
MERGE (conselho_senai)-[:DIRIGE]->(direcao_senai)
MERGE (conselho_fieac)-[:DIRIGE]->(direcao_fieac)
MERGE (conselho_iel)-[:DIRIGE]->(direcao_iel);

// 4. Direção -> Superintendência
MERGE (direcao_sesi)-[:COMANDA]->(super_sesi)
MERGE (direcao_senai)-[:COMANDA]->(super_senai)
MERGE (direcao_fieac)-[:COMANDA]->(gestao_compartilhada)
MERGE (direcao_iel)-[:COMANDA]->(super_iel);

// 5. Superintendência -> Gerências
// SESI
MERGE (super_sesi)-[:GERENCIA]->(gerencia_educacao_sesi)
MERGE (super_sesi)-[:GERENCIA]->(gerencia_saude_sesi);

// SENAI
MERGE (super_senai)-[:GERENCIA]->(gerencia_edprof_senai)
MERGE (super_senai)-[:GERENCIA]->(gerencia_tecino_senai);

// FIEAC
MERGE (gestao_compartilhada)-[:GERENCIA]->(defesa_interesse)
MERGE (gestao_compartilhada)-[:GERENCIA]->(des_associativo)
MERGE (gestao_compartilhada)-[:GERENCIA]->(cin);

// IEL
MERGE (super_iel)-[:GERENCIA]->(educacao_iel)
MERGE (super_iel)-[:GERENCIA]->(tecino_iel);

// 6. Gerências -> Unidades de Negócio
// SESI
MERGE (gerencia_educacao_sesi)-[:CONTROLA]->(escola_sesi)
MERGE (gerencia_saude_sesi)-[:CONTROLA]->(sst_sesi);

// SENAI
MERGE (gerencia_edprof_senai)-[:CONTROLA]->(escola_senai)
MERGE (gerencia_edprof_senai)-[:CONTROLA]->(ist_senai);

// IEL
MERGE (educacao_iel)-[:CONTROLA]->(edu_empresarial)
MERGE (educacao_iel)-[:CONTROLA]->(estagio_iel)
MERGE (tecino_iel)-[:CONTROLA]->(consultoria_iel)
MERGE (tecino_iel)-[:CONTROLA]->(pesquisa_iel);

// 7. Unidade Integrada do Juruá
MERGE (sistema)-[:TEM_UNIDADE_REGIONAL]->(jurua)
MERGE (jurua)-[:REPRESENTA]->(sesi)
MERGE (jurua)-[:REPRESENTA]->(senai)
MERGE (jurua)-[:REPRESENTA]->(fieac)
MERGE (jurua)-[:REPRESENTA]->(iel);

// 8. Controles e Compliance
// SESI
MERGE (direcao_sesi)-[:TEM_CONTROLE]->(compliance_sesi)
MERGE (direcao_sesi)-[:TEM_CONTROLE]->(etica_sesi)
MERGE (direcao_sesi)-[:TEM_CONTROLE]->(auditoria_sesi)
MERGE (direcao_sesi)-[:TEM_CONTROLE]->(ouvidoria_sesi);

// SENAI
MERGE (direcao_senai)-[:TEM_CONTROLE]->(compliance_senai)
MERGE (direcao_senai)-[:TEM_CONTROLE]->(etica_senai)
MERGE (direcao_senai)-[:TEM_CONTROLE]->(auditoria_senai)
MERGE (direcao_senai)-[:TEM_CONTROLE]->(ouvidoria_senai);

// FIEAC
MERGE (direcao_fieac)-[:TEM_CONTROLE]->(compliance_fieac)
MERGE (direcao_fieac)-[:TEM_CONTROLE]->(etica_fieac)
MERGE (direcao_fieac)-[:TEM_CONTROLE]->(auditoria_fieac)
MERGE (direcao_fieac)-[:TEM_CONTROLE]->(ouvidoria_fieac);

// IEL
MERGE (direcao_iel)-[:TEM_CONTROLE]->(compliance_iel)
MERGE (direcao_iel)-[:TEM_CONTROLE]->(etica_iel)
MERGE (direcao_iel)-[:TEM_CONTROLE]->(auditoria_iel)
MERGE (direcao_iel)-[:TEM_CONTROLE]->(ouvidoria_iel);

// 9. Assessorias
MERGE (direcao_fieac)-[:TEM_ASSESSORIA]->(conselho_fiscal)
MERGE (direcao_fieac)-[:TEM_ASSESSORIA]->(assri)
MERGE (direcao_fieac)-[:TEM_ASSESSORIA]->(gabinete);

// 10. Áreas de Apoio
MERGE (gestao_compartilhada)-[:GERENCIA]->(asjur)
MERGE (gestao_compartilhada)-[:GERENCIA]->(astec)
MERGE (gestao_compartilhada)-[:GERENCIA]->(ascom)
MERGE (gestao_compartilhada)-[:GERENCIA]->(observatorio)
MERGE (gestao_compartilhada)-[:GERENCIA]->(uniad)
MERGE (gestao_compartilhada)-[:GERENCIA]->(nucli)
MERGE (gestao_compartilhada)-[:GERENCIA]->(unicont)
MERGE (gestao_compartilhada)-[:GERENCIA]->(unifin)
MERGE (gestao_compartilhada)-[:GERENCIA]->(unipes)
MERGE (gestao_compartilhada)-[:GERENCIA]->(unitec)
MERGE (gestao_compartilhada)-[:GERENCIA]->(uniplan);

// 11. Áreas de Apoio -> Sistema
MERGE (asjur)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (astec)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (ascom)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (observatorio)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (uniad)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (nucli)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (unicont)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (unifin)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (unipes)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (unitec)-[:APOIA {tipo: "suporte_geral"}]->(sistema)
MERGE (uniplan)-[:APOIA {tipo: "suporte_geral"}]->(sistema);

// 12. Relacionamentos entre Áreas Meio
MERGE (asjur)-[:COLABORA_COM]->(astec)
MERGE (asjur)-[:COLABORA_COM]->(nucli)
MERGE (astec)-[:COLABORA_COM]->(observatorio)
MERGE (ascom)-[:COLABORA_COM]->(observatorio)
MERGE (uniad)-[:COLABORA_COM]->(nucli)
MERGE (uniad)-[:COLABORA_COM]->(unicont)
MERGE (uniad)-[:COLABORA_COM]->(unifin)
MERGE (unicont)-[:COLABORA_COM]->(unifin)
MERGE (unipes)-[:COLABORA_COM]->(unitec)
MERGE (uniplan)-[:COLABORA_COM]->(unitec)
MERGE (uniplan)-[:COLABORA_COM]->(observatorio);

// 13. UNIPLAN -> Conhecimento compartilhado
MERGE (uniplan)-[:FORNECE_CONHECIMENTO]->(sistema);

// ==========================================================
// COMENTÁRIO FINAL
// ==========================================================
// Query Criada para representar a estrutura organizacional do Sistema FIEAC
// Permite visualização gráfica e filtragem com base em:
// - Hierarquia (propriedade nivel)
// - Tipo de unidade (propriedades categoria e tipo)
// - Instituição (propriedade instituicao)
// - Relacionamentos entre as unidades

// Para visualizar o grafo, execute:
// MATCH (n) RETURN n LIMIT 200

// Para visualizar apenas a estrutura principal:
// MATCH p=(:Sistema)-[*]->(:Instituicao)-[*]->() RETURN p 