// Parte 3: Relações de projetos, produtos e indicadores

export const relationsPartThree = async (runQuery: Function) => {
  // Relações entre Projetos e Departamentos
  await runQuery(`
    MATCH (pr:Projeto {name: "Modernização ERP"})
    MATCH (d:Departamento {name: "Tecnologia da Informação"})
    CREATE (d)-[:GERENCIA]->(pr)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Nova Identidade Visual"})
    MATCH (d:Departamento {name: "Marketing"})
    CREATE (d)-[:GERENCIA]->(pr)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Expansão Nordeste"})
    MATCH (d:Departamento {name: "Comercial"})
    CREATE (d)-[:GERENCIA]->(pr)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Certificação ISO 27001"})
    MATCH (d:Departamento {name: "Tecnologia da Informação"})
    CREATE (d)-[:GERENCIA]->(pr)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Redução de Custos"})
    MATCH (d:Departamento {name: "Financeiro"})
    CREATE (d)-[:GERENCIA]->(pr)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Lançamento Produto X"})
    MATCH (d:Departamento {name: "Pesquisa e Desenvolvimento"})
    CREATE (d)-[:GERENCIA]->(pr)
  `);

  // Relações entre Projetos e Estratégias
  await runQuery(`
    MATCH (pr:Projeto {name: "Modernização ERP"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (pr)-[:IMPLEMENTA]->(e)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Nova Identidade Visual"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (pr)-[:IMPLEMENTA]->(e)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Expansão Nordeste"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (pr)-[:IMPLEMENTA]->(e)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Certificação ISO 27001"})
    MATCH (e:Estrategia {name: "Segurança da informação"})
    CREATE (pr)-[:IMPLEMENTA]->(e)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Redução de Custos"})
    MATCH (e:Estrategia {name: "Sustentabilidade financeira"})
    CREATE (pr)-[:IMPLEMENTA]->(e)
  `);

  await runQuery(`
    MATCH (pr:Projeto {name: "Lançamento Produto X"})
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    CREATE (pr)-[:IMPLEMENTA]->(e)
  `);

  // Relações entre Objetivos e KPIs
  await runQuery(`
    MATCH (ob:Objetivo {name: "Aumento participação mercado"})
    MATCH (kpi:KPI {name: "Market Share"})
    CREATE (kpi)-[:MONITORA]->(ob)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Redução custos operacionais"})
    MATCH (kpi:KPI {name: "ROI"})
    CREATE (kpi)-[:MONITORA]->(ob)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Aumento retenção talentos"})
    MATCH (kpi:KPI {name: "Taxa Turnover"})
    CREATE (kpi)-[:MONITORA]->(ob)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Satisfação do cliente"})
    MATCH (kpi:KPI {name: "NPS"})
    CREATE (kpi)-[:MONITORA]->(ob)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Transformação digital"})
    MATCH (kpi:KPI {name: "Incidentes de Segurança"})
    CREATE (kpi)-[:MONITORA]->(ob)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Expansão geográfica"})
    MATCH (kpi:KPI {name: "Tempo médio entrega"})
    CREATE (kpi)-[:MONITORA]->(ob)
  `);

  // Relações entre Objetivos e Estratégias
  await runQuery(`
    MATCH (ob:Objetivo {name: "Aumento participação mercado"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Redução custos operacionais"})
    MATCH (e:Estrategia {name: "Eficiência operacional"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Redução custos operacionais"})
    MATCH (e:Estrategia {name: "Sustentabilidade financeira"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Aumento retenção talentos"})
    MATCH (e:Estrategia {name: "Cultura organizacional"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Satisfação do cliente"})
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Transformação digital"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  await runQuery(`
    MATCH (ob:Objetivo {name: "Expansão geográfica"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (ob)-[:SUPORTA]->(e)
  `);

  // Relações entre Produtos e Mercados
  await runQuery(`
    MATCH (prod:Produto {name: "Produto A"})
    MATCH (merc:Mercado {name: "Sudeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto A"})
    MATCH (merc:Mercado {name: "Sul"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto B"})
    MATCH (merc:Mercado {name: "Sudeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto B"})
    MATCH (merc:Mercado {name: "Nordeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto C"})
    MATCH (merc:Mercado {name: "Sudeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto C"})
    MATCH (merc:Mercado {name: "Centro-Oeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto D"})
    MATCH (merc:Mercado {name: "Sudeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto D"})
    MATCH (merc:Mercado {name: "Sul"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto D"})
    MATCH (merc:Mercado {name: "Mercosul"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto E"})
    MATCH (merc:Mercado {name: "Norte"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  await runQuery(`
    MATCH (prod:Produto {name: "Produto F"})
    MATCH (merc:Mercado {name: "Sudeste"})
    CREATE (prod)-[:VENDIDO_EM]->(merc)
  `);

  // Relações entre Produtos e Departamentos responsáveis
  await runQuery(`
    MATCH (prod:Produto)
    MATCH (d:Departamento {name: "Pesquisa e Desenvolvimento"})
    CREATE (d)-[:DESENVOLVE]->(prod)
  `);

  await runQuery(`
    MATCH (prod:Produto)
    MATCH (d:Departamento {name: "Comercial"})
    CREATE (d)-[:COMERCIALIZA]->(prod)
  `);

  // Relações entre Tecnologias e Estratégias
  await runQuery(`
    MATCH (t:Tecnologia {name: "Cloud Computing"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (t)-[:HABILITA]->(e)
  `);

  await runQuery(`
    MATCH (t:Tecnologia {name: "Big Data Analytics"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (t)-[:HABILITA]->(e)
  `);

  await runQuery(`
    MATCH (t:Tecnologia {name: "Inteligência Artificial"})
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    CREATE (t)-[:HABILITA]->(e)
  `);

  await runQuery(`
    MATCH (t:Tecnologia {name: "Blockchain"})
    MATCH (e:Estrategia {name: "Segurança da informação"})
    CREATE (t)-[:HABILITA]->(e)
  `);

  await runQuery(`
    MATCH (t:Tecnologia {name: "RPA"})
    MATCH (e:Estrategia {name: "Eficiência operacional"})
    CREATE (t)-[:HABILITA]->(e)
  `);

  // Relações entre Stakeholders e Estratégias
  await runQuery(`
    MATCH (s:Stakeholder {name: "Conselho Administrativo"})
    MATCH (e:Estrategia)
    CREATE (s)-[:INFLUENCIA]->(e)
  `);

  await runQuery(`
    MATCH (s:Stakeholder {name: "Clientes"})
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    CREATE (s)-[:INFLUENCIA]->(e)
  `);

  await runQuery(`
    MATCH (s:Stakeholder {name: "Órgãos Reguladores"})
    MATCH (e:Estrategia {name: "Conformidade regulatória"})
    CREATE (s)-[:INFLUENCIA]->(e)
  `);

  await runQuery(`
    MATCH (s:Stakeholder {name: "Investidores"})
    MATCH (e:Estrategia {name: "Sustentabilidade financeira"})
    CREATE (s)-[:INFLUENCIA]->(e)
  `);
};
