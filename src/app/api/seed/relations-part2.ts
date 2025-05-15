// Parte 2: Relações estratégicas e organizacionais

export const relationsPartTwo = async (runQuery: Function) => {
  // Relações entre Estratégias e Missões
  await runQuery(`
    MATCH (e:Estrategia {name: "Segurança da informação"})
    MATCH (m:Missao {name: "Proteger os ativos digitais"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Transformação digital"})
    MATCH (m:Missao {name: "Promover inovação responsável"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Conformidade regulatória"})
    MATCH (m:Missao {name: "Proteger os ativos digitais"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    MATCH (m:Missao {name: "Gerar valor para stakeholders"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Eficiência operacional"})
    MATCH (m:Missao {name: "Gerar valor para stakeholders"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Sustentabilidade financeira"})
    MATCH (m:Missao {name: "Gerar valor para stakeholders"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    MATCH (m:Missao {name: "Promover inovação responsável"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  await runQuery(`
    MATCH (e:Estrategia {name: "Cultura organizacional"})
    MATCH (m:Missao {name: "Contribuir para sociedade"})
    CREATE (e)-[:ALINHADA_COM]->(m)
  `);

  // Relações de Missão para Visão
  await runQuery(`
    MATCH (m:Missao)
    MATCH (v:Visao {name: "Ser referência em inovação e excelência"})
    CREATE (m)-[:CONTRIBUI_PARA]->(v)
  `);

  // Relações de Oportunidades para Estratégias
  await runQuery(`
    MATCH (o:Oportunidade {name: "Adoção de IA"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (o)-[:VIABILIZA]->(e)
  `);

  await runQuery(`
    MATCH (o:Oportunidade {name: "Expansão internacional"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (o)-[:VIABILIZA]->(e)
  `);

  await runQuery(`
    MATCH (o:Oportunidade {name: "Aquisição de concorrentes"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (o)-[:VIABILIZA]->(e)
  `);

  await runQuery(`
    MATCH (o:Oportunidade {name: "Novos canais digitais"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (o)-[:VIABILIZA]->(e)
  `);

  await runQuery(`
    MATCH (o:Oportunidade {name: "ESG"})
    MATCH (e:Estrategia {name: "Cultura organizacional"})
    CREATE (o)-[:VIABILIZA]->(e)
  `);

  await runQuery(`
    MATCH (o:Oportunidade {name: "Novas linhas de produtos"})
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    CREATE (o)-[:VIABILIZA]->(e)
  `);

  // Relações entre Departamentos e Planos de Ação
  await runQuery(`
    MATCH (d:Departamento {name: "Tecnologia da Informação"})
    MATCH (p:PlanoDeAcao {name: "Revisar política de backup"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Tecnologia da Informação"})
    MATCH (p:PlanoDeAcao {name: "Modernização tecnológica"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Jurídico"})
    MATCH (p:PlanoDeAcao {name: "Implementar LGPD"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Comercial"})
    MATCH (p:PlanoDeAcao {name: "Expansão regional"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Recursos Humanos"})
    MATCH (p:PlanoDeAcao {name: "Programa de retenção"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Financeiro"})
    MATCH (p:PlanoDeAcao {name: "Otimização fiscal"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Operações"})
    MATCH (p:PlanoDeAcao {name: "Diversificação fornecedores"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Marketing"})
    MATCH (p:PlanoDeAcao {name: "Campanha rebranding"})
    CREATE (d)-[:RESPONSAVEL_POR]->(p)
  `);

  // Relações entre Departamentos e Estratégias
  await runQuery(`
    MATCH (d:Departamento {name: "Tecnologia da Informação"})
    MATCH (e:Estrategia {name: "Segurança da informação"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Tecnologia da Informação"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Jurídico"})
    MATCH (e:Estrategia {name: "Conformidade regulatória"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Comercial"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Operações"})
    MATCH (e:Estrategia {name: "Eficiência operacional"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Financeiro"})
    MATCH (e:Estrategia {name: "Sustentabilidade financeira"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Pesquisa e Desenvolvimento"})
    MATCH (e:Estrategia {name: "Inovação de produtos"})
    CREATE (d)-[:APOIA]->(e)
  `);

  await runQuery(`
    MATCH (d:Departamento {name: "Recursos Humanos"})
    MATCH (e:Estrategia {name: "Cultura organizacional"})
    CREATE (d)-[:APOIA]->(e)
  `);
};
