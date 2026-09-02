import { useState, useEffect, useCallback } from 'react';

const defaultProperties = [];
const defaultLand = [];
const defaultProjects = [];

const defaultServices = [
  { id: 1, title: 'Houses for Sale', description: 'Ready-to-move individual houses built with quality and trust.', icon_name: 'Home', link_url: '#properties' },
  { id: 2, title: 'Lands for Sale', description: 'Residential plots in prime locations. DTCP approved plots available.', icon_name: 'MapPin', link_url: '#properties' },
  { id: 3, title: 'Contract House Construction', description: 'We build your dream home on your land with quality and on-time delivery.', icon_name: 'HardHat', link_url: '#contact' },
  { id: 4, title: 'Property Consultant', description: 'Expert help for buying or selling land and houses. End-to-end guidance.', icon_name: 'Users', link_url: '#contact' },
  { id: 5, title: 'Documentation Support', description: 'Assistance for all property related documents and legal process.', icon_name: 'FileText', link_url: '#contact' },
  { id: 6, title: 'Construction Consultation', description: 'Planning, estimation, site visit and expert construction advice.', icon_name: 'Compass', link_url: '#contact' }
];

const getInitialSiteData = () => {
  try {
    const cached = sessionStorage.getItem('sk_site_cached_data');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return {
          ...parsed,
          loading: false,
          isInitialSync: false,
        };
      }
    }
  } catch (e) {}

  return {
    settings: {
      company_name: '',
      company_subtitle: '',
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
      logo_url: '/logo/sk-builders-logo.png'
    },
    services: defaultServices,
    properties: defaultProperties,
    land: defaultLand,
    projects: defaultProjects,
    gallery: [],
    testimonials: [],
    loading: true,
    isInitialSync: true,
  };
};

export const useSiteData = () => {
  const [data, setData] = useState(getInitialSiteData);

  const refreshData = useCallback(async () => {
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
        const nextData = {
          settings: settingsRes?.settings || prev.settings,
          admin: settingsRes?.admin || { phone: '', email: 'info@skbuilders.com' },
          services: Array.isArray(servicesRes) ? servicesRes : prev.services,
          properties: propsList !== null ? propsList : prev.properties,
          land: landList !== null ? landList : prev.land,
          projects: projList !== null ? projList : prev.projects,
          gallery: Array.isArray(galleryRes) ? galleryRes : prev.gallery,
          testimonials: Array.isArray(testimonialsRes) ? testimonialsRes : prev.testimonials,
          loading: false,
          isInitialSync: false,
        };

        try {
          sessionStorage.setItem('sk_site_cached_data', JSON.stringify({
            settings: nextData.settings,
            services: nextData.services,
            properties: nextData.properties,
            land: nextData.land,
            projects: nextData.projects,
            gallery: nextData.gallery,
            testimonials: nextData.testimonials,
          }));
        } catch (e) {}

        return nextData;
      });
    } catch (err) {
      console.error('Error fetching site data:', err);
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
      if (data.settings.company_name && !window.location.hash.includes('admin') && !window.location.pathname.includes('admin')) {
        document.title = `${data.settings.company_name} ${data.settings.company_subtitle || ''}`;
      }
      if (data.settings.logo_url) {
        let favicon = document.querySelector("link[rel*='icon']");
        if (favicon) {
          favicon.href = data.settings.logo_url;
        }
      }
    }
  }, [data.settings]);

  return { ...data, refreshData };
};
