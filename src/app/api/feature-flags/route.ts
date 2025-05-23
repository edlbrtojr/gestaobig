import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_FEATURE_FLAGS, FeatureFlags } from "@/lib/app-config";

/**
 * GET handler for /api/feature-flags endpoint
 * Retrieves feature flags from the database
 */
export async function GET() {
  try {
    const result = await db.run(`
      MATCH (config:FeatureConfig)
      RETURN config
      LIMIT 1
    `);

    const configNode = result.records[0]?.get('config');
    
    if (!configNode) {
      // Return default feature flags if none exists
      return NextResponse.json(DEFAULT_FEATURE_FLAGS);
    }

    // Extract properties from the Neo4j node
    const props = configNode.properties;
    
    const featureFlags: FeatureFlags = {
      graphEnabled: props.graphEnabled ?? DEFAULT_FEATURE_FLAGS.graphEnabled,
      advancedReportsEnabled: props.advancedReportsEnabled ?? DEFAULT_FEATURE_FLAGS.advancedReportsEnabled,
      dataSharingEnabled: props.dataSharingEnabled ?? DEFAULT_FEATURE_FLAGS.dataSharingEnabled,
      apiIntegrationEnabled: props.apiIntegrationEnabled ?? DEFAULT_FEATURE_FLAGS.apiIntegrationEnabled,
    };

    return NextResponse.json(featureFlags);
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    return NextResponse.json(
      DEFAULT_FEATURE_FLAGS,
      { status: 200 } // Return defaults with 200 status to prevent client-side errors
    );
  }
}

/**
 * POST handler for /api/feature-flags endpoint
 * Updates feature flags in the database
 */
export async function POST(request: NextRequest) {
  try {
    const body: FeatureFlags = await request.json();
    
    // Create Cypher query to update or create the feature config
    const result = await db.run(`
      MERGE (config:FeatureConfig)
      SET config.graphEnabled = $graphEnabled,
          config.advancedReportsEnabled = $advancedReportsEnabled,
          config.dataSharingEnabled = $dataSharingEnabled,
          config.apiIntegrationEnabled = $apiIntegrationEnabled,
          config.updatedAt = datetime()
      RETURN config
    `, {
      graphEnabled: body.graphEnabled,
      advancedReportsEnabled: body.advancedReportsEnabled,
      dataSharingEnabled: body.dataSharingEnabled,
      apiIntegrationEnabled: body.apiIntegrationEnabled,
    });

    return NextResponse.json({ success: true, featureFlags: body });
  } catch (error) {
    console.error("Error updating feature flags:", error);
    return NextResponse.json(
      { error: "Failed to update feature flags" },
      { status: 500 }
    );
  }
} 