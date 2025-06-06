"use client";

import { useEffect } from 'react';
import { siteConfig } from "@/config/site";

export function DynamicFavicon() {
  useEffect(() => {
    // Get favicon URL from config
    const faviconUrl = siteConfig.faviconUrl || '/favicon.ico';
    
    // Update favicon link element
    const links = document.querySelectorAll('link[rel="icon"]');
    
    if (links.length > 0) {
      // Update existing favicon links
      links.forEach(link => {
        link.setAttribute('href', faviconUrl);
      });
    } else {
      // Create a new favicon link if none exists
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }, []);

  return null;
} 