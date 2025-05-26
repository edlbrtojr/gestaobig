import { NextResponse } from "next/server";
import { executeWrite } from "@/lib/neo4j";
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
    await executeWrite(`MATCH (n) DETACH DELETE n`);

    // Create nodes
    const createNodesQuery = `
      // Riscos
      CREATE (r1:Risco {name: "Falha no backup", description: "Sistemas críticos sem backup funcional", impact: "Alto", area: "TI", company: "SENAI"})
      CREATE (r2:Risco {name: "Obsolescência tecnológica", description: "Tecnologias desatualizadas", impact: "Médio", area: "TI", company: "SESI"})
      CREATE (r3:Risco {name: "Vazamento de dados", description: "Comprometimento de informações sensíveis", impact: "Alto", area: "TI", company: "FIEAC"})
      CREATE (r4:Risco {name: "Perda de market share", description: "Concorrência agressiva no mercado", impact: "Alto", area: "Comercial", company: "SENAI"})
      CREATE (r5:Risco {name: "Alta rotatividade", description: "Perda de talentos e conhecimento", impact: "Médio", area: "RH", company: "IEL"})
      CREATE (r6:Risco {name: "Compliance tributário", description: "Não conformidade com legislação fiscal", impact: "Alto", area: "Financeiro", company: "FIEAC"})
      CREATE (r7:Risco {name: "Ruptura cadeia suprimentos", description: "Falhas logísticas com fornecedores", impact: "Alto", area: "Operações", company: "SESI"})
      CREATE (r8:Risco {name: "Reputação da marca", description: "Danos à imagem corporativa", impact: "Alto", area: "Marketing", company: "SISTEMA FIEAC"})
      
      // Planos de Ação
      CREATE (p1:PlanoDeAcao {name: "Revisar política de backup", status: "Em andamento", priority: "Alta", responsavel: "Diretor de TI", company: "SENAI"})
      CREATE (p2:PlanoDeAcao {name: "Modernização tecnológica", status: "Planejado", priority: "Média", responsavel: "CTO", company: "SESI,SENAI"})
      CREATE (p3:PlanoDeAcao {name: "Implementar LGPD", status: "Em andamento", priority: "Alta", responsavel: "Jurídico/TI", company: "SISTEMA FIEAC"})
      CREATE (p4:PlanoDeAcao {name: "Expansão regional", status: "Em andamento", priority: "Alta", responsavel: "Diretor Comercial", company: "FIEAC"})
      CREATE (p5:PlanoDeAcao {name: "Programa de retenção", status: "Planejado", priority: "Alta", responsavel: "Diretor de RH", company: "IEL"})
      CREATE (p6:PlanoDeAcao {name: "Otimização fiscal", status: "Em andamento", priority: "Média", responsavel: "CFO", company: "FIEAC,SESI"})
      CREATE (p7:PlanoDeAcao {name: "Diversificação fornecedores", status: "Planejado", priority: "Alta", responsavel: "Diretor de Suprimentos", company: "SESI,IEL"})
      CREATE (p8:PlanoDeAcao {name: "Campanha rebranding", status: "Em execução", priority: "Alta", responsavel: "CMO", company: "SISTEMA FIEAC"})
      
      // Ações
      CREATE (a1:Acao {name: "Automatizar verificação de backup", status: "Pendente", assignee: "Equipe Infraestrutura", company: "SENAI"})
      CREATE (a2:Acao {name: "Implementar backup em nuvem", status: "Em andamento", assignee: "Equipe Infraestrutura", company: "SENAI,FIEAC"})
      CREATE (a3:Acao {name: "Atualizar sistemas legados", status: "Planejado", assignee: "Equipe Desenvolvimento", company: "SESI"})
      CREATE (a4:Acao {name: "Migrar para novas tecnologias", status: "Planejado", assignee: "Equipe Arquitetura", company: "SENAI,SESI"})
      CREATE (a5:Acao {name: "Realizar treinamento LGPD", status: "Concluído", assignee: "RH", company: "SISTEMA FIEAC"})
      CREATE (a6:Acao {name: "Implementar controles de acesso", status: "Em andamento", assignee: "Equipe Segurança", company: "SENAI,FIEAC"})
      CREATE (a7:Acao {name: "Abrir novas filiais", status: "Em andamento", assignee: "Expansão Comercial", company: "FIEAC"})
      CREATE (a8:Acao {name: "Realizar pesquisa salarial", status: "Concluído", assignee: "RH", company: "IEL"})
      CREATE (a9:Acao {name: "Revisar contratos fornecedores", status: "Em andamento", assignee: "Jurídico", company: "FIEAC,SESI"})
      CREATE (a10:Acao {name: "Desenvolver novo logo", status: "Concluído", assignee: "Marketing", company: "SISTEMA FIEAC"})
      CREATE (a11:Acao {name: "Elaborar plano benefícios", status: "Planejado", assignee: "RH", company: "IEL,SESI"})
      CREATE (a12:Acao {name: "Contratar consultoria tributária", status: "Concluído", assignee: "Financeiro", company: "FIEAC"})
      CREATE (a13:Acao {name: "Mapear fornecedores alternativos", status: "Em andamento", assignee: "Suprimentos", company: "SESI"})
      CREATE (a14:Acao {name: "Realizar redesign do site", status: "Em andamento", assignee: "Marketing Digital", company: "SISTEMA FIEAC"})
      
      // Estratégias
      CREATE (e1:Estrategia {name: "Segurança da informação", timeframe: "2023-2025", owner: "CTO", company: "SENAI,FIEAC"})
      CREATE (e2:Estrategia {name: "Transformação digital", timeframe: "2022-2024", owner: "CIO", company: "SISTEMA FIEAC"})
      CREATE (e3:Estrategia {name: "Conformidade regulatória", timeframe: "2023-2026", owner: "Diretor Jurídico", company: "FIEAC"})
      CREATE (e4:Estrategia {name: "Crescimento de mercado", timeframe: "2023-2027", owner: "CEO", company: "SISTEMA FIEAC"})
      CREATE (e5:Estrategia {name: "Eficiência operacional", timeframe: "2022-2024", owner: "COO", company: "SESI,SENAI"})
      CREATE (e6:Estrategia {name: "Sustentabilidade financeira", timeframe: "2023-2025", owner: "CFO", company: "FIEAC"})
      CREATE (e7:Estrategia {name: "Inovação de produtos", timeframe: "2023-2026", owner: "Diretor de Inovação", company: "SENAI"})
      CREATE (e8:Estrategia {name: "Cultura organizacional", timeframe: "2022-2025", owner: "Diretor de RH", company: "IEL,SESI"})
      
      // Visão e Missão
      CREATE (v1:Visao {name: "Ser referência em inovação e excelência", description: "Tornar-se líder nos segmentos que atua até 2030", company: "SISTEMA FIEAC"})
      CREATE (m1:Missao {name: "Proteger os ativos digitais", description: "Garantir a integridade e disponibilidade dos dados", company: "SENAI,FIEAC"})
      CREATE (m2:Missao {name: "Promover inovação responsável", description: "Inovar com segurança e responsabilidade", company: "SENAI"})
      CREATE (m3:Missao {name: "Gerar valor para stakeholders", description: "Criar soluções que gerem valor para todos os envolvidos", company: "SISTEMA FIEAC"})
      CREATE (m4:Missao {name: "Contribuir para sociedade", description: "Desenvolver negócios sustentáveis e responsáveis", company: "SESI,IEL"})
      
      // Oportunidades
      CREATE (o1:Oportunidade {name: "Adoção de IA", description: "Implementar soluções de IA para segurança", potential: "Alto", area: "TI", company: "SENAI"})
      CREATE (o2:Oportunidade {name: "Expansão internacional", description: "Novos mercados com novas regulações", potential: "Médio", area: "Comercial", company: "FIEAC"})
      CREATE (o3:Oportunidade {name: "Aquisição de concorrentes", description: "Compra de empresas menores", potential: "Alto", area: "Diretoria", company: "SISTEMA FIEAC"})
      CREATE (o4:Oportunidade {name: "Novos canais digitais", description: "E-commerce e marketplace", potential: "Alto", area: "Marketing", company: "SENAI,SESI"})
      CREATE (o5:Oportunidade {name: "ESG", description: "Iniciativas ambientais e sociais", potential: "Médio", area: "Sustentabilidade", company: "SESI,IEL"})
      CREATE (o6:Oportunidade {name: "Novas linhas de produtos", description: "Desenvolvimento de novos segmentos", potential: "Alto", area: "P&D", company: "SENAI"})
      
      // Unidades
      CREATE (d1:Unidade {name: "Tecnologia da Informação", sigla: "TI", diretor: "Carlos Silva", headcount: 42, company: "SENAI"})
      CREATE (d2:Unidade {name: "Recursos Humanos", sigla: "RH", diretor: "Ana Paula Souza", headcount: 15, company: "IEL"})
      CREATE (d3:Unidade {name: "Financeiro", sigla: "FIN", diretor: "Roberto Mendes", headcount: 28, company: "FIEAC"})
      CREATE (d4:Unidade {name: "Marketing", sigla: "MKT", diretor: "Juliana Costa", headcount: 23, company: "SISTEMA FIEAC"})
      CREATE (d5:Unidade {name: "Comercial", sigla: "COM", diretor: "Fernando Almeida", headcount: 65, company: "SESI,SENAI"})
      CREATE (d6:Unidade {name: "Operações", sigla: "OPS", diretor: "Márcia Santos", headcount: 78, company: "SESI"})
      CREATE (d7:Unidade {name: "Jurídico", sigla: "JUR", diretor: "Paulo Oliveira", headcount: 12, company: "FIEAC"})
      CREATE (d8:Unidade {name: "Pesquisa e Desenvolvimento", sigla: "P&D", diretor: "Luciana Martins", headcount: 31, company: "SENAI"})
      
      // Projetos - Novos projetos específicos para cada empresa
      CREATE (pr1:Projeto {name: "Modernização ERP", orcamento: 1200000, inicio: "2023-01", fim: "2023-12", status: "Em andamento", company: "SISTEMA FIEAC"})
      CREATE (pr2:Projeto {name: "Nova Identidade Visual", orcamento: 350000, inicio: "2023-03", fim: "2023-09", status: "Concluído", company: "SISTEMA FIEAC"})
      CREATE (pr3:Projeto {name: "Expansão Nordeste", orcamento: 5000000, inicio: "2023-06", fim: "2024-12", status: "Em andamento", company: "FIEAC"})
      CREATE (pr4:Projeto {name: "Certificação ISO 27001", orcamento: 280000, inicio: "2023-04", fim: "2024-03", status: "Em andamento", company: "SENAI"})
      CREATE (pr5:Projeto {name: "Redução de Custos", orcamento: 150000, inicio: "2023-01", fim: "2023-12", status: "Em andamento", company: "FIEAC,SESI"})
      CREATE (pr6:Projeto {name: "Lançamento Produto X", orcamento: 2500000, inicio: "2023-07", fim: "2024-06", status: "Em andamento", company: "SENAI"})
      
      // Novos projetos específicos para cada empresa
      CREATE (pr7:Projeto {name: "Programa Educação Profissional", orcamento: 3500000, inicio: "2023-08", fim: "2024-08", status: "Em andamento", company: "SENAI"})
      CREATE (pr8:Projeto {name: "Programa Saúde do Trabalhador", orcamento: 980000, inicio: "2023-09", fim: "2024-06", status: "Em andamento", company: "SESI"})
      CREATE (pr9:Projeto {name: "Desenvolvimento de Líderes", orcamento: 450000, inicio: "2023-07", fim: "2024-05", status: "Em andamento", company: "IEL"})
      CREATE (pr10:Projeto {name: "Expansão Centro de Inovação", orcamento: 4200000, inicio: "2023-10", fim: "2025-02", status: "Planejado", company: "SENAI"})
      CREATE (pr11:Projeto {name: "Centro de Bem-Estar", orcamento: 1750000, inicio: "2023-11", fim: "2024-10", status: "Planejado", company: "SESI"})
      CREATE (pr12:Projeto {name: "Programa de Estágios", orcamento: 320000, inicio: "2023-03", fim: "2023-12", status: "Em andamento", company: "IEL"})
      
      // Objetivos
      CREATE (ob1:Objetivo {name: "Aumento participação mercado", meta: "25% em 3 anos", indicador: "Market share", baseline: "15%", company: "FIEAC"})
      CREATE (ob2:Objetivo {name: "Redução custos operacionais", meta: "12% em 2 anos", indicador: "% despesas/receita", baseline: "32%", company: "SISTEMA FIEAC"})
      CREATE (ob3:Objetivo {name: "Aumento retenção talentos", meta: "Turnover < 10%", indicador: "Taxa de turnover", baseline: "18%", company: "IEL"})
      CREATE (ob4:Objetivo {name: "Satisfação do cliente", meta: "NPS > 65", indicador: "Net Promoter Score", baseline: "48", company: "SENAI,SESI"})
      CREATE (ob5:Objetivo {name: "Transformação digital", meta: "80% dos processos", indicador: "% digitalização", baseline: "45%", company: "SISTEMA FIEAC"})
      CREATE (ob6:Objetivo {name: "Expansão geográfica", meta: "Presença em 5 novos estados", indicador: "Novos mercados", baseline: "0", company: "FIEAC"})
      
      // Novos objetivos específicos para cada empresa
      CREATE (ob7:Objetivo {name: "Aumento alunos formados", meta: "15% ao ano", indicador: "Taxa de formandos", baseline: "8%", company: "SENAI"})
      CREATE (ob8:Objetivo {name: "Redução acidentes trabalho", meta: "Zero acidentes", indicador: "Número de acidentes", baseline: "12", company: "SESI"})
      CREATE (ob9:Objetivo {name: "Aumento estágios efetivados", meta: "45% em 2 anos", indicador: "Taxa conversão", baseline: "30%", company: "IEL"})
      
      // Indicadores de Performance
      CREATE (kpi1:KPI {name: "ROI", valor: "22%", meta: "25%", tendencia: "Positiva", company: "SISTEMA FIEAC"})
      CREATE (kpi2:KPI {name: "Taxa Turnover", valor: "15%", meta: "10%", tendencia: "Estável", company: "IEL"})
      CREATE (kpi3:KPI {name: "NPS", valor: "52", meta: "65", tendencia: "Positiva", company: "SENAI,SESI"})
      CREATE (kpi4:KPI {name: "Market Share", valor: "17%", meta: "25%", tendencia: "Positiva", company: "FIEAC"})
      CREATE (kpi5:KPI {name: "Incidentes de Segurança", valor: "8", meta: "0", tendencia: "Negativa", company: "SENAI"})
      CREATE (kpi6:KPI {name: "Tempo médio entrega", valor: "12 dias", meta: "7 dias", tendencia: "Estável", company: "SESI"})
      
      // Novos KPIs específicos para cada empresa
      CREATE (kpi7:KPI {name: "Alunos Empregados", valor: "68%", meta: "75%", tendencia: "Positiva", company: "SENAI"})
      CREATE (kpi8:KPI {name: "Índice Saúde Ocupacional", valor: "82%", meta: "90%", tendencia: "Positiva", company: "SESI"})
      CREATE (kpi9:KPI {name: "Efetivação Estágios", valor: "32%", meta: "45%", tendencia: "Positiva", company: "IEL"})
      CREATE (kpi10:KPI {name: "Receita Projetos Inovação", valor: "8.2M", meta: "12M", tendencia: "Positiva", company: "SENAI"})
      CREATE (kpi11:KPI {name: "Trabalhadores Atendidos", valor: "12500", meta: "15000", tendencia: "Positiva", company: "SESI"})
      CREATE (kpi12:KPI {name: "Empresas Parceiras", valor: "150", meta: "200", tendencia: "Estável", company: "IEL"})
      
      // Stakeholders
      CREATE (s1:Stakeholder {name: "Conselho Administrativo", tipo: "Interno", influencia: "Alta", company: "SISTEMA FIEAC"})
      CREATE (s2:Stakeholder {name: "Colaboradores", tipo: "Interno", influencia: "Média", company: "SISTEMA FIEAC"})
      CREATE (s3:Stakeholder {name: "Clientes", tipo: "Externo", influencia: "Alta", company: "SENAI,SESI,IEL"})
      CREATE (s4:Stakeholder {name: "Fornecedores", tipo: "Externo", influencia: "Média", company: "SISTEMA FIEAC"})
      CREATE (s5:Stakeholder {name: "Órgãos Reguladores", tipo: "Externo", influencia: "Alta", company: "SISTEMA FIEAC"})
      CREATE (s6:Stakeholder {name: "Concorrentes", tipo: "Externo", influencia: "Média", company: "SENAI,SESI,IEL"})
      CREATE (s7:Stakeholder {name: "Comunidade local", tipo: "Externo", influencia: "Baixa", company: "SISTEMA FIEAC"})
      CREATE (s8:Stakeholder {name: "Investidores", tipo: "Externo", influencia: "Alta", company: "FIEAC"})
      
      // Tecnologias
      CREATE (t1:Tecnologia {name: "Cloud Computing", status: "Implementado", criticidade: "Alta", company: "SISTEMA FIEAC"})
      CREATE (t2:Tecnologia {name: "Big Data Analytics", status: "Em implementação", criticidade: "Média", company: "SENAI,FIEAC"})
      CREATE (t3:Tecnologia {name: "Inteligência Artificial", status: "Piloto", criticidade: "Alta", company: "SENAI"})
      CREATE (t4:Tecnologia {name: "IoT", status: "Planejado", criticidade: "Baixa", company: "SESI"})
      CREATE (t5:Tecnologia {name: "Blockchain", status: "Investigação", criticidade: "Média", company: "FIEAC"})
      CREATE (t6:Tecnologia {name: "RPA", status: "Implementado", criticidade: "Média", company: "SISTEMA FIEAC"})
      
      // Produtos
      CREATE (prod1:Produto {name: "Produto A", lancamento: "2018", categoria: "Premium", receita_anual: 12000000, company: "SENAI"})
      CREATE (prod2:Produto {name: "Produto B", lancamento: "2020", categoria: "Standard", receita_anual: 8500000, company: "SESI"})
      CREATE (prod3:Produto {name: "Produto C", lancamento: "2021", categoria: "Econômico", receita_anual: 5000000, company: "SENAI"})
      CREATE (prod4:Produto {name: "Produto D", lancamento: "2019", categoria: "Premium", receita_anual: 9500000, company: "SESI"})
      CREATE (prod5:Produto {name: "Produto E", lancamento: "2022", categoria: "Standard", receita_anual: 3200000, company: "IEL"})
      CREATE (prod6:Produto {name: "Produto F", lancamento: "2023", categoria: "Premium", receita_anual: 1800000, company: "IEL"})
      
      // Mercados
      CREATE (merc1:Mercado {name: "Sudeste", tipo: "Regional", participacao: "45%", crescimento: "3%", company: "SISTEMA FIEAC"})
      CREATE (merc2:Mercado {name: "Sul", tipo: "Regional", participacao: "25%", crescimento: "5%", company: "SISTEMA FIEAC"})
      CREATE (merc3:Mercado {name: "Nordeste", tipo: "Regional", participacao: "12%", crescimento: "8%", company: "SISTEMA FIEAC"})
      CREATE (merc4:Mercado {name: "Centro-Oeste", tipo: "Regional", participacao: "10%", crescimento: "4%", company: "SISTEMA FIEAC"})
      CREATE (merc5:Mercado {name: "Norte", tipo: "Regional", participacao: "8%", crescimento: "6%", company: "SISTEMA FIEAC"})
      CREATE (merc6:Mercado {name: "Mercosul", tipo: "Internacional", participacao: "5%", crescimento: "10%", company: "SENAI,FIEAC"})
      
      // Competidores
      CREATE (comp1:Competidor {name: "Empresa X", porte: "Grande", marketshare: "30%", ameaca: "Alta", company: "SENAI"})
      CREATE (comp2:Competidor {name: "Empresa Y", porte: "Médio", marketshare: "15%", ameaca: "Média", company: "SESI"})
      CREATE (comp3:Competidor {name: "Empresa Z", porte: "Pequeno", marketshare: "5%", ameaca: "Baixa", company: "IEL"})
      CREATE (comp4:Competidor {name: "Startup A", porte: "Pequeno", marketshare: "3%", ameaca: "Alta", company: "SENAI"})
      CREATE (comp5:Competidor {name: "Multinacional B", porte: "Grande", marketshare: "20%", ameaca: "Alta", company: "SISTEMA FIEAC"})
      
      // Novas entidades para cada empresa
      CREATE (i1:Iniciativa {name: "Programa SENAI 4.0", orcamento: 8500000, inicio: "2023-06", fim: "2025-12", impacto: "Alto", company: "SENAI"})
      CREATE (i2:Iniciativa {name: "Saúde e Segurança no Trabalho", orcamento: 3200000, inicio: "2023-07", fim: "2024-12", impacto: "Alto", company: "SESI"})
      CREATE (i3:Iniciativa {name: "Integração Indústria-Academia", orcamento: 1800000, inicio: "2023-09", fim: "2024-09", impacto: "Médio", company: "IEL"})
      CREATE (i4:Iniciativa {name: "Fortalecimento da Indústria Regional", orcamento: 12000000, inicio: "2023-01", fim: "2026-12", impacto: "Alto", company: "FIEAC"})
      CREATE (i5:Iniciativa {name: "Alinhamento Estratégico Grupo", orcamento: 2500000, inicio: "2023-03", fim: "2023-12", impacto: "Alto", company: "SISTEMA FIEAC"})
    `;

    // Execute the queries in sequence
    await executeWrite(createNodesQuery);

    // Criar relações em lotes
    console.log("Criando relações parte 1...");
    await relationsPartOne(executeWrite);

    console.log("Criando relações parte 2...");
    await relationsPartTwo(executeWrite);

    console.log("Criando relações parte 3...");
    await relationsPartThree(executeWrite);

    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
