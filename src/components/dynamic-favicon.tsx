"use client";

import { useOrganizationConfig } from "./org-config-provider";
import { useEffect } from "react";

export function DynamicFavicon() {
  const { config } = useOrganizationConfig();
  
  // Update the favicon when config changes
  useEffect(() => {
    if (config?.faviconUrl) {
      // Find existing favicon link
      const existingLink = document.querySelector('link[rel="icon"]');
      
      if (existingLink) {
        // Update existing link
        existingLink.setAttribute('href', config.faviconUrl);
      } else {
        // Create new link if none exists
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = config.faviconUrl;
        // Set sizes attribute directly
        document.head.appendChild(link);
        link.setAttribute('sizes', 'any');
      }
    }
  }, [config?.faviconUrl]);
  
  // This component doesn't render anything
  return null;
} 