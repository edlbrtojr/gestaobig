import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";
import { relationsPartOne } from "./relations-part1";
import { relationsPartTwo } from "./relations-part2";
import { relationsPartThree } from "./relations-part3";

/**
 * POST handler for /api/seed endpoint
 * Seeds the Neo4j database with sample data
 */
export async function POST() {
  try {
    // Clear existing data
    await runQuery(`MATCH (n) DETACH DELETE n`);

    // Create nodes
    const createNodesQuery = `
      // Riscos
      CREATE (r1:Risco {name: "Falha no backup", description: "Sistemas críticos sem backup funcional", impact: "Alto", area: "TI"})
      CREATE (r2:Risco {name: "Obsolescência tecnológica", description: "Tecnologias desatualizadas", impact: "Médio", area: "TI"})
      CREATE (r3:Risco {name: "Vazamento de dados", description: "Comprometimento de informações sensíveis", impact: "Alto", area: "TI"})
      CREATE (r4:Risco {name: "Perda de market share", description: "Concorrência agressiva no mercado", impact: "Alto", area: "Comercial"})
      CREATE (r5:Risco {name: "Alta rotatividade", description: "Perda de talentos e conhecimento", impact: "Médio", area: "RH"})
      CREATE (r6:Risco {name: "Compliance tributário", description: "Não conformidade com legislação fiscal", impact: "Alto", area: "Financeiro"})
      CREATE (r7:Risco {name: "Ruptura cadeia suprimentos", description: "Falhas logísticas com fornecedores", impact: "Alto", area: "Operações"})
      CREATE (r8:Risco {name: "Reputação da marca", description: "Danos à imagem corporativa", impact: "Alto", area: "Marketing"})
      
      // Planos de Ação
      CREATE (p1:PlanoDeAcao {name: "Revisar política de backup", status: "Em andamento", priority: "Alta", responsavel: "Diretor de TI"})
      CREATE (p2:PlanoDeAcao {name: "Modernização tecnológica", status: "Planejado", priority: "Média", responsavel: "CTO"})
      CREATE (p3:PlanoDeAcao {name: "Implementar LGPD", status: "Em andamento", priority: "Alta", responsavel: "Jurídico/TI"})
      CREATE (p4:PlanoDeAcao {name: "Expansão regional", status: "Em andamento", priority: "Alta", responsavel: "Diretor Comercial"})
      CREATE (p5:PlanoDeAcao {name: "Programa de retenção", status: "Planejado", priority: "Alta", responsavel: "Diretor de RH"})
      CREATE (p6:PlanoDeAcao {name: "Otimização fiscal", status: "Em andamento", priority: "Média", responsavel: "CFO"})
      CREATE (p7:PlanoDeAcao {name: "Diversificação fornecedores", status: "Planejado", priority: "Alta", responsavel: "Diretor de Suprimentos"})
      CREATE (p8:PlanoDeAcao {name: "Campanha rebranding", status: "Em execução", priority: "Alta", responsavel: "CMO"})
      
      // Ações
      CREATE (a1:Acao {name: "Automatizar verificação de backup", status: "Pendente", assignee: "Equipe Infraestrutura"})
      CREATE (a2:Acao {name: "Implementar backup em nuvem", status: "Em andamento", assignee: "Equipe Infraestrutura"})
      CREATE (a3:Acao {name: "Atualizar sistemas legados", status: "Planejado", assignee: "Equipe Desenvolvimento"})
      CREATE (a4:Acao {name: "Migrar para novas tecnologias", status: "Planejado", assignee: "Equipe Arquitetura"})
      CREATE (a5:Acao {name: "Realizar treinamento LGPD", status: "Concluído", assignee: "RH"})
      CREATE (a6:Acao {name: "Implementar controles de acesso", status: "Em andamento", assignee: "Equipe Segurança"})
      CREATE (a7:Acao {name: "Abrir novas filiais", status: "Em andamento", assignee: "Expansão Comercial"})
      CREATE (a8:Acao {name: "Realizar pesquisa salarial", status: "Concluído", assignee: "RH"})
      CREATE (a9:Acao {name: "Revisar contratos fornecedores", status: "Em andamento", assignee: "Jurídico"})
      CREATE (a10:Acao {name: "Desenvolver novo logo", status: "Concluído", assignee: "Marketing"})
      CREATE (a11:Acao {name: "Elaborar plano benefícios", status: "Planejado", assignee: "RH"})
      CREATE (a12:Acao {name: "Contratar consultoria tributária", status: "Concluído", assignee: "Financeiro"})
      CREATE (a13:Acao {name: "Mapear fornecedores alternativos", status: "Em andamento", assignee: "Suprimentos"})
      CREATE (a14:Acao {name: "Realizar redesign do site", status: "Em andamento", assignee: "Marketing Digital"})
      
      // Estratégias
      CREATE (e1:Estrategia {name: "Segurança da informação", timeframe: "2023-2025", owner: "CTO"})
      CREATE (e2:Estrategia {name: "Transformação digital", timeframe: "2022-2024", owner: "CIO"})
      CREATE (e3:Estrategia {name: "Conformidade regulatória", timeframe: "2023-2026", owner: "Diretor Jurídico"})
      CREATE (e4:Estrategia {name: "Crescimento de mercado", timeframe: "2023-2027", owner: "CEO"})
      CREATE (e5:Estrategia {name: "Eficiência operacional", timeframe: "2022-2024", owner: "COO"})
      CREATE (e6:Estrategia {name: "Sustentabilidade financeira", timeframe: "2023-2025", owner: "CFO"})
      CREATE (e7:Estrategia {name: "Inovação de produtos", timeframe: "2023-2026", owner: "Diretor de Inovação"})
      CREATE (e8:Estrategia {name: "Cultura organizacional", timeframe: "2022-2025", owner: "Diretor de RH"})
      
      // Visão e Missão
      CREATE (v1:Visao {name: "Ser referência em inovação e excelência", description: "Tornar-se líder nos segmentos que atua até 2030"})
      CREATE (m1:Missao {name: "Proteger os ativos digitais", description: "Garantir a integridade e disponibilidade dos dados"})
      CREATE (m2:Missao {name: "Promover inovação responsável", description: "Inovar com segurança e responsabilidade"})
      CREATE (m3:Missao {name: "Gerar valor para stakeholders", description: "Criar soluções que gerem valor para todos os envolvidos"})
      CREATE (m4:Missao {name: "Contribuir para sociedade", description: "Desenvolver negócios sustentáveis e responsáveis"})
      
      // Oportunidades
      CREATE (o1:Oportunidade {name: "Adoção de IA", description: "Implementar soluções de IA para segurança", potential: "Alto", area: "TI"})
      CREATE (o2:Oportunidade {name: "Expansão internacional", description: "Novos mercados com novas regulações", potential: "Médio", area: "Comercial"})
      CREATE (o3:Oportunidade {name: "Aquisição de concorrentes", description: "Compra de empresas menores", potential: "Alto", area: "Diretoria"})
      CREATE (o4:Oportunidade {name: "Novos canais digitais", description: "E-commerce e marketplace", potential: "Alto", area: "Marketing"})
      CREATE (o5:Oportunidade {name: "ESG", description: "Iniciativas ambientais e sociais", potential: "Médio", area: "Sustentabilidade"})
      CREATE (o6:Oportunidade {name: "Novas linhas de produtos", description: "Desenvolvimento de novos segmentos", potential: "Alto", area: "P&D"})
      
      // Departamentos
      CREATE (d1:Departamento {name: "Tecnologia da Informação", sigla: "TI", diretor: "Carlos Silva", headcount: 42})
      CREATE (d2:Departamento {name: "Recursos Humanos", sigla: "RH", diretor: "Ana Paula Souza", headcount: 15})
      CREATE (d3:Departamento {name: "Financeiro", sigla: "FIN", diretor: "Roberto Mendes", headcount: 28})
      CREATE (d4:Departamento {name: "Marketing", sigla: "MKT", diretor: "Juliana Costa", headcount: 23})
      CREATE (d5:Departamento {name: "Comercial", sigla: "COM", diretor: "Fernando Almeida", headcount: 65})
      CREATE (d6:Departamento {name: "Operações", sigla: "OPS", diretor: "Márcia Santos", headcount: 78})
      CREATE (d7:Departamento {name: "Jurídico", sigla: "JUR", diretor: "Paulo Oliveira", headcount: 12})
      CREATE (d8:Departamento {name: "Pesquisa e Desenvolvimento", sigla: "P&D", diretor: "Luciana Martins", headcount: 31})
      
      // Projetos
      CREATE (pr1:Projeto {name: "Modernização ERP", orcamento: 1200000, inicio: "2023-01", fim: "2023-12", status: "Em andamento"})
      CREATE (pr2:Projeto {name: "Nova Identidade Visual", orcamento: 350000, inicio: "2023-03", fim: "2023-09", status: "Concluído"})
      CREATE (pr3:Projeto {name: "Expansão Nordeste", orcamento: 5000000, inicio: "2023-06", fim: "2024-12", status: "Em andamento"})
      CREATE (pr4:Projeto {name: "Certificação ISO 27001", orcamento: 280000, inicio: "2023-04", fim: "2024-03", status: "Em andamento"})
      CREATE (pr5:Projeto {name: "Redução de Custos", orcamento: 150000, inicio: "2023-01", fim: "2023-12", status: "Em andamento"})
      CREATE (pr6:Projeto {name: "Lançamento Produto X", orcamento: 2500000, inicio: "2023-07", fim: "2024-06", status: "Em andamento"})
      
      // Objetivos
      CREATE (ob1:Objetivo {name: "Aumento participação mercado", meta: "25% em 3 anos", indicador: "Market share", baseline: "15%"})
      CREATE (ob2:Objetivo {name: "Redução custos operacionais", meta: "12% em 2 anos", indicador: "% despesas/receita", baseline: "32%"})
      CREATE (ob3:Objetivo {name: "Aumento retenção talentos", meta: "Turnover < 10%", indicador: "Taxa de turnover", baseline: "18%"})
      CREATE (ob4:Objetivo {name: "Satisfação do cliente", meta: "NPS > 65", indicador: "Net Promoter Score", baseline: "48"})
      CREATE (ob5:Objetivo {name: "Transformação digital", meta: "80% dos processos", indicador: "% digitalização", baseline: "45%"})
      CREATE (ob6:Objetivo {name: "Expansão geográfica", meta: "Presença em 5 novos estados", indicador: "Novos mercados", baseline: "0"})
      
      // Indicadores de Performance
      CREATE (kpi1:KPI {name: "ROI", valor: "22%", meta: "25%", tendencia: "Positiva"})
      CREATE (kpi2:KPI {name: "Taxa Turnover", valor: "15%", meta: "10%", tendencia: "Estável"})
      CREATE (kpi3:KPI {name: "NPS", valor: "52", meta: "65", tendencia: "Positiva"})
      CREATE (kpi4:KPI {name: "Market Share", valor: "17%", meta: "25%", tendencia: "Positiva"})
      CREATE (kpi5:KPI {name: "Incidentes de Segurança", valor: "8", meta: "0", tendencia: "Negativa"})
      CREATE (kpi6:KPI {name: "Tempo médio entrega", valor: "12 dias", meta: "7 dias", tendencia: "Estável"})
      
      // Stakeholders
      CREATE (s1:Stakeholder {name: "Conselho Administrativo", tipo: "Interno", influencia: "Alta"})
      CREATE (s2:Stakeholder {name: "Colaboradores", tipo: "Interno", influencia: "Média"})
      CREATE (s3:Stakeholder {name: "Clientes", tipo: "Externo", influencia: "Alta"})
      CREATE (s4:Stakeholder {name: "Fornecedores", tipo: "Externo", influencia: "Média"})
      CREATE (s5:Stakeholder {name: "Órgãos Reguladores", tipo: "Externo", influencia: "Alta"})
      CREATE (s6:Stakeholder {name: "Concorrentes", tipo: "Externo", influencia: "Média"})
      CREATE (s7:Stakeholder {name: "Comunidade local", tipo: "Externo", influencia: "Baixa"})
      CREATE (s8:Stakeholder {name: "Investidores", tipo: "Externo", influencia: "Alta"})
      
      // Tecnologias
      CREATE (t1:Tecnologia {name: "Cloud Computing", status: "Implementado", criticidade: "Alta"})
      CREATE (t2:Tecnologia {name: "Big Data Analytics", status: "Em implementação", criticidade: "Média"})
      CREATE (t3:Tecnologia {name: "Inteligência Artificial", status: "Piloto", criticidade: "Alta"})
      CREATE (t4:Tecnologia {name: "IoT", status: "Planejado", criticidade: "Baixa"})
      CREATE (t5:Tecnologia {name: "Blockchain", status: "Investigação", criticidade: "Média"})
      CREATE (t6:Tecnologia {name: "RPA", status: "Implementado", criticidade: "Média"})
      
      // Produtos
      CREATE (prod1:Produto {name: "Produto A", lancamento: "2018", categoria: "Premium", receita_anual: 12000000})
      CREATE (prod2:Produto {name: "Produto B", lancamento: "2020", categoria: "Standard", receita_anual: 8500000})
      CREATE (prod3:Produto {name: "Produto C", lancamento: "2021", categoria: "Econômico", receita_anual: 5000000})
      CREATE (prod4:Produto {name: "Produto D", lancamento: "2019", categoria: "Premium", receita_anual: 9500000})
      CREATE (prod5:Produto {name: "Produto E", lancamento: "2022", categoria: "Standard", receita_anual: 3200000})
      CREATE (prod6:Produto {name: "Produto F", lancamento: "2023", categoria: "Premium", receita_anual: 1800000})
      
      // Mercados
      CREATE (merc1:Mercado {name: "Sudeste", tipo: "Regional", participacao: "45%", crescimento: "3%"})
      CREATE (merc2:Mercado {name: "Sul", tipo: "Regional", participacao: "25%", crescimento: "5%"})
      CREATE (merc3:Mercado {name: "Nordeste", tipo: "Regional", participacao: "12%", crescimento: "8%"})
      CREATE (merc4:Mercado {name: "Centro-Oeste", tipo: "Regional", participacao: "10%", crescimento: "4%"})
      CREATE (merc5:Mercado {name: "Norte", tipo: "Regional", participacao: "8%", crescimento: "6%"})
      CREATE (merc6:Mercado {name: "Mercosul", tipo: "Internacional", participacao: "5%", crescimento: "10%"})
      
      // Competidores
      CREATE (comp1:Competidor {name: "Empresa X", porte: "Grande", marketshare: "30%", ameaca: "Alta"})
      CREATE (comp2:Competidor {name: "Empresa Y", porte: "Médio", marketshare: "15%", ameaca: "Média"})
      CREATE (comp3:Competidor {name: "Empresa Z", porte: "Pequeno", marketshare: "5%", ameaca: "Baixa"})
      CREATE (comp4:Competidor {name: "Startup A", porte: "Pequeno", marketshare: "3%", ameaca: "Alta"})
      CREATE (comp5:Competidor {name: "Multinacional B", porte: "Grande", marketshare: "20%", ameaca: "Alta"})
    `;

    // Execute the queries in sequence
    await runQuery(createNodesQuery);

    // Criar relações em lotes
    console.log("Criando relações parte 1...");
    await relationsPartOne(runQuery);

    console.log("Criando relações parte 2...");
    await relationsPartTwo(runQuery);

    console.log("Criando relações parte 3...");
    await relationsPartThree(runQuery);

    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
