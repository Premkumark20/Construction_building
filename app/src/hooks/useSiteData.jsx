import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CACHE_KEY = 'sk_site_data_cache';

const defaultSettings = {
  company_name: 'SK BUILDERS',
  company_subtitle: '& PROPERTY CONSULTANT',
  phone: '',
  email: '',
  location: '',
  service_areas: '',
  hero_tagline: 'BUILDING QUALITY HOMES.',
  hero_headline_find: 'Find',
  hero_headline_property: 'Right Property',
  hero_headline_confidence: 'Confidence',
  hero_subtitle: 'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation.',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  whatsapp_number: '',
  logo_url: '/logo/sk-builders-logo.png',
  site_title: 'SK Builders & Property Consultant',
  meta_description: 'Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance.'
};

const defaultServices = [
  { id: 1, title: 'Houses for Sale', description: 'Ready-to-move individual houses built with quality and trust.', icon_name: 'Home', link_url: '#properties' },
  { id: 2, title: 'Lands for Sale', description: 'Residential plots in prime locations. DTCP approved plots available.', icon_name: 'MapPin', link_url: '#properties' },
  { id: 3, title: 'Contract House Construction', description: 'We build your dream home on your land with quality and on-time delivery.', icon_name: 'HardHat', link_url: '#contact' },
  { id: 4, title: 'Property Consultant', description: 'Expert help for buying or selling land and houses. End-to-end guidance.', icon_name: 'Users', link_url: '#contact' },
  { id: 5, title: 'Documentation Support', description: 'Assistance for all property related documents and legal process.', icon_name: 'FileText', link_url: '#contact' },
  { id: 6, title: 'Construction Consultation', description: 'Planning, estimation, site visit and expert construction advice.', icon_name: 'Compass', link_url: '#contact' }
];

const getCachedData = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) { }
  return null;
};

const saveCachedData = (dataToCache) => {
  try {
    const toSave = {
      settings: dataToCache.settings,
      admin: dataToCache.admin,
      services: dataToCache.services,
      properties: dataToCache.properties,
      land: dataToCache.land,
      projects: dataToCache.projects,
      gallery: dataToCache.gallery,
      testimonials: dataToCache.testimonials
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(toSave));
  } catch (e) { }
};

const SiteDataContext = createContext(null);

export const SiteDataProvider = ({ children }) => {
  const cached = getCachedData();
  const hasCachedData = !!(
    cached && (
      (Array.isArray(cached.projects) && cached.projects.length > 0) ||
      (Array.isArray(cached.properties) && cached.properties.length > 0) ||
      (Array.isArray(cached.gallery) && cached.gallery.length > 0) ||
      (cached.settings && cached.settings.company_name)
    )
  );

  const [data, setData] = useState(() => {
    if (hasCachedData) {
      return {
        settings: cached.settings || defaultSettings,
        admin: cached.admin || { phone: '', email: 'info@skbuilders.com' },
        services: Array.isArray(cached.services) && cached.services.length > 0 ? cached.services : defaultServices,
        properties: Array.isArray(cached.properties) ? cached.properties : [],
        land: Array.isArray(cached.land) ? cached.land : [],
        projects: Array.isArray(cached.projects) ? cached.projects : [],
        gallery: Array.isArray(cached.gallery) ? cached.gallery : [],
        testimonials: Array.isArray(cached.testimonials) ? cached.testimonials : [],
        loading: false,
        isInitialLoading: false
      };
    }

    return {
      settings: defaultSettings,
      admin: { phone: '', email: 'info@skbuilders.com' },
      services: defaultServices,
      properties: [],
      land: [],
      projects: [],
      gallery: [],
      testimonials: [],
      loading: true,
      isInitialLoading: true
    };
  });

  const isFetchingRef = useRef(false);

  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [settingsRes, servicesRes, propertiesRes, landRes, projectsRes, galleryRes, testimonialsRes] = await Promise.all([
        fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/services').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/properties').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/land').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/projects').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/gallery').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/testimonials').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      const propsList = Array.isArray(propertiesRes?.properties) ? propertiesRes.properties : (Array.isArray(propertiesRes) ? propertiesRes : null);
      const landList = Array.isArray(landRes?.land) ? landRes.land : (Array.isArray(landRes) ? landRes : null);
      const projList = Array.isArray(projectsRes?.projects) ? projectsRes.projects : (Array.isArray(projectsRes) ? projectsRes : null);

      setData(prev => {
        const nextState = {
          settings: settingsRes?.settings || prev.settings,
          admin: settingsRes?.admin || prev.admin,
          services: Array.isArray(servicesRes) && servicesRes.length > 0 ? servicesRes : prev.services,
          properties: Array.isArray(propsList) ? propsList : prev.properties,
          land: Array.isArray(landList) ? landList : prev.land,
          projects: Array.isArray(projList) ? projList : prev.projects,
          gallery: Array.isArray(galleryRes) ? galleryRes : prev.gallery,
          testimonials: Array.isArray(testimonialsRes) ? testimonialsRes : prev.testimonials,
          loading: false,
          isInitialLoading: false
        };

        saveCachedData(nextState);
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
        return nextState;
      });
    } catch (err) {
      console.error('Error fetching site data:', err);
      setData(prev => ({ ...prev, loading: false, isInitialLoading: false }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refreshData();

    const handleStorageChange = (e) => {
      if (e.key === 'sk_site_data_updated') {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleCustomUpdate = () => {
      refreshData();
    };
    window.addEventListener('sk_site_data_updated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sk_site_data_updated', handleCustomUpdate);
    };
  }, [refreshData]);

  useEffect(() => {
    if (data.settings) {
      if (!window.location.hash.includes('admin') && !window.location.pathname.includes('admin')) {
        const title = data.settings.site_title || (data.settings.company_name ? `${data.settings.company_name} ${data.settings.company_subtitle || ''}`.trim() : 'SK Builders & Property Consultant');
        if (title) {
          document.title = title;
        }
      }
      if (data.settings.logo_url) {
        let favicon = document.querySelector("link[rel*='icon']");
        if (favicon) {
          favicon.href = data.settings.logo_url;
        }
      }
      const metaDesc = data.settings.meta_description || data.settings.hero_subtitle;
      if (metaDesc) {
        let descTag = document.querySelector('meta[name="description"]');
        if (!descTag) {
          descTag = document.createElement('meta');
          descTag.name = 'description';
          document.head.appendChild(descTag);
        }
        descTag.setAttribute('content', metaDesc);
      }
    }
  }, [data.settings]);

  const value = { ...data, refreshData };

  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  );
};

export const useSiteData = () => {
  const context = useContext(SiteDataContext);
  if (!context) {
    return {
      settings: defaultSettings,
      admin: { phone: '', email: 'info@skbuilders.com' },
      services: defaultServices,
      properties: [],
      land: [],
      projects: [],
      gallery: [],
      testimonials: [],
      loading: false,
      isInitialLoading: false,
      refreshData: () => {}
    };
  }
  return context;
};

export default useSiteData;
