
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SiteSettings } from '@/data/settings';

interface SEOMetadataUpdaterProps {
  settings: SiteSettings;
}

export function SEOMetadataUpdater({ settings: initialSettings }: SEOMetadataUpdaterProps) {
  const pathname = usePathname();
  const [settings] = useState<SiteSettings>(initialSettings);

  useEffect(() => {
    const defaultSuffix = ' | فروشگاه آنلاین شیک'; // The suffix defined in layout.tsx template
    const defaultTitle = 'فروشگاه آنلاین شیک'; // The default title in layout.tsx

    const applyCustomTitle = () => {
      const currentTitle = document.title;

      if (pathname === '/') {
        // Homepage: Force SEO Title
        if (settings.seoTitle && currentTitle !== settings.seoTitle) {
          document.title = settings.seoTitle;
        }
      } else {
        // Inner pages: Replace default suffix with custom brand
        if (currentTitle.endsWith(defaultSuffix)) {
          const cleanTitle = currentTitle.substring(0, currentTitle.length - defaultSuffix.length);
          document.title = `${cleanTitle} | ${settings.brandName}`;
        } else if (currentTitle === defaultTitle) {
           // Fallback for pages without specific metadata
           if (settings.seoTitle && settings.seoTitle !== defaultTitle) {
             document.title = settings.seoTitle;
           }
        }
      }

      // Update Meta Description
      if (settings.seoDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        if (metaDesc.getAttribute('content') !== settings.seoDescription) {
           metaDesc.setAttribute('content', settings.seoDescription);
        }
      }

      // Google Site Verification
      if (settings.googleSiteVerification) {
        let metaGoogle = document.querySelector('meta[name="google-site-verification"]');
        if (!metaGoogle) {
          metaGoogle = document.createElement('meta');
          metaGoogle.setAttribute('name', 'google-site-verification');
          document.head.appendChild(metaGoogle);
        }
        if (metaGoogle.getAttribute('content') !== settings.googleSiteVerification) {
          metaGoogle.setAttribute('content', settings.googleSiteVerification);
        }
      }

      // Bing Site Verification
      if (settings.bingSiteVerification) {
        let metaBing = document.querySelector('meta[name="msvalidate.01"]');
        if (!metaBing) {
          metaBing = document.createElement('meta');
          metaBing.setAttribute('name', 'msvalidate.01');
          document.head.appendChild(metaBing);
        }
        if (metaBing.getAttribute('content') !== settings.bingSiteVerification) {
          metaBing.setAttribute('content', settings.bingSiteVerification);
        }
      }

      // Canonical URL
      if (settings.baseUrl) {
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
          linkCanonical = document.createElement('link');
          linkCanonical.setAttribute('rel', 'canonical');
          document.head.appendChild(linkCanonical);
        }
        
        // Ensure baseUrl doesn't have a trailing slash
        const baseUrl = settings.baseUrl.endsWith('/') 
          ? settings.baseUrl.slice(0, -1) 
          : settings.baseUrl;
          
        // pathname always starts with /
        const canonicalUrl = `${baseUrl}${pathname === '/' ? '' : pathname}`;
        
        if (linkCanonical.getAttribute('href') !== canonicalUrl) {
          linkCanonical.setAttribute('href', canonicalUrl);
        }
      }
    };

    // 1. Initial application
    applyCustomTitle();
    
    // We removed the event listener for SETTINGS_UPDATED_EVENT because we are now using server-side settings
    // which require a refresh to propagate (or complex revalidation).
    // For now, simple prop passing is enough.

  }, [pathname, settings]);

  return null;
}
