import { NextResponse } from "next/server";
import neo4j from "neo4j-driver";

// Configuração do driver Neo4j
const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
const user = process.env.NEO4J_USER || "neo4j";
const password = process.env.NEO4J_PASSWORD || "";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Função para obter o driver Neo4j
async function getDriver() {
  return driver;
}

// Função para obter a configuração da organização
export async function GET(request: Request) {
  const driver = await getDriver();
  const session = driver.session();
  
  try {
    // Consulta para obter a configuração da organização
    const result = await session.run(`
      MATCH (o:Organization)
      RETURN o {
        .*,
        theme: {
          defaultMode: o.themeDefaultMode,
          enableSystem: o.themeEnableSystem,
          lightLogo: o.themeLightLogo,
          darkLogo: o.themeDarkLogo
        }
      } AS orgConfig
      LIMIT 1
    `);

    // Se não encontrar nenhuma organização, retornar erro
    if (result.records.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma organização encontrada" },
        { status: 404 }
      );
    }

    // Extrair a configuração da organização
    const orgConfig = result.records[0].get("orgConfig");

    // Verificar se os campos obrigatórios estão presentes
    const requiredFields = [
      "name", "shortName", "primaryColor", "secondaryColor", 
      "logoUrl", "faviconUrl"
    ];
    
    const missingFields = requiredFields.filter(field => !orgConfig[field]);
    
    if (missingFields.length > 0) {
      console.warn(`Campos ausentes na configuração da organização: ${missingFields.join(", ")}`);
    }
    
    // Verificar se os campos do tema estão presentes
    if (!orgConfig.theme) {
      orgConfig.theme = {
        defaultMode: "light",
        enableSystem: true,
        lightLogo: "",
        darkLogo: ""
      };
    }
    
    // Retornar a configuração da organização
    return NextResponse.json(orgConfig);
  } catch (error) {
    console.error("Erro ao obter configuração da organização:", error);
    return NextResponse.json(
      { error: "Falha ao obter configuração da organização" },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}

// Função para atualizar a configuração da organização
export async function POST(request: Request) {
  const driver = await getDriver();
  const session = driver.session();
  
  try {
    // Obter os dados da requisição
    const data = await request.json();
    
    // Verificar se os campos obrigatórios estão presentes
    const requiredFields = [
      "name", "shortName", "primaryColor", "secondaryColor", 
      "logoUrl", "faviconUrl"
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: "Campos obrigatórios ausentes", 
          missingFields 
        },
        { status: 400 }
      );
    }
    
    // Extrair os dados do tema
    const theme = data.theme || {
      defaultMode: "light",
      enableSystem: true,
      lightLogo: "",
      darkLogo: ""
    };
    
    // Consulta para atualizar ou criar a configuração da organização
    const result = await session.run(`
      MERGE (o:Organization)
      SET 
        o.name = $name,
        o.shortName = $shortName,
        o.logoUrl = $logoUrl,
        o.logoSmallUrl = $logoSmallUrl,
        o.faviconUrl = $faviconUrl,
        o.primaryColor = $primaryColor,
        o.secondaryColor = $secondaryColor,
        o.tertiaryColor = $tertiaryColor,
        o.footerText = $footerText,
        o.contactEmail = $contactEmail,
        o.contactPhone = $contactPhone,
        o.address = $address,
        o.themeDefaultMode = $themeDefaultMode,
        o.themeEnableSystem = $themeEnableSystem,
        o.themeLightLogo = $themeLightLogo,
        o.themeDarkLogo = $themeDarkLogo,
        o.updatedAt = datetime()
      RETURN o
    `, {
      name: data.name,
      shortName: data.shortName,
      logoUrl: data.logoUrl,
      logoSmallUrl: data.logoSmallUrl || "",
      faviconUrl: data.faviconUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      tertiaryColor: data.tertiaryColor || "#e5e5e5",
      footerText: data.footerText || "",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      address: data.address || "",
      themeDefaultMode: theme.defaultMode || "light",
      themeEnableSystem: theme.enableSystem === undefined ? true : theme.enableSystem,
      themeLightLogo: theme.lightLogo || "",
      themeDarkLogo: theme.darkLogo || ""
    });
    
    // Retornar sucesso
    return NextResponse.json({ 
      success: true, 
      message: "Configuração da organização atualizada com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao atualizar configuração da organização:", error);
    return NextResponse.json(
      { error: "Falha ao atualizar configuração da organização" },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
} 