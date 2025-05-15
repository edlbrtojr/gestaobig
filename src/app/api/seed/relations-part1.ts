// Parte 1: Relações básicas de risco e plano de ação

export const relationsPartOne = async (runQuery: Function) => {
  // Relações entre Riscos e Planos de Ação
  await runQuery(`
    MATCH (r:Risco {name: "Falha no backup"})
    MATCH (p:PlanoDeAcao {name: "Revisar política de backup"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Obsolescência tecnológica"})
    MATCH (p:PlanoDeAcao {name: "Modernização tecnológica"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Vazamento de dados"})
    MATCH (p:PlanoDeAcao {name: "Implementar LGPD"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Perda de market share"})
    MATCH (p:PlanoDeAcao {name: "Expansão regional"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Alta rotatividade"})
    MATCH (p:PlanoDeAcao {name: "Programa de retenção"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Compliance tributário"})
    MATCH (p:PlanoDeAcao {name: "Otimização fiscal"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Ruptura cadeia suprimentos"})
    MATCH (p:PlanoDeAcao {name: "Diversificação fornecedores"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Reputação da marca"})
    MATCH (p:PlanoDeAcao {name: "Campanha rebranding"})
    CREATE (r)-[:MITIGADO_POR]->(p)
  `);

  // Relações entre Riscos e Estratégias
  await runQuery(`
    MATCH (r:Risco {name: "Falha no backup"})
    MATCH (e:Estrategia {name: "Segurança da informação"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Obsolescência tecnológica"})
    MATCH (e:Estrategia {name: "Transformação digital"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Vazamento de dados"})
    MATCH (e:Estrategia {name: "Conformidade regulatória"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Perda de market share"})
    MATCH (e:Estrategia {name: "Crescimento de mercado"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Alta rotatividade"})
    MATCH (e:Estrategia {name: "Cultura organizacional"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Compliance tributário"})
    MATCH (e:Estrategia {name: "Sustentabilidade financeira"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  await runQuery(`
    MATCH (r:Risco {name: "Ruptura cadeia suprimentos"})
    MATCH (e:Estrategia {name: "Eficiência operacional"})
    CREATE (r)-[:IMPACTA]->(e)
  `);

  // Relações entre Planos de Ação e Ações
  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Revisar política de backup"})
    MATCH (a:Acao {name: "Automatizar verificação de backup"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Revisar política de backup"})
    MATCH (a:Acao {name: "Implementar backup em nuvem"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Modernização tecnológica"})
    MATCH (a:Acao {name: "Atualizar sistemas legados"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Modernização tecnológica"})
    MATCH (a:Acao {name: "Migrar para novas tecnologias"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Implementar LGPD"})
    MATCH (a:Acao {name: "Realizar treinamento LGPD"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Implementar LGPD"})
    MATCH (a:Acao {name: "Implementar controles de acesso"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Expansão regional"})
    MATCH (a:Acao {name: "Abrir novas filiais"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Programa de retenção"})
    MATCH (a:Acao {name: "Realizar pesquisa salarial"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Programa de retenção"})
    MATCH (a:Acao {name: "Elaborar plano benefícios"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Otimização fiscal"})
    MATCH (a:Acao {name: "Contratar consultoria tributária"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Diversificação fornecedores"})
    MATCH (a:Acao {name: "Mapear fornecedores alternativos"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Campanha rebranding"})
    MATCH (a:Acao {name: "Desenvolver novo logo"})
    CREATE (p)-[:CONTEM]->(a)
  `);

  await runQuery(`
    MATCH (p:PlanoDeAcao {name: "Campanha rebranding"})
    MATCH (a:Acao {name: "Realizar redesign do site"})
    CREATE (p)-[:CONTEM]->(a)
  `);
};
