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

/**
 * GET handler for /api/config endpoint
 * Retrieves organization configuration from the database
 */
export async function GET() {
  try {
    // First, try to find the new node type
    let result = await db.run(`
      MATCH (org:_inAppOrgConfig)
      RETURN org
      LIMIT 1
    `);
    
    // If no records found with new label, try the old Organization label
    if (!result.records || result.records.length === 0) {
      result = await db.run(`
        MATCH (org:Organization)
        RETURN org
        LIMIT 1
      `);
    }

    // If still no records, return a proper error
    if (!result.records || result.records.length === 0) {
      console.log("No organization records found");
      return NextResponse.json(
        { error: "Organization configuration not found" },
        { status: 404 }
      );
    }

    const orgNode = result.records[0]?.get('org');
    
    if (!orgNode) {
      // Return error if node doesn't exist
      return NextResponse.json(
        { error: "Organization configuration not found" },
        { status: 404 }
      );
    }

    // Extract properties from the Neo4j node
    const orgProps = orgNode.properties;
    
    // Parse theme JSON string to object if it exists
    let theme;
    try {
      if (!orgProps.theme) {
        throw new Error("Theme configuration missing");
      }
      theme = JSON.parse(orgProps.theme);
    } catch (e) {
      console.error("Error parsing theme JSON:", e);
      return NextResponse.json(
        { error: "Invalid theme configuration" },
        { status: 400 }
      );
    }
    
    // Validate required properties - making this optional now
    const requiredProps = [
      'name', 'shortName', 'logoUrl', 'primaryColor', 'secondaryColor'
    ];
    
    const missingProps = requiredProps.filter(prop => !orgProps[prop]);
    if (missingProps.length > 0) {
      console.warn(`Missing some properties: ${missingProps.join(', ')}`);
    }
    
    // Make theme logos optional
    if (!theme.lightLogo || !theme.darkLogo) {
      console.warn("Missing theme logos");
    }
    
    const config: OrganizationConfig = {
      name: orgProps.name || "",
      shortName: orgProps.shortName || "",
      logoUrl: orgProps.logoUrl || "",
      logoSmallUrl: orgProps.logoSmallUrl || "",
      faviconUrl: orgProps.faviconUrl || "",
      primaryColor: orgProps.primaryColor || "#004a93",
      secondaryColor: orgProps.secondaryColor || "#f4791f",
      tertiaryColor: orgProps.tertiaryColor || "#e5e5e5",
      footerText: orgProps.footerText || "",
      contactEmail: orgProps.contactEmail || "",
      contactPhone: orgProps.contactPhone || "",
      address: orgProps.address || "",
      theme: {
        defaultMode: theme.defaultMode || "light",
        enableSystem: theme.enableSystem ?? true,
        lightLogo: theme.lightLogo || "",
        darkLogo: theme.darkLogo || ""
      }
    };

    return NextResponse.json({
      ...config,
      _source: "database"
    });
  } catch (error) {
    console.error("Error fetching organization config:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization configuration" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for /api/config endpoint
 * Updates organization configuration in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body: OrganizationConfig = await request.json();
    
    // Validation is now optional
    const requiredFields = [
      'name', 'shortName', 'primaryColor', 'secondaryColor', 
      'logoUrl', 'faviconUrl'
    ];
    
    const missingFields = requiredFields.filter(
      field => !body[field as keyof OrganizationConfig]
    );
    
    if (missingFields.length > 0) {
      console.warn(`Missing some fields: ${missingFields.join(', ')}`);
    }
    
    // Theme validation is now optional
    if (!body.theme) {
      body.theme = {
        defaultMode: "light",
        enableSystem: true,
        lightLogo: "",
        darkLogo: ""
      };
    }

    // Create Cypher query to update or create the config node with new label
    const result = await db.run(`
      MERGE (org:_inAppOrgConfig)
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
      name: body.name || "",
      shortName: body.shortName || "",
      logoUrl: body.logoUrl || "",
      logoSmallUrl: body.logoSmallUrl || "",
      faviconUrl: body.faviconUrl || "",
      primaryColor: body.primaryColor || "#004a93",
      secondaryColor: body.secondaryColor || "#f4791f",
      tertiaryColor: body.tertiaryColor || "#e5e5e5",
      footerText: body.footerText || "",
      contactEmail: body.contactEmail || "",
      contactPhone: body.contactPhone || "",
      address: body.address || "",
      theme: JSON.stringify(body.theme || {
        defaultMode: "light",
        enableSystem: true,
        lightLogo: "",
        darkLogo: ""
      })
    });

    // Check if the operation was successful
    if (!result.records || result.records.length === 0) {
      return NextResponse.json(
        { error: "Failed to save configuration, database may be offline" },
        { status: 503 }
      );
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
        error: "Failed to update organization configuration"
      },
      { status: 500 }
    );
  }
} 