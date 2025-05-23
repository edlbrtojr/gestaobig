import { useState, useEffect, useCallback } from 'react';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/lib/app-config';

export function useFeatureFlags() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch feature flags from the API
  const fetchFeatureFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/feature-flags');
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      
      const data = await response.json();
      setFeatureFlags(data);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Keep using the current flags
    } finally {
      setLoading(false);
    }
  }, []);

  // Update feature flags
  const updateFeatureFlags = useCallback(async (newFlags: Partial<FeatureFlags>) => {
    try {
      const updatedFlags = { ...featureFlags, ...newFlags };
      
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFlags),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update feature flags');
      }
      
      setFeatureFlags(updatedFlags);
      return true;
    } catch (err) {
      console.error('Error updating feature flags:', err);
      return false;
    }
  }, [featureFlags]);

  // Check if a specific feature is enabled
  const isFeatureEnabled = useCallback((feature: keyof FeatureFlags) => {
    return featureFlags[feature] || false;
  }, [featureFlags]);
  
  // Toggle a specific feature flag
  const toggleFeature = useCallback(async (feature: keyof FeatureFlags) => {
    return updateFeatureFlags({ [feature]: !featureFlags[feature] });
  }, [featureFlags, updateFeatureFlags]);

  // Initialize feature flags
  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  return {
    featureFlags,
    loading,
    error,
    isFeatureEnabled,
    updateFeatureFlags,
    toggleFeature,
    refreshFeatureFlags: fetchFeatureFlags,
  };
} 