import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Types for organization configuration
export interface OrganizationTheme {
  defaultMode: "light" | "dark" | "system";
  enableSystem: boolean;
  lightLogo: string;
  darkLogo: string;
}

export interface OrganizationConfig {
  name: string;
  shortName: string;
  logoUrl: string;
  logoSmallUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  theme: OrganizationTheme;
}

// Default config as fallback
const DEFAULT_ORG_CONFIG: OrganizationConfig = {
  name: "Federação das Indústrias do Estado do Acre",
  shortName: "FIEAC",
  logoUrl: "/uploads/4072219a-04e7-4c79-9428-dc6e5169f574.png",
  logoSmallUrl: "/uploads/8af51858-0543-424d-8d59-ba57c1ede5a1.png",
  faviconUrl: "/favicon.ico",
  primaryColor: "#004a93",
  secondaryColor: "#f4791f",
  tertiaryColor: "#e5e5e5",
  footerText: "© 2025 FIEAC - Todos os direitos reservados",
  contactEmail: "fieac@fieac.org.br",
  contactPhone: "(68) 3212-4200",
  address: "Rua Rui Barbosa, 735 - Centro, Rio Branco - AC, 69900-084",
  theme: {
    defaultMode: "light",
    enableSystem: true,
    lightLogo: "/uploads/4072219a-04e7-4c79-9428-dc6e5169f574.png",
    darkLogo: "/uploads/8af51858-0543-424d-8d59-ba57c1ede5a1.png",
  }
};

/**
 * GET handler for /api/config endpoint
 * Retrieves organization configuration from the database
 */
export async function GET() {
  try {
    const result = await db.run(`
      MATCH (org:Organization)
      RETURN org
      LIMIT 1
    `);

    // Se não houver registros, provavelmente está trabalhando offline
    if (!result.records || result.records.length === 0) {
      console.log("Sem registros de organização, usando configuração padrão");
      return NextResponse.json({
        ...DEFAULT_ORG_CONFIG,
        _source: "default"
      });
    }

    const orgNode = result.records[0]?.get('org');
    
    if (!orgNode) {
      // Return default config if none exists
      return NextResponse.json({
        ...DEFAULT_ORG_CONFIG,
        _source: "default"
      });
    }

    // Extract properties from the Neo4j node
    const orgProps = orgNode.properties;
    
    // Parse theme JSON string to object if it exists
    let theme;
    try {
      theme = orgProps.theme ? JSON.parse(orgProps.theme) : DEFAULT_ORG_CONFIG.theme;
    } catch (e) {
      console.error("Error parsing theme JSON:", e);
      theme = DEFAULT_ORG_CONFIG.theme;
    }
    
    const config: OrganizationConfig = {
      name: orgProps.name || DEFAULT_ORG_CONFIG.name,
      shortName: orgProps.shortName || DEFAULT_ORG_CONFIG.shortName,
      logoUrl: orgProps.logoUrl || DEFAULT_ORG_CONFIG.logoUrl,
      logoSmallUrl: orgProps.logoSmallUrl || DEFAULT_ORG_CONFIG.logoSmallUrl,
      faviconUrl: orgProps.faviconUrl || DEFAULT_ORG_CONFIG.faviconUrl,
      primaryColor: orgProps.primaryColor || DEFAULT_ORG_CONFIG.primaryColor,
      secondaryColor: orgProps.secondaryColor || DEFAULT_ORG_CONFIG.secondaryColor,
      tertiaryColor: orgProps.tertiaryColor || DEFAULT_ORG_CONFIG.tertiaryColor,
      footerText: orgProps.footerText || DEFAULT_ORG_CONFIG.footerText,
      contactEmail: orgProps.contactEmail || DEFAULT_ORG_CONFIG.contactEmail,
      contactPhone: orgProps.contactPhone || DEFAULT_ORG_CONFIG.contactPhone,
      address: orgProps.address || DEFAULT_ORG_CONFIG.address,
      theme
    };

    return NextResponse.json({
      ...config,
      _source: "database"
    });
  } catch (error) {
    console.error("Error fetching organization config:", error);
    // Em caso de erro, retornar a configuração padrão em vez de falhar com 500
    return NextResponse.json({
      ...DEFAULT_ORG_CONFIG,
      _source: "default",
      _error: "Falha ao buscar configuração"
    }, { status: 200 }); // Sempre retorna 200 para não quebrar a UI
  }
}

/**
 * POST handler for /api/config endpoint
 * Updates organization configuration in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body: OrganizationConfig = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'shortName', 'primaryColor'];
    for (const field of requiredFields) {
      if (!body[field as keyof OrganizationConfig]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create Cypher query to update or create the organization
    const result = await db.run(`
      MERGE (org:Organization)
      SET org.name = $name,
          org.shortName = $shortName,
          org.logoUrl = $logoUrl,
          org.logoSmallUrl = $logoSmallUrl,
          org.faviconUrl = $faviconUrl,
          org.primaryColor = $primaryColor,
          org.secondaryColor = $secondaryColor,
          org.tertiaryColor = $tertiaryColor,
          org.footerText = $footerText,
          org.contactEmail = $contactEmail,
          org.contactPhone = $contactPhone,
          org.address = $address,
          org.theme = $theme,
          org.updatedAt = datetime()
      RETURN org
    `, {
      name: body.name,
      shortName: body.shortName,
      logoUrl: body.logoUrl,
      logoSmallUrl: body.logoSmallUrl,
      faviconUrl: body.faviconUrl,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      tertiaryColor: body.tertiaryColor,
      footerText: body.footerText,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      address: body.address,
      theme: JSON.stringify(body.theme)
    });

    // Verificar se a operação foi bem-sucedida
    if (!result.records || result.records.length === 0) {
      console.warn("Configuração não salva no banco de dados, modo offline");
      return NextResponse.json({ 
        success: true, 
        config: body,
        _source: "memory",
        _warning: "Configuração armazenada apenas em memória (modo offline)"
      });
    }

    return NextResponse.json({ 
      success: true, 
      config: body,
      _source: "database"
    });
  } catch (error) {
    console.error("Error updating organization config:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update organization configuration",
        _source: "error"
      },
      { status: 200 } // Retornar 200 para não quebrar a UI
    );
  }
} 