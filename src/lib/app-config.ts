// App configuration management
import { OrganizationConfig } from "@/app/api/config/route";

// Interface for feature flags
export interface FeatureFlags {
  graphEnabled: boolean;
  advancedReportsEnabled: boolean;
  dataSharingEnabled: boolean;
  apiIntegrationEnabled: boolean;
}

// Default feature flags - all advanced features disabled by default
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  graphEnabled: true,         // The graph is the core feature, so enabled by default
  advancedReportsEnabled: false,
  dataSharingEnabled: false,
  apiIntegrationEnabled: false,
};

// Singleton to manage app configuration
class AppConfig {
  private static instance: AppConfig;
  private _orgConfig: OrganizationConfig | null = null;
  private _featureFlags: FeatureFlags = DEFAULT_FEATURE_FLAGS;
  private _isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  // Initialize the configuration
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;
    
    try {
      // Fetch organization config
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        this._orgConfig = await configRes.json();
      }

      // Fetch feature flags
      const flagsRes = await fetch('/api/feature-flags');
      if (flagsRes.ok) {
        this._featureFlags = await flagsRes.json();
      }
      
      this._isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize AppConfig:", error);
    }
  }

  // Get organization config
  public get orgConfig(): OrganizationConfig | null {
    return this._orgConfig;
  }

  // Get feature flags
  public get featureFlags(): FeatureFlags {
    return this._featureFlags;
  }

  // Check if a specific feature is enabled
  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this._featureFlags[feature] || false;
  }

  // Check if the app is in development mode
  public isDevMode(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  // Reset the initialization state (useful for testing)
  public reset(): void {
    this._isInitialized = false;
    this._orgConfig = null;
    this._featureFlags = DEFAULT_FEATURE_FLAGS;
  }
}

export const appConfig = AppConfig.getInstance(); 