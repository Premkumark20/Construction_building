import React, { useState, useEffect, useRef } from 'react';
import { Lock, LogOut, Plus, Trash2, ShieldCheck, Home, MapPin, Users, Settings, Image as ImageIcon, Video, CheckCircle, Upload, X, Save, AlertTriangle, Star, Building, Layers, Eye, EyeOff, FileText, Check, Map, Compass, Phone, User, Sparkles, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, GripVertical, Quote } from 'lucide-react';

const notifySiteDataUpdated = () => {
  try {
    localStorage.setItem('sk_site_data_updated', Date.now().toString());
    window.dispatchEvent(new Event('sk_site_data_updated'));
  } catch (e) { }
};

const notifyPrimaryVideoUpdated = () => {
  try {
    localStorage.setItem('sk_primary_video_updated', Date.now().toString());
    window.dispatchEvent(new Event('sk_primary_video_updated'));
  } catch (e) { }
};

const formatLastUpdated = (dateStr) => {
  if (!dateStr) return 'Recently';
  let isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
    isoStr += 'Z';
  }
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getServiceAreaOptions = (serviceAreasStr, locationStr) => {
  const rawStr = serviceAreasStr || locationStr || '';
  const list = rawStr
    .split(/[,•|;/]/)
    .map(s => s.trim())
    .filter(Boolean);

  return [...new Set(list)];
};

const AdminLoadingSkeleton = () => (
  <div className="space-y-3 py-4">
    {[1, 2, 3].map((n) => (
      <div key={n} className="bg-[#18181b]/70 p-4 rounded-2xl border border-zinc-800/80 animate-pulse flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-zinc-800/60 shrink-0" />
          <div className="space-y-2">
            <div className="w-36 h-3.5 bg-zinc-800/80 rounded" />
            <div className="w-48 h-3 bg-zinc-800/40 rounded" />
          </div>
        </div>
        <div className="w-16 h-8 bg-zinc-800/50 rounded-xl shrink-0" />
      </div>
    ))}
  </div>
);

const LoginBackgroundCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70" />;
};

const generatePropertyDescription = (prop) => {
  if (!prop) return '';
  const sentences = [];

  // Title / Type & Location
  const titleText = String(prop.title || '').trim();
  const typeText = String(prop.type || 'Individual House');
  const locText = String(prop.location || prop.area || '');

  if (titleText) {
    sentences.push(`${titleText}${locText ? ` located in ${locText}` : ''}.`);
  } else {
    sentences.push(`Premium ${prop.bedrooms ? `${prop.bedrooms} ` : ''}${typeText}${locText ? ` in ${locText}` : ''}.`);
  }

  // Specifications
  const specs = [];
  if (prop.bedrooms) {
    const bedStr = String(prop.bedrooms).trim();
    const bed = bedStr.includes('BHK') ? bedStr : `${bedStr} BHK`;
    specs.push(bed);
  }
  if (prop.builtup_area) {
    const builtUnit = String(prop.builtup_area).match(/[a-zA-Z]/) ? '' : ` ${prop.builtup_area_unit || 'sq.ft'}`;
    specs.push(`${prop.builtup_area}${builtUnit} built-up area`);
  }
  if (prop.plot_area) {
    const plotUnit = String(prop.plot_area).match(/[a-zA-Z]/) ? '' : ` ${prop.plot_area_unit || 'sq.ft'}`;
    specs.push(`${prop.plot_area}${plotUnit} plot area`);
  }
  if (prop.facing) specs.push(`${prop.facing} facing`);
  if (prop.floors) specs.push(`${prop.floors} floor${Number(prop.floors) > 1 ? 's' : ''}`);
  if (specs.length > 0) {
    sentences.push(`Featuring ${specs.join(', ')}.`);
  }

  // Construction & Quality
  const constr = [];
  if (prop.construction_status) constr.push(`Status: ${prop.construction_status}`);
  if (prop.construction_type) constr.push(prop.construction_type);
  if (prop.roof_type) constr.push(prop.roof_type);
  if (prop.year_built) constr.push(`Built year: ${prop.year_built}`);
  if (constr.length > 0) {
    sentences.push(`High-quality construction with ${constr.join(', ')}.`);
  }

  // Amenities & Features
  const features = [];
  if (prop.compound_wall) features.push('Compound Wall');
  if (prop.gate) features.push('Dedicated Gate');
  if (prop.borewell) features.push('Borewell');
  if (prop.overhead_tank) features.push('Overhead Water Tank');
  if (prop.water_connection) features.push('Drinking Water Connection');
  if (prop.eb_connection) features.push('EB 3-Phase Connection');
  if (prop.sewer_connection) features.push('Drainage/Sewer Facility');
  if (prop.ground_water) features.push('Potable Ground Water');
  if (prop.road_access) features.push(`Direct Road Access${prop.road_width ? ` (${prop.road_width} ${prop.road_width_unit || 'ft'} ${prop.road_type || ''})` : ''}`);
  if (prop.parking_available === 'Yes') features.push('Vehicle Parking');
  if (features.length > 0) {
    sentences.push(`Key Features & Amenities: ${features.join(', ')}.`);
  }

  // Price & Negotiation
  if (prop.price) {
    sentences.push(`Offered at an attractive price of ${prop.price}${prop.negotiable === 'Yes' ? ' (Negotiable)' : ''}.`);
  }

  // Documentation / Legal
  const legal = [];
  if (prop.patta_status === 'Available') legal.push('Clear Patta');
  if (prop.ec_status === 'Available') legal.push('Verified EC');
  if (prop.approved_plan_status === 'Available') legal.push('Approved Building Plan');
  if (prop.sale_deed_status === 'Available') legal.push('Clear Sale Deed');
  if (legal.length > 0) {
    sentences.push(`Documentation: ${legal.join(', ')} available with 100% clear title.`);
  }

  if (prop.other_documents && String(prop.other_documents).trim()) {
    sentences.push(`Registration / Legal Notes: ${String(prop.other_documents).trim()}`);
  }

  return sentences.join('\n\n');
};

const landTitleOptions = [
  'DTCP Approved Residential Plot',
  'CMDA Approved Residential Plot',
  'Residential Land Plot for Sale',
  'Gated Community Villa Plot',
  'Corner Residential Plot for Sale',
  'Prime House Site for Sale',
  'Commercial Land / Plot',
  'Farm Land / Agriculture Plot'
];

const projectTitleOptions = [
  'Individual Villa Construction',
  'Residential House Construction',
  'Duplex Home Construction',
  'Independent House Project',
  'Commercial Building Construction',
  'Modern Villa Project',
  'Turnkey House Construction',
  'Home Renovation & Remodeling'
];

const generateLandDescription = (l) => {
  const parts = [];
  const titleStr = (l.title || '').trim() || (l.land_type || 'Residential Plot');
  const locStr = (l.location || l.area || '').trim();
  const approvalStr = (l.approval_status && l.approval_status !== 'Not Provided') ? l.approval_status : '';
  const areaStr = l.plot_area ? `${l.plot_area} ${l.plot_area_unit || 'sq.ft'}` : '';
  const lengthStr = l.length ? `${l.length} ft` : '';
  const widthStr = l.width ? `${l.width} ft` : '';
  const dimensionsStr = (lengthStr && widthStr) ? ` (${lengthStr} x ${widthStr})` : (l.frontage ? ` (${l.frontage})` : '');

  // Sentence 1: Intro (Approval + Title + Area + Location)
  let intro = '';
  if (approvalStr) {
    intro += `Prime ${approvalStr} `;
  } else {
    intro += 'Prime ';
  }
  intro += titleStr;
  if (areaStr) {
    intro += ` spanning ${areaStr}${dimensionsStr}`;
  }
  intro += ' for sale';
  if (locStr) {
    intro += ` in a prime, developing location of ${locStr}, Chennai`;
  }
  intro += '.';
  parts.push(intro);

  // Sentence 2: Facing, Road, Corner
  const facingStr = l.facing ? `${l.facing} facing` : '';
  const roadWidthStr = l.road_width ? `${l.road_width} ${l.road_width_unit || 'ft'}` : '';
  const roadTypeStr = l.road_type || '';
  const roadDetail = (roadWidthStr && roadTypeStr) ? `${roadWidthStr} ${roadTypeStr}` : (roadWidthStr || roadTypeStr);

  const featurePhrases = [];
  if (facingStr) featurePhrases.push(`is ${facingStr}`);
  if (roadDetail) featurePhrases.push(`has direct access to a ${roadDetail}`);
  if (l.corner_plot === 'Yes') featurePhrases.push('features premium corner plot frontage with dual road access');

  if (featurePhrases.length > 0) {
    parts.push(`The property ${featurePhrases.join(' and ')}.`);
  }

  // Sentence 3: Utilities & Infrastructure Checkboxes
  const facilities = [];
  if (l.eb_available) facilities.push('EB Electricity power line');
  if (l.water_available) facilities.push('Drinking water facility');
  if (l.drainage_available) facilities.push('Drainage / Sewerage system');
  if (l.borewell_available) facilities.push('Sweet ground water');
  if (l.gated_community) facilities.push('Gated community boundary');
  if (l.street_lights) facilities.push('Street lights');

  if (facilities.length > 0) {
    parts.push(`Utilities & Infrastructure: ${facilities.join(', ')}.`);
  }

  // Sentence 4: Documents & Legal
  const docs = [];
  if (l.patta_status === 'Available') docs.push('Clear Patta');
  if (l.ec_status === 'Available' || l.ec_status === 'Clear EC') docs.push('Clear Encumbrance (EC)');
  if (l.parent_documents_status === 'Available' || l.parent_documents_status === 'Verified') docs.push('Parent Documents Verified');
  if (l.approval_documents_status === 'Available') docs.push(`${approvalStr || 'Approval'} Order Copy`);
  if (l.sale_deed_status === 'Available' || l.sale_deed_status === 'Clear Title') docs.push('Clear Sale Deed Title');

  if (docs.length > 0) {
    parts.push(`Documentation & Legal: ${docs.join(', ')} with 100% verified legal titles, ready for immediate registration.`);
  }

  return parts.filter(Boolean).join('\n\n');
};

const generateProjectDescription = (pr) => {
  const parts = [];
  const nameStr = (pr.name || pr.title || '').trim() || 'Residential Construction Project';
  const typeStr = pr.project_type || '';
  const locStr = (pr.location || pr.area || '').trim();
  const builtStr = pr.builtup_area ? `${pr.builtup_area} ${pr.builtup_area_unit || 'sq.ft'}` : '';
  const plotStr = pr.plot_area ? `${pr.plot_area} ${pr.plot_area_unit || 'sq.ft'}` : '';
  const floorsStr = pr.floors ? `${pr.floors} ${Number(pr.floors) === 1 ? 'floor' : 'floors'}` : '';
  const bhkStr = pr.bedrooms ? `${pr.bedrooms} BHK` : '';
  const bathsStr = pr.bathrooms ? `${pr.bathrooms} Bathrooms` : '';

  // Sentence 1: Project Title + Type + Location
  let intro = `Turnkey construction project: ${nameStr}`;
  if (typeStr && !nameStr.toLowerCase().includes(typeStr.toLowerCase())) {
    intro += ` (${typeStr})`;
  }
  if (locStr) {
    intro += ` situated in ${locStr}, Chennai`;
  }
  intro += '.';
  parts.push(intro);

  // Sentence 2: Specs (Builtup area, Plot area, Floors, BHK, Bathrooms)
  const specs = [];
  if (builtStr) specs.push(`${builtStr} built-up area`);
  if (plotStr) specs.push(`${plotStr} plot area`);
  if (floorsStr) specs.push(`${floorsStr}`);
  if (bhkStr) specs.push(`spacious ${bhkStr} layout`);
  if (bathsStr) specs.push(bathsStr);

  if (specs.length > 0) {
    parts.push(`Designed and executed with premium architectural engineering spanning ${specs.join(', ')}.`);
  }

  // Sentence 3: Scope of Construction & Work Checkboxes
  const works = [];
  if (pr.rcc_structure) works.push('High-grade RCC Framed Structure');
  if (pr.concrete_roof) works.push('Reinforced Concrete Roof Slab');
  if (pr.compound_wall) works.push('Architectural Compound Wall');
  if (pr.gate) works.push('Custom Steel Main Gate');
  if (pr.parking) works.push('Covered Car & Bike Parking');
  if (pr.water_connection) works.push('Water Line Connection');
  if (pr.electrical_work) works.push('Concealed Copper Wiring & Modular Switches');
  if (pr.plumbing) works.push('CPVC Plumbing & Branded Sanitaryware');
  if (pr.painting) works.push('Weatherproof Exterior & Putty Interior Finish');
  if (pr.interior_work) works.push('Interior Woodwork & Modular Kitchen');

  if (works.length > 0) {
    parts.push(`Scope of Construction & Quality Highlights: ${works.join(', ')}.`);
  }

  // Sentence 4: Special Features
  if (pr.special_features && pr.special_features.trim()) {
    parts.push(`Special Features: ${pr.special_features.trim()}.`);
  }

  // Sentence 5: Project Status & Completion
  if (pr.status === 'Completed') {
    const compStr = pr.completion_date || pr.actual_completion_date ? ` in ${pr.completion_date || pr.actual_completion_date}` : '';
    parts.push(`Status: Successfully completed and handed over${compStr} with 100% structural quality compliance.`);
  } else if (pr.status === 'Under Construction') {
    parts.push('Status: Construction currently in progress adhering to strict timelines and structural engineering standards.');
  } else if (pr.status === 'Planning & Approvals') {
    parts.push('Status: Planning and approvals stage with customized architectural blueprint design.');
  }

  return parts.filter(Boolean).join('\n\n');
};

const defaultPropertyState = {
  id: null,
  property_id: '',
  title: 'Individual House for Sale',
  type: 'Individual House',
  listing_type: 'For Sale',
  status: 'Available',
  address: '',
  area: 'Poonamallee',
  city: 'Chennai',
  pincode: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  landmark: '',
  price: '',
  price_amount: '',
  price_unit: 'Lakhs',
  price_display_type: 'Exact Price',
  negotiable: 'Yes',
  price_per_sqft: '',
  plot_area: '',
  plot_area_unit: 'sq.ft',
  builtup_area: '',
  builtup_area_unit: 'sq.ft',
  floor_area: '',
  floors: '',
  bedrooms: '',
  bathrooms: '',
  balconies: '',
  kitchens: '',
  living_room: '',
  dining_area: '',
  pooja_room: '',
  construction_status: 'Completed',
  year_built: '',
  construction_type: 'RCC / Concrete',
  roof_type: 'RCC Flat Concrete Roof',
  parking_available: 'Yes',
  parking_type: 'Car + Bike',
  cars: '',
  bikes: '',
  compound_wall: false,
  gate: false,
  water_connection: false,
  eb_connection: false,
  sewer_connection: false,
  borewell: false,
  overhead_tank: false,
  ground_water: false,
  road_access: false,
  facing: 'East',
  road_width: '',
  road_width_unit: 'ft',
  road_type: 'Tar Road',
  corner_property: 'No',
  patta_status: 'Available',
  ec_status: 'Available',
  approved_plan_status: 'Available',
  building_approval_status: 'Available',
  property_tax_status: 'Available',
  sale_deed_status: 'Available',
  other_documents: '',
  short_description: '',
  full_description: '',
  description: '',
  highlights: '',
  published: true,
  featured: false,
  location: 'Poonamallee',
  image: '',
  images: [],
  isDescriptionCustomized: false
};

const defaultLandState = {
  id: null,
  land_id: '',
  title: 'DTCP Approved Residential Plot',
  land_type: 'Residential Plot',
  listing_type: 'For Sale',
  status: 'Available',
  address: '',
  area: 'Poonamallee',
  city: 'Chennai',
  pincode: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  landmark: '',
  plot_area: '',
  plot_area_unit: 'sq.ft',
  frontage: '',
  length: '',
  width: '',
  total_price: '',
  price_amount: '',
  price_unit: 'Lakhs',
  price_per_sqft: '',
  negotiable: 'Yes',
  price_display_type: 'Exact Price',
  approval_status: 'DTCP Approved',
  facing: 'East',
  road_width: '',
  road_width_unit: 'ft',
  road_type: 'Tar Road',
  road_facing: 'North',
  corner_plot: 'No',
  eb_available: false,
  water_available: false,
  drainage_available: false,
  borewell_available: false,
  gated_community: false,
  street_lights: false,
  patta_status: 'Available',
  ec_status: 'Available',
  parent_documents_status: 'Available',
  sale_deed_status: 'Available',
  approval_documents_status: 'Available',
  other_documents: '',
  nearby_school: '',
  nearby_hospital: '',
  nearby_bus_stop: '',
  nearby_railway: '',
  nearby_main_road: '',
  nearby_shopping: '',
  short_description: '',
  full_description: '',
  description: '',
  highlights: '',
  published: true,
  featured: false,
  location: 'Poonamallee',
  image: '',
  images: [],
  isDescriptionCustomized: false
};

const defaultProjectState = {
  id: null,
  project_id: '',
  name: 'Individual Villa Construction',
  title: 'Individual Villa Construction',
  project_type: 'Individual House',
  status: 'Completed',
  address: '',
  area: 'Poonamallee',
  city: 'Chennai',
  pincode: '',
  maps_url: '',
  latitude: '',
  longitude: '',
  plot_area: '',
  plot_area_unit: 'sq.ft',
  builtup_area: '',
  builtup_area_unit: 'sq.ft',
  floors: '',
  bedrooms: '',
  bathrooms: '',
  start_date: '',
  expected_completion_date: '',
  actual_completion_date: '',
  completion_date: '',
  rcc_structure: false,
  concrete_roof: false,
  compound_wall: false,
  gate: false,
  parking: false,
  water_connection: false,
  electrical_work: false,
  plumbing: false,
  painting: false,
  interior_work: false,
  overview: '',
  description: '',
  construction_details: '',
  special_features: '',
  challenges: '',
  solutions: '',
  client_requirements: '',
  final_outcome: '',
  cover_image: '',
  image: '',
  published: true,
  featured: false,
  location: 'Poonamallee',
  images: [],
  isDescriptionCustomized: false
};

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!sessionStorage.getItem('sk_admin_token');
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Credentials CRUD State
  const [adminUserForm, setAdminUserForm] = useState({ currentPassword: '', newUsername: 'admin', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [credStatusMsg, setCredStatusMsg] = useState('');
  const [credErrorMsg, setCredErrorMsg] = useState('');
  const [settingStatusMsg, setSettingStatusMsg] = useState('');

  const VALID_TABS = ['dashboard', 'properties', 'land', 'projects', 'gallery', 'feedbacks', 'testimonials', 'leads', 'settings', 'videos'];

  // Persist active section tab across reloads in sessionStorage
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('sk_admin_active_tab');
    if (saved === 'houses') return 'properties';
    return VALID_TABS.includes(saved) ? saved : 'dashboard';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    sessionStorage.setItem('sk_admin_active_tab', tabId);
  };

  // Modal Form Visibility States
  const [modalType, setModalType] = useState(null); // 'property_form', 'land_form', 'project_form', 'service_form', 'gallery_form', 'rename_video', 'confirm_delete'
  const [formStep, setFormStep] = useState(1);
  const [deleteConfig, setDeleteConfig] = useState({ title: '', onConfirm: () => { } });

  // Filter & Search States
  const [propSearch, setPropSearch] = useState('');
  const [landSearch, setLandSearch] = useState('');
  const [projSearch, setProjSearch] = useState('');
  const [feedSearch, setFeedSearch] = useState('');

  // Database Data States
  const defaultSettingsState = {
    company_name: 'SK BUILDERS',
    company_subtitle: '& PROPERTY CONSULTANT',
    phone: '9876543210',
    whatsapp_number: '9876543210',
    email: 'info@skbuilders.com',
    location: 'Poonamallee, Chennai',
    service_areas: 'Poonamallee, Mangadu, Kundrathur',
    logo_url: '/logo/sk-builders-logo.png',
    site_title: 'SK Builders & Property Consultant',
    meta_description: 'Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance.'
  };

  const [settings, setSettings] = useState(defaultSettingsState);
  const [settingsForm, setSettingsForm] = useState(defaultSettingsState);
  const [isSettingsFormDirty, setIsSettingsFormDirty] = useState(false);
  const [services, setServices] = useState([]);
  const [properties, setProperties] = useState([]);
  const [land, setLand] = useState([]);
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [leads, setLeads] = useState([]);
  const [videos, setVideos] = useState([]);
  const [statusNotice, setStatusNotice] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);


  // Dynamically compute location selection options from Admin Settings -> Service Areas
  const serviceAreaOptions = getServiceAreaOptions(settingsForm.service_areas || settings?.service_areas, settingsForm.location || settings?.location);

  // Set Admin Tab Title
  useEffect(() => {
    document.title = `${settings?.company_name || 'Admin'} - Admin Portal`;
  }, [settings?.company_name]);

  const [formProp, setFormProp] = useState(defaultPropertyState);
  const [formTestimonial, setFormTestimonial] = useState({ id: null, client_name: '', location: '', quote: '', rating: 5 });
  const [testSearch, setTestSearch] = useState('');
  const [propertyImagesList, setPropertyImagesList] = useState([]);
  const [stagedDeletedPropertyImages, setStagedDeletedPropertyImages] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [uploadingBasicImage, setUploadingBasicImage] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [propertyFormError, setPropertyFormError] = useState('');
  const [isCustomPropertyTitle, setIsCustomPropertyTitle] = useState(false);
  const [draggedImgIdx, setDraggedImgIdx] = useState(null);
  const [dragOverImgIdx, setDragOverImgIdx] = useState(null);

  const updateFormProp = (updates) => {
    setFormProp(prev => {
      const next = { ...prev, ...updates };
      if (!next.isDescriptionCustomized) {
        next.description = generatePropertyDescription(next);
      }
      return next;
    });
  };

  const handleSelectMultipleImages = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploadingBasicImage(true);

    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/media/upload-image?section=properties', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.imageUrl) {
          newItems.push({
            id: `upl-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            url: data.imageUrl,
            file
          });
        } else {
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
          newItems.push({
            id: `upl-${Date.now()}-${i}`,
            url: dataUrl,
            file
          });
        }
      } catch (err) {
        console.error('Upload failed, using data url fallback:', err);
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
        newItems.push({
          id: `upl-${Date.now()}-${i}`,
          url: dataUrl,
          file
        });
      }
    }

    setUploadingBasicImage(false);
    const updatedList = [...propertyImagesList, ...newItems];
    setPropertyImagesList(updatedList);
    if (updatedList.length > 0) {
      updateFormProp({ image: updatedList[0].url });
    }
    e.target.value = '';
  };

  const handleImageDragStart = (e, index) => {
    setDraggedImgIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {}
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverImgIdx !== index) {
      setDragOverImgIdx(index);
    }
  };

  const handleImageDragLeave = (e, index) => {
    if (dragOverImgIdx === index) {
      setDragOverImgIdx(null);
    }
  };

  const handleImageDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedImgIdx === null || draggedImgIdx === targetIndex) {
      setDraggedImgIdx(null);
      setDragOverImgIdx(null);
      return;
    }

    const list = [...propertyImagesList];
    const [draggedItem] = list.splice(draggedImgIdx, 1);
    list.splice(targetIndex, 0, draggedItem);

    setPropertyImagesList(list);
    if (list.length > 0) {
      updateFormProp({ image: list[0].url });
    }
    setDraggedImgIdx(null);
    setDragOverImgIdx(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImgIdx(null);
    setDragOverImgIdx(null);
  };

  const setPropertyCoverImage = (index) => {
    if (index === 0 || index >= propertyImagesList.length) return;
    const list = [...propertyImagesList];
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    setPropertyImagesList(list);
    updateFormProp({ image: list[0].url });
  };

  const removePropertyImage = (index) => {
    const itemToRemove = propertyImagesList[index];
    const list = propertyImagesList.filter((_, i) => i !== index);
    setPropertyImagesList(list);
    const newCover = list.length > 0 ? list[0].url : '';
    updateFormProp({ image: newCover });

    // Stage image for deletion on Save Property ONLY (do NOT delete physically or from DB on "X" click)
    if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
      setStagedDeletedPropertyImages(prev => [...prev, itemToRemove]);
    }
  };

  const propertyTitleOptions = [
    'Individual House for Sale',
    'Independent Villa for Sale',
    'Duplex Villa',
    'Luxury Villa for Sale',
    'Modern Residential House',
    'Contemporary House for Sale',
    'Premium Independent House',
    'Residential Building',
    'Commercial Building',
    'Independent House'
  ];

  const openCreateProperty = () => {
    setFormStep(1);
    setFormProp({
      ...defaultPropertyState,
      location: serviceAreaOptions[0] || 'Poonamallee'
    });
    setPropertyImagesList([]);
    setStagedDeletedPropertyImages([]);
    setSelectedImageFiles([]);
    setPropertyFormError('');
    setIsCustomPropertyTitle(false);
    setModalType('property_form');
  };

  const openEditProperty = async (p) => {
    const isCustom = !propertyTitleOptions.includes(p.title);
    setIsCustomPropertyTitle(isCustom);
    setStagedDeletedPropertyImages([]);

    let cleanPlotArea = '';
    let cleanPlotUnit = p.plot_area_unit || 'sq.ft';
    if (p.plot_area) {
      const rawPlot = String(p.plot_area);
      if (rawPlot.toLowerCase().includes('sq.m')) cleanPlotUnit = 'sq.m';
      else if (rawPlot.toLowerCase().includes('cent')) cleanPlotUnit = 'Cent';
      else if (rawPlot.toLowerCase().includes('ground')) cleanPlotUnit = 'Ground';
      else if (rawPlot.toLowerCase().includes('acre')) cleanPlotUnit = 'Acre';
      else if (rawPlot.toLowerCase().includes('sq')) cleanPlotUnit = 'sq.ft';
      const match = rawPlot.replace(/sq\.ft|sqft|sq\.m|sqm/gi, '').match(/[\d]+(?:\.[\d]+)?/);
      cleanPlotArea = match ? match[0] : rawPlot.replace(/[^0-9.]/g, '');
    }

    let cleanBuiltupArea = '';
    let cleanBuiltupUnit = p.builtup_area_unit || 'sq.ft';
    if (p.builtup_area) {
      const rawBuilt = String(p.builtup_area);
      if (rawBuilt.toLowerCase().includes('sq.m')) cleanBuiltupUnit = 'sq.m';
      else if (rawBuilt.toLowerCase().includes('cent')) cleanBuiltupUnit = 'Cent';
      else if (rawBuilt.toLowerCase().includes('ground')) cleanBuiltupUnit = 'Ground';
      else if (rawBuilt.toLowerCase().includes('sq')) cleanBuiltupUnit = 'sq.ft';
      const match = rawBuilt.replace(/sq\.ft|sqft|sq\.m|sqm/gi, '').match(/[\d]+(?:\.[\d]+)?/);
      cleanBuiltupArea = match ? match[0] : rawBuilt.replace(/[^0-9.]/g, '');
    }

    let cleanBedrooms = '';
    if (p.bedrooms) {
      const match = String(p.bedrooms).match(/\d+/);
      cleanBedrooms = match ? match[0] : '';
    }

    let cleanRoadWidth = '';
    let cleanRoadUnit = p.road_width_unit || 'ft';
    if (p.road_width) {
      const rawRoad = String(p.road_width);
      if (rawRoad.toLowerCase().includes('inch')) cleanRoadUnit = 'inch';
      else if (rawRoad.toLowerCase().includes('meter')) cleanRoadUnit = 'meter';
      else if (rawRoad.toLowerCase().includes('ft')) cleanRoadUnit = 'ft';
      const match = rawRoad.match(/[\d]+(?:\.[\d]+)?/);
      cleanRoadWidth = match ? match[0] : '';
    }

    const priceMatch = (p.price || '').replace(/[^0-9.]/g, '');
    const priceUnit = (p.price || '').includes('Crore') ? 'Crores' : (p.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs';

    setFormProp({
      ...defaultPropertyState,
      ...p,
      plot_area: cleanPlotArea,
      plot_area_unit: cleanPlotUnit,
      builtup_area: cleanBuiltupArea,
      builtup_area_unit: cleanBuiltupUnit,
      bedrooms: cleanBedrooms,
      road_width: cleanRoadWidth,
      road_width_unit: cleanRoadUnit,
      price_amount: priceMatch,
      price_unit: priceUnit,
      published: !!p.published,
      featured: !!p.featured,
      isDescriptionCustomized: !!(p.description || p.full_description)
    });
    setPropertyFormError('');
    setFormStep(1);
    setSelectedImageFiles([]);
    setModalType('property_form');

    const initialImgs = [];
    if (p.image && p.image !== '/house/completed-house.jpg' && !p.image.includes('logo')) {
      initialImgs.push({ id: `main-${p.id}`, url: p.image, isCover: true });
    }
    setPropertyImagesList(initialImgs);

    try {
      const res = await fetch(`/api/properties/${p.id}`);
      const data = await res.json();
      if (data.property && Array.isArray(data.property.images) && data.property.images.length > 0) {
        const mapped = data.property.images.map((img, i) => ({
          id: img.id,
          url: img.image_url,
          isCover: !!img.is_cover || i === 0
        }));
        setPropertyImagesList(mapped);
      }
    } catch (err) {
      console.error('Error fetching property images:', err);
    }
  };

  // Land Form State
  const [formLand, setFormLand] = useState(defaultLandState);
  const [landImagesList, setLandImagesList] = useState([]);
  const [stagedDeletedLandImages, setStagedDeletedLandImages] = useState([]);
  const [uploadingLandImage, setUploadingLandImage] = useState(false);
  const [isSavingLand, setIsSavingLand] = useState(false);
  const [landFormError, setLandFormError] = useState('');
  const [isCustomLandTitle, setIsCustomLandTitle] = useState(false);
  const [draggedLandImgIdx, setDraggedLandImgIdx] = useState(null);
  const [dragOverLandImgIdx, setDragOverLandImgIdx] = useState(null);

  const updateFormLand = (updates) => {
    setFormLand(prev => {
      const next = { ...prev, ...updates };
      if (!next.isDescriptionCustomized) {
        next.description = generateLandDescription(next);
      }
      return next;
    });
  };

  const handleSelectMultipleLandImages = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploadingLandImage(true);

    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/media/upload-image?section=land', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.imageUrl) {
          newItems.push({
            id: `upl-land-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            url: data.imageUrl,
            file
          });
        }
      } catch (err) {
        console.error('Land image upload error:', err);
      }
    }

    setUploadingLandImage(false);
    const updatedList = [...landImagesList, ...newItems];
    setLandImagesList(updatedList);
    if (updatedList.length > 0) {
      updateFormLand({ image: updatedList[0].url });
    }
    e.target.value = '';
  };

  const handleLandImageDragStart = (e, index) => {
    setDraggedLandImgIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) {}
  };

  const handleLandImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLandImgIdx !== index) setDragOverLandImgIdx(index);
  };

  const handleLandImageDragLeave = (e, index) => {
    if (dragOverLandImgIdx === index) setDragOverLandImgIdx(null);
  };

  const handleLandImageDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedLandImgIdx === null || draggedLandImgIdx === targetIndex) {
      setDraggedLandImgIdx(null);
      setDragOverLandImgIdx(null);
      return;
    }
    const list = [...landImagesList];
    const [draggedItem] = list.splice(draggedLandImgIdx, 1);
    list.splice(targetIndex, 0, draggedItem);
    setLandImagesList(list);
    if (list.length > 0) updateFormLand({ image: list[0].url });
    setDraggedLandImgIdx(null);
    setDragOverLandImgIdx(null);
  };

  const handleLandImageDragEnd = () => {
    setDraggedLandImgIdx(null);
    setDragOverLandImgIdx(null);
  };

  const setLandCoverImage = (index) => {
    if (index === 0 || index >= landImagesList.length) return;
    const list = [...landImagesList];
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    setLandImagesList(list);
    updateFormLand({ image: list[0].url });
  };

  const removeLandImage = (index) => {
    const itemToRemove = landImagesList[index];
    const list = landImagesList.filter((_, i) => i !== index);
    setLandImagesList(list);
    const newCover = list.length > 0 ? list[0].url : '';
    updateFormLand({ image: newCover });
    if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
      setStagedDeletedLandImages(prev => [...prev, itemToRemove]);
    }
  };

  const openCreateLand = () => {
    setFormStep(1);
    const initialLand = {
      ...defaultLandState,
      location: serviceAreaOptions[0] || 'Poonamallee'
    };
    initialLand.description = generateLandDescription(initialLand);
    setFormLand(initialLand);
    setLandImagesList([]);
    setStagedDeletedLandImages([]);
    setLandFormError('');
    setIsCustomLandTitle(false);
    setModalType('land_form');
  };

  const openEditLand = async (l) => {
    const isCustom = !landTitleOptions.includes(l.title);
    setIsCustomLandTitle(isCustom);
    setStagedDeletedLandImages([]);

    let cleanPlotArea = '';
    let cleanPlotUnit = l.plot_area_unit || 'sq.ft';
    if (l.plot_area) {
      const rawPlot = String(l.plot_area);
      if (rawPlot.toLowerCase().includes('sq.m')) cleanPlotUnit = 'sq.m';
      else if (rawPlot.toLowerCase().includes('cent')) cleanPlotUnit = 'Cent';
      else if (rawPlot.toLowerCase().includes('ground')) cleanPlotUnit = 'Ground';
      else if (rawPlot.toLowerCase().includes('acre')) cleanPlotUnit = 'Acre';
      else if (rawPlot.toLowerCase().includes('sq')) cleanPlotUnit = 'sq.ft';
      const match = rawPlot.replace(/sq\.ft|sqft|sq\.m|sqm/gi, '').match(/[\d]+(?:\.[\d]+)?/);
      cleanPlotArea = match ? match[0] : rawPlot.replace(/[^0-9.]/g, '');
    }

    let cleanRoadWidth = '';
    let cleanRoadUnit = l.road_width_unit || 'ft';
    if (l.road_width) {
      const rawRoad = String(l.road_width);
      if (rawRoad.toLowerCase().includes('meter')) cleanRoadUnit = 'meter';
      else if (rawRoad.toLowerCase().includes('ft')) cleanRoadUnit = 'ft';
      const match = rawRoad.match(/[\d]+(?:\.[\d]+)?/);
      cleanRoadWidth = match ? match[0] : '';
    }

    let cleanLength = l.length ? String(l.length).replace(/[^0-9.]/g, '') : '';
    let cleanWidth = l.width ? String(l.width).replace(/[^0-9.]/g, '') : '';

    const priceMatch = (l.total_price || l.price || '').replace(/[^0-9.]/g, '');
    const priceUnit = (l.total_price || l.price || '').includes('Crore') ? 'Crores' : (l.total_price || l.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs';

    setFormLand({
      ...defaultLandState,
      ...l,
      plot_area: cleanPlotArea,
      plot_area_unit: cleanPlotUnit,
      length: cleanLength,
      width: cleanWidth,
      road_width: cleanRoadWidth,
      road_width_unit: cleanRoadUnit,
      price_amount: priceMatch,
      price_unit: priceUnit,
      published: !!l.published,
      featured: !!l.featured,
      isDescriptionCustomized: !!(l.description || l.full_description)
    });
    setLandFormError('');
    setFormStep(1);
    setModalType('land_form');

    const initialImgs = [];
    if (l.image && l.image !== '/house/completed-house.jpg' && !l.image.includes('logo')) {
      initialImgs.push({ id: `main-land-${l.id}`, url: l.image, isCover: true });
    }
    setLandImagesList(initialImgs);

    try {
      const res = await fetch(`/api/land/${l.id}`);
      const data = await res.json();
      if (data.land && Array.isArray(data.land.images) && data.land.images.length > 0) {
        const mapped = data.land.images.map((img, i) => ({
          id: img.id,
          url: img.image_url,
          isCover: !!img.is_cover || i === 0
        }));
        setLandImagesList(mapped);
      }
    } catch (err) {
      console.error('Error fetching land images:', err);
    }
  };

  // Projects Form State
  const [formProj, setFormProj] = useState(defaultProjectState);
  const [projectImagesList, setProjectImagesList] = useState([]);
  const [stagedDeletedProjectImages, setStagedDeletedProjectImages] = useState([]);
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectFormError, setProjectFormError] = useState('');
  const [isCustomProjectTitle, setIsCustomProjectTitle] = useState(false);
  const [draggedProjImgIdx, setDraggedProjImgIdx] = useState(null);
  const [dragOverProjImgIdx, setDragOverProjImgIdx] = useState(null);

  const updateFormProj = (updates) => {
    setFormProj(prev => {
      const next = { ...prev, ...updates };
      if (!next.isDescriptionCustomized) {
        const desc = generateProjectDescription(next);
        next.description = desc;
        next.overview = desc;
      }
      return next;
    });
  };

  const handleSelectMultipleProjectImages = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setUploadingProjectImage(true);

    const newItems = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/media/upload-image?section=projects', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.imageUrl) {
          newItems.push({
            id: `upl-proj-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            url: data.imageUrl,
            file
          });
        }
      } catch (err) {
        console.error('Project image upload error:', err);
      }
    }

    setUploadingProjectImage(false);
    const updatedList = [...projectImagesList, ...newItems];
    setProjectImagesList(updatedList);
    if (updatedList.length > 0) {
      updateFormProj({ cover_image: updatedList[0].url, image: updatedList[0].url });
    }
    e.target.value = '';
  };

  const handleProjImageDragStart = (e, index) => {
    setDraggedProjImgIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(index)); } catch (err) {}
  };

  const handleProjImageDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProjImgIdx !== index) setDragOverProjImgIdx(index);
  };

  const handleProjImageDragLeave = (e, index) => {
    if (dragOverProjImgIdx === index) setDragOverProjImgIdx(null);
  };

  const handleProjImageDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedProjImgIdx === null || draggedProjImgIdx === targetIndex) {
      setDraggedProjImgIdx(null);
      setDragOverProjImgIdx(null);
      return;
    }
    const list = [...projectImagesList];
    const [draggedItem] = list.splice(draggedProjImgIdx, 1);
    list.splice(targetIndex, 0, draggedItem);
    setProjectImagesList(list);
    if (list.length > 0) updateFormProj({ cover_image: list[0].url, image: list[0].url });
    setDraggedProjImgIdx(null);
    setDragOverProjImgIdx(null);
  };

  const handleProjImageDragEnd = () => {
    setDraggedProjImgIdx(null);
    setDragOverProjImgIdx(null);
  };

  const setProjectCoverImage = (index) => {
    if (index === 0 || index >= projectImagesList.length) return;
    const list = [...projectImagesList];
    const item = list.splice(index, 1)[0];
    list.unshift(item);
    setProjectImagesList(list);
    updateFormProj({ cover_image: list[0].url, image: list[0].url });
  };

  const removeProjectImage = (index) => {
    const itemToRemove = projectImagesList[index];
    const list = projectImagesList.filter((_, i) => i !== index);
    setProjectImagesList(list);
    const newCover = list.length > 0 ? list[0].url : '';
    updateFormProj({ cover_image: newCover, image: newCover });
    if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
      setStagedDeletedProjectImages(prev => [...prev, itemToRemove]);
    }
  };

  const openCreateProject = () => {
    setFormStep(1);
    const initialProj = {
      ...defaultProjectState,
      location: serviceAreaOptions[0] || 'Poonamallee'
    };
    initialProj.description = generateProjectDescription(initialProj);
    initialProj.overview = initialProj.description;
    setFormProj(initialProj);
    setProjectImagesList([]);
    setStagedDeletedProjectImages([]);
    setProjectFormError('');
    setIsCustomProjectTitle(false);
    setModalType('project_form');
  };

  const openEditProject = async (pr) => {
    const currentName = pr.name || pr.title || 'Individual Villa Construction';
    const isCustom = !projectTitleOptions.includes(currentName);
    setIsCustomProjectTitle(isCustom);
    setStagedDeletedProjectImages([]);

    let cleanBuiltupArea = '';
    let cleanBuiltupUnit = pr.builtup_area_unit || 'sq.ft';
    if (pr.builtup_area) {
      const rawBuilt = String(pr.builtup_area);
      if (rawBuilt.toLowerCase().includes('sq.m')) cleanBuiltupUnit = 'sq.m';
      else if (rawBuilt.toLowerCase().includes('sq')) cleanBuiltupUnit = 'sq.ft';
      const match = rawBuilt.match(/[\d]+(?:\.[\d]+)?/);
      cleanBuiltupArea = match ? match[0] : rawBuilt.replace(/[^0-9.]/g, '');
    }

    let cleanPlotArea = '';
    let cleanPlotUnit = pr.plot_area_unit || 'sq.ft';
    if (pr.plot_area) {
      const rawPlot = String(pr.plot_area);
      if (rawPlot.toLowerCase().includes('sq.m')) cleanPlotUnit = 'sq.m';
      else if (rawPlot.toLowerCase().includes('sq')) cleanPlotUnit = 'sq.ft';
      const match = rawPlot.match(/[\d]+(?:\.[\d]+)?/);
      cleanPlotArea = match ? match[0] : rawPlot.replace(/[^0-9.]/g, '');
    }

    let cleanFloors = pr.floors ? String(pr.floors).replace(/[^0-9]/g, '') : '';
    let cleanBedrooms = pr.bedrooms ? String(pr.bedrooms).replace(/[^0-9]/g, '') : '';
    let cleanBathrooms = pr.bathrooms ? String(pr.bathrooms).replace(/[^0-9]/g, '') : '';

    setFormProj({
      ...defaultProjectState,
      ...pr,
      name: currentName,
      title: currentName,
      builtup_area: cleanBuiltupArea,
      builtup_area_unit: cleanBuiltupUnit,
      plot_area: cleanPlotArea,
      plot_area_unit: cleanPlotUnit,
      floors: cleanFloors,
      bedrooms: cleanBedrooms,
      bathrooms: cleanBathrooms,
      published: !!pr.published,
      featured: !!pr.featured,
      isDescriptionCustomized: !!(pr.description || pr.overview)
    });
    setProjectFormError('');
    setFormStep(1);
    setModalType('project_form');

    const initialImgs = [];
    const cover = pr.cover_image || pr.image;
    if (cover && cover !== '/house/completed-house.jpg' && !cover.includes('logo')) {
      initialImgs.push({ id: `main-proj-${pr.id}`, url: cover, isCover: true });
    }
    setProjectImagesList(initialImgs);

    try {
      const res = await fetch(`/api/projects/${pr.id}`);
      const data = await res.json();
      if (data.project && Array.isArray(data.project.images) && data.project.images.length > 0) {
        const mapped = data.project.images.map((img, i) => ({
          id: img.id,
          url: img.image_url,
          isCover: i === 0
        }));
        setProjectImagesList(mapped);
      }
    } catch (err) {
      console.error('Error fetching project images:', err);
    }
  };

  const [formSrv, setFormSrv] = useState({ id: null, title: '', description: '', icon_name: 'Home', link_url: '#properties', display_order: 1 });
  const [formGal, setFormGal] = useState({ id: null, image: '' });
  const [videoRename, setVideoRename] = useState({ id: null, currentName: '', newName: '' });

  // Hero & Background Video Upload State & Refs
  const [selectedHeroVideoFile, setSelectedHeroVideoFile] = useState(null);
  const [customHeroVideoName, setCustomHeroVideoName] = useState('');
  const [heroDupError, setHeroDupError] = useState(false);
  const heroFileInputRef = useRef(null);
  const heroRenameInputRef = useRef(null);

  const [selectedBgVideoFile, setSelectedBgVideoFile] = useState(null);
  const [customBgVideoName, setCustomBgVideoName] = useState('');
  const [bgDupError, setBgDupError] = useState(false);
  const bgFileInputRef = useRef(null);
  const bgRenameInputRef = useRef(null);
  const [videoSectionTab, setVideoSectionTab] = useState('hero'); // 'hero' | 'background'

  // Load session token
  useEffect(() => {
    const token = sessionStorage.getItem('sk_admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, srvRes, propRes, landRes, projRes, galRes, feedRes, testRes, leadRes, vidRes] = await Promise.all([
        fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/services').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/properties').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/land').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/projects').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/gallery').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/feedback?all=true').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/testimonials').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/leads').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/media/videos').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (sRes?.settings) {
        setSettings(sRes.settings);
        setSettingsForm(prev => {
          if (!isSettingsFormDirty) {
            const rawAreas = sRes.settings.service_areas || '';
            const commaAreas = rawAreas ? rawAreas.replace(/\s*•\s*/g, ', ') : 'Poonamallee, Mangadu, Kundrathur';
            return {
              ...defaultSettingsState,
              ...sRes.settings,
              service_areas: commaAreas
            };
          }
          return prev;
        });
      }
      setServices(Array.isArray(srvRes) ? srvRes : []);
      setProperties(Array.isArray(propRes?.properties) ? propRes.properties : (Array.isArray(propRes) ? propRes : []));
      setLand(Array.isArray(landRes?.land) ? landRes.land : (Array.isArray(landRes) ? landRes : []));
      setProjects(Array.isArray(projRes?.projects) ? projRes.projects : (Array.isArray(projRes) ? projRes : []));
      setGallery(Array.isArray(galRes) ? galRes : []);
      setFeedbacks(Array.isArray(feedRes) ? feedRes : []);
      setTestimonials(Array.isArray(testRes) ? testRes : []);
      setLeads(Array.isArray(leadRes) ? leadRes : []);
      setVideos(Array.isArray(vidRes) ? vidRes : []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/settings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('sk_admin_token', data.token);
        sessionStorage.setItem('sk_admin_active_tab', 'dashboard');
        setActiveTab('dashboard');
        setIsAuthenticated(true);
        setLoginError('');
        fetchData();
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Unable to connect to backend server.');
    }
  };


  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredStatusMsg('');
    setCredErrorMsg('');

    if (adminUserForm.newPassword !== adminUserForm.confirmPassword) {
      setCredErrorMsg('New passwords do not match!');
      return;
    }

    try {
      const res = await fetch('/api/settings/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: adminUserForm.currentPassword,
          newUsername: adminUserForm.newUsername,
          newPassword: adminUserForm.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCredStatusMsg('Admin username & password updated successfully!');
        setAdminUserForm({ currentPassword: '', newUsername: adminUserForm.newUsername, newPassword: '', confirmPassword: '' });
        fetchData();
        setTimeout(() => setCredStatusMsg(''), 4000);
      } else {
        setCredErrorMsg(data.error || 'Failed to update credentials.');
      }
    } catch (err) {
      setCredErrorMsg('Server error updating credentials.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingStatusMsg('');

    try {
      const company = settingsForm.company_name ?? settings.company_name ?? 'SK BUILDERS';
      const subtitle = settingsForm.company_subtitle ?? settings.company_subtitle ?? '& PROPERTY CONSULTANT';
      const defaultTitle = `${company} ${subtitle}`.trim();
      const payload = {
        ...settingsForm,
        company_name: company,
        company_subtitle: subtitle,
        site_title: settingsForm.site_title || defaultTitle,
        meta_description: settingsForm.meta_description ?? settings.meta_description ?? ''
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsSettingsFormDirty(false);
        setSettings(payload);
        setSettingStatusMsg('Website settings saved successfully!');
        fetchData();
        notifySiteDataUpdated();
        setTimeout(() => setSettingStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const logoInputRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingsForm(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingStatusMsg('New logo uploaded successfully!');
        fetchData();
        notifySiteDataUpdated();
        setTimeout(() => setSettingStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleResetLogo = async () => {
    try {
      const res = await fetch('/api/settings/reset-logo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSettings(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingsForm(prev => ({ ...prev, logo_url: data.logo_url }));
        setSettingStatusMsg('Logo reset to default!');
        fetchData();
        notifySiteDataUpdated();
        setTimeout(() => setSettingStatusMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error resetting logo:', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sk_admin_token');
    sessionStorage.removeItem('sk_admin_active_tab');
    sessionStorage.clear();
    setIsAuthenticated(false);
  };

  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/media/upload-image', { method: 'POST', body: formData });
    const data = await res.json();
    return data.imageUrl;
  };

  // Upload Batch Images helper
  const handleBatchImageUpload = async (endpoint, recordId, files, category = 'completed') => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    formData.append('category', category);

    await fetch(`${endpoint}/${recordId}/images`, {
      method: 'POST',
      body: formData
    });
  };

  // Save Property Submit
  const handleSaveProperty = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPropertyFormError('');
    setIsSavingProperty(true);

    try {
      const isEdit = !!formProp.id;
      const url = isEdit ? `/api/properties/${formProp.id}` : '/api/properties';
      const method = isEdit ? 'PUT' : 'POST';

      const coverImg = (propertyImagesList.length > 0 && propertyImagesList[0].url)
        ? propertyImagesList[0].url
        : (formProp.image && formProp.image !== '/house/completed-house.jpg' && !formProp.image.includes('logo') ? formProp.image : '');

      const finalDesc = formProp.description || generatePropertyDescription(formProp);
      const finalPrice = formProp.price_amount
        ? `₹${formProp.price_amount} ${formProp.price_unit || 'Lakhs'}`
        : (formProp.price?.trim() || 'Price on Request');

      const cleanPlot = formProp.plot_area ? String(formProp.plot_area).trim() : '';
      const cleanBuilt = formProp.builtup_area ? String(formProp.builtup_area).trim() : '';
      const cleanBed = formProp.bedrooms ? (String(formProp.bedrooms).includes('BHK') ? formProp.bedrooms : `${formProp.bedrooms} BHK`) : '';
      const cleanRoad = formProp.road_width ? String(formProp.road_width).trim() : '';

      const payload = {
        ...formProp,
        title: formProp.title?.trim() || 'Individual House for Sale',
        price: finalPrice,
        bedrooms: cleanBed,
        plot_area: cleanPlot,
        plot_area_unit: formProp.plot_area_unit || 'sq.ft',
        builtup_area: cleanBuilt,
        builtup_area_unit: formProp.builtup_area_unit || 'sq.ft',
        road_width: cleanRoad,
        road_width_unit: formProp.road_width_unit || 'ft',
        image: coverImg,
        description: finalDesc,
        full_description: finalDesc,
        short_description: finalDesc.split('\n\n')[0] || ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error saving property to database.');
      }

      const recordId = isEdit ? formProp.id : data.id;

      // Execute physical file & DB deletion for images removed with "X" ONLY upon Save Property
      if (stagedDeletedPropertyImages.length > 0) {
        for (const itemToRemove of stagedDeletedPropertyImages) {
          if (itemToRemove && itemToRemove.url && !itemToRemove.url.startsWith('data:')) {
            try {
              await fetch('/api/properties/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  propertyId: recordId || formProp.id || null,
                  imageUrl: itemToRemove.url,
                  imageId: typeof itemToRemove.id === 'number' ? itemToRemove.id : null
                })
              });
            } catch (delErr) {
              console.error('Error deleting staged image from server & database:', delErr);
            }
          }
        }
        setStagedDeletedPropertyImages([]);
      }

      // Sync ordered images with backend
      if (propertyImagesList.length > 0 && recordId) {
        try {
          await fetch(`/api/properties/${recordId}/images/sync`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: propertyImagesList.map(item => item.url) })
          });
        } catch (syncErr) {
          console.error('Batch image sync warning:', syncErr);
        }
      }

      if (Array.isArray(selectedImageFiles) && selectedImageFiles.length > 0 && recordId) {
        try {
          await handleBatchImageUpload('/api/properties', recordId, selectedImageFiles);
        } catch (imgErr) {
          console.error('Batch image upload warning:', imgErr);
        }
      }

      await fetchData();
      notifySiteDataUpdated();
      setModalType(null);
      setSelectedImageFiles([]);
      setPropertyImagesList([]);
      setStatusNotice(isEdit ? 'Property updated successfully!' : 'New Property saved successfully to database!');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.error('Error saving property:', err);
      setPropertyFormError(err.message || 'Failed to save property. Please check input fields.');
    } finally {
      setIsSavingProperty(false);
    }
  };

  const requestDeleteProperty = (id, title) => {
    setDeleteConfig({
      title: `Delete property "${title}"?`,
      onConfirm: async () => {
        await fetch(`/api/properties/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Save Land Submit
  const handleSaveLand = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLandFormError('');
    setIsSavingLand(true);

    try {
      const isEdit = !!formLand.id;
      const url = isEdit ? `/api/land/${formLand.id}` : '/api/land';
      const method = isEdit ? 'PUT' : 'POST';

      const coverImg = (landImagesList.length > 0 && landImagesList[0].url)
        ? landImagesList[0].url
        : (formLand.image && formLand.image !== '/house/completed-house.jpg' && !formLand.image.includes('logo') ? formLand.image : '');

      const finalDesc = formLand.description || generateLandDescription(formLand);
      const finalPrice = formLand.price_amount
        ? `₹${formLand.price_amount} ${formLand.price_unit || 'Lakhs'}`
        : (formLand.total_price?.trim() || formLand.price?.trim() || 'Price on Request');

      const cleanPlot = formLand.plot_area ? String(formLand.plot_area).trim() : '1200';
      const cleanRoad = formLand.road_width ? String(formLand.road_width).trim() : '30';

      const payload = {
        ...formLand,
        title: formLand.title?.trim() || 'DTCP Approved Residential Plot',
        total_price: finalPrice,
        price: finalPrice,
        plot_area: cleanPlot,
        plot_area_unit: formLand.plot_area_unit || 'sq.ft',
        road_width: cleanRoad,
        road_width_unit: formLand.road_width_unit || 'ft',
        image: coverImg,
        description: finalDesc,
        full_description: finalDesc,
        short_description: finalDesc.split('\n\n')[0] || ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error saving land plot.');
      }

      const recordId = isEdit ? formLand.id : data.id;

      // Physically delete staged removed images from disk and database
      if (Array.isArray(stagedDeletedLandImages) && stagedDeletedLandImages.length > 0) {
        for (const imgToDelete of stagedDeletedLandImages) {
          try {
            await fetch('/api/land/delete-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                landId: recordId,
                imageUrl: imgToDelete.url,
                imageId: typeof imgToDelete.id === 'number' ? imgToDelete.id : undefined
              })
            });
          } catch (delErr) {
            console.error('Physical land image deletion warning:', delErr);
          }
        }
        setStagedDeletedLandImages([]);
      }

      // Sync and reorder remaining images in land_images table
      if (recordId && Array.isArray(landImagesList)) {
        try {
          const validUrls = landImagesList.map(item => item.url).filter(Boolean);
          await fetch(`/api/land/${recordId}/images/sync`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: validUrls })
          });
        } catch (syncErr) {
          console.error('Land image sync error:', syncErr);
        }
      }

      await fetchData();
      notifySiteDataUpdated();
      setModalType(null);
      setLandImagesList([]);
      setStatusNotice(isEdit ? 'Land plot updated successfully!' : 'New Land plot saved successfully to database!');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.error('Error saving land plot:', err);
      setLandFormError(err.message || 'Failed to save land plot. Please check input fields.');
    } finally {
      setIsSavingLand(false);
    }
  };

  const requestDeleteLand = (id, title) => {
    setDeleteConfig({
      title: `Delete land plot "${title}"?`,
      onConfirm: async () => {
        await fetch(`/api/land/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Save Project Submit
  const handleSaveProject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setProjectFormError('');
    setIsSavingProject(true);

    try {
      const isEdit = !!formProj.id;
      const url = isEdit ? `/api/projects/${formProj.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const coverImg = (projectImagesList.length > 0 && projectImagesList[0].url)
        ? projectImagesList[0].url
        : (formProj.cover_image && formProj.cover_image !== '/house/completed-house.jpg' && !formProj.cover_image.includes('logo') ? formProj.cover_image : '');

      const finalDesc = formProj.description || generateProjectDescription(formProj);
      const cleanBuilt = formProj.builtup_area ? String(formProj.builtup_area).trim() : '1500';
      const cleanPlot = formProj.plot_area ? String(formProj.plot_area).trim() : '1200';
      const cleanBed = formProj.bedrooms ? (String(formProj.bedrooms).includes('BHK') ? formProj.bedrooms : `${formProj.bedrooms} BHK`) : '3 BHK';

      const payload = {
        ...formProj,
        name: formProj.name?.trim() || formProj.title?.trim() || 'Individual Villa Construction',
        title: formProj.name?.trim() || formProj.title?.trim() || 'Individual Villa Construction',
        builtup_area: cleanBuilt,
        builtup_area_unit: formProj.builtup_area_unit || 'sq.ft',
        plot_area: cleanPlot,
        plot_area_unit: formProj.plot_area_unit || 'sq.ft',
        bedrooms: cleanBed,
        cover_image: coverImg,
        image: coverImg,
        description: finalDesc,
        overview: finalDesc
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error saving project.');
      }

      const recordId = isEdit ? formProj.id : data.id;

      // Physically delete staged removed images from disk and database
      if (Array.isArray(stagedDeletedProjectImages) && stagedDeletedProjectImages.length > 0) {
        for (const imgToDelete of stagedDeletedProjectImages) {
          try {
            await fetch('/api/projects/delete-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: recordId,
                imageUrl: imgToDelete.url,
                imageId: typeof imgToDelete.id === 'number' ? imgToDelete.id : undefined
              })
            });
          } catch (delErr) {
            console.error('Physical project image deletion warning:', delErr);
          }
        }
        setStagedDeletedProjectImages([]);
      }

      // Sync and reorder remaining images in project_images table
      if (recordId && Array.isArray(projectImagesList)) {
        try {
          const validUrls = projectImagesList.map(item => item.url).filter(Boolean);
          await fetch(`/api/projects/${recordId}/images/sync`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: validUrls })
          });
        } catch (syncErr) {
          console.error('Project image sync error:', syncErr);
        }
      }

      await fetchData();
      notifySiteDataUpdated();
      setModalType(null);
      setProjectImagesList([]);
      setStatusNotice(isEdit ? 'Construction project updated successfully!' : 'New Construction project saved successfully to database!');
      setTimeout(() => setStatusNotice(''), 4000);
    } catch (err) {
      console.error('Error saving project:', err);
      setProjectFormError(err.message || 'Failed to save project. Please check input fields.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const requestDeleteProject = (id, title) => {
    setDeleteConfig({
      title: `Delete project "${title}"?`,
      onConfirm: async () => {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Save Gallery Photo Submit
  const handleSaveGallery = async (e) => {
    e.preventDefault();
    if (!formGal.image) {
      setStatusNotice('Please select an image file first.');
      setTimeout(() => setStatusNotice(''), 3000);
      return;
    }
    const isEdit = !!formGal.id;
    const url = isEdit ? `/api/gallery/${formGal.id}` : '/api/gallery';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: formGal.image })
      });

      if (res.ok) {
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice(isEdit ? 'Gallery photo updated successfully!' : 'New Gallery photo added successfully!');
        setTimeout(() => setStatusNotice(''), 3000);
      } else {
        setStatusNotice('Unable to save gallery photo. Please try again.');
        setTimeout(() => setStatusNotice(''), 3000);
      }
    } catch (err) {
      console.error('Error saving gallery photo:', err);
      setStatusNotice('Network error while saving gallery photo.');
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  const requestDeleteGallery = (id) => {
    setDeleteConfig({
      title: 'Delete this gallery photo?',
      onConfirm: async () => {
        await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  // Toggle Property Published / Featured
  const togglePropertyStatus = async (id, field, currentVal) => {
    await fetch(`/api/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: currentVal ? 0 : 1 })
    });
    fetchData();
    notifySiteDataUpdated();
  };

  // Toggle Land Published / Featured
  const toggleLandStatus = async (id, field, currentVal) => {
    await fetch(`/api/land/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: currentVal ? 0 : 1 })
    });
    fetchData();
    notifySiteDataUpdated();
  };

  // Toggle Project Published / Featured
  const toggleProjectStatus = async (id, field, currentVal) => {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: currentVal ? 0 : 1 })
    });
    fetchData();
    notifySiteDataUpdated();
  };

  // Video Upload Handler (Supports both 'hero' and 'background')
  const handleVideoUploadSubmit = async (e, videoType = 'hero') => {
    e.preventDefault();
    const isBg = videoType === 'background';
    const file = isBg ? selectedBgVideoFile : selectedHeroVideoFile;
    const customName = isBg ? customBgVideoName : customHeroVideoName;
    if (!file) return;

    const formData = new FormData();
    formData.append('videoType', videoType);
    if (customName && customName.trim()) {
      formData.append('customName', customName.trim());
    }
    formData.append('video', file);

    const res = await fetch('/api/media/upload-video', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.status === 409) {
      if (isBg) {
        setBgDupError(true);
        setTimeout(() => { if (bgRenameInputRef.current) bgRenameInputRef.current.focus(); }, 50);
      } else {
        setHeroDupError(true);
        setTimeout(() => { if (heroRenameInputRef.current) heroRenameInputRef.current.focus(); }, 50);
      }
      return;
    }

    if (res.ok) {
      if (isBg) {
        setSelectedBgVideoFile(null);
        setCustomBgVideoName('');
        setBgDupError(false);
        if (bgFileInputRef.current) bgFileInputRef.current.value = '';
      } else {
        setSelectedHeroVideoFile(null);
        setCustomHeroVideoName('');
        setHeroDupError(false);
        if (heroFileInputRef.current) heroFileInputRef.current.value = '';
      }
      setStatusNotice(`${isBg ? 'Background' : 'Hero Construction'} video uploaded successfully!`);
      fetchData();
      notifySiteDataUpdated();
      notifyPrimaryVideoUpdated();
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  // Video Rename Handler
  const handleRenameVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoRename.id || !videoRename.newName.trim()) return;

    const res = await fetch(`/api/media/video/${videoRename.id}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newFilename: videoRename.newName.trim() })
    });

    if (res.ok) {
      setModalType(null);
      fetchData();
      notifySiteDataUpdated();
      notifyPrimaryVideoUpdated();
    }
  };

  // Instant Set Primary Video Handler (Updates state immediately & calls backend)
  const handleSetPrimaryVideo = async (videoId, videoType = 'hero') => {
    setVideos(prev => prev.map(v => {
      const vType = v.video_type || 'hero';
      if (vType === videoType) {
        return { ...v, is_primary: v.id === videoId ? 1 : 0 };
      }
      return v;
    }));

    const res = await fetch('/api/media/set-primary-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });
    if (res.ok) {
      fetchData();
      notifySiteDataUpdated();
      notifyPrimaryVideoUpdated();
    }
  };

  const requestDeleteVideo = (id, filename) => {
    setDeleteConfig({
      title: `Delete video file "${filename}"?`,
      onConfirm: async () => {
        await fetch(`/api/media/video/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        notifyPrimaryVideoUpdated();
        setModalType(null);
      }
    });
    setModalType('confirm_delete');
  };

  const openCreateTestimonial = () => {
    setFormTestimonial({ id: null, client_name: '', location: '', quote: '', rating: 5 });
    setModalType('testimonial_form');
  };

  const openEditTestimonial = (t) => {
    setFormTestimonial({ id: t.id, client_name: t.client_name, location: t.location, quote: t.quote, rating: t.rating || 5 });
    setModalType('testimonial_form');
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    try {
      const url = formTestimonial.id ? `/api/testimonials/${formTestimonial.id}` : '/api/testimonials';
      const method = formTestimonial.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formTestimonial)
      });
      if (res.ok) {
        setModalType(null);
        fetchData();
        notifySiteDataUpdated();
        setStatusNotice(formTestimonial.id ? 'Testimonial updated successfully!' : 'Testimonial added successfully!');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error saving testimonial:', err);
    }
  };

  const requestDeleteTestimonial = (id, name) => {
    setDeleteConfig({
      title: `Are you sure you want to delete the testimonial by "${name}"?`,
      onConfirm: async () => {
        await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice('Testimonial deleted successfully.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    });
    setModalType('confirm_delete');
  };

  const handleToggleFeedbackApproval = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !currentStatus })
      });
      if (res.ok) {
        fetchData();
        notifySiteDataUpdated();
        setStatusNotice(!currentStatus ? 'Feedback approved & published on website!' : 'Feedback hidden from website.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err) {
      console.error('Error toggling feedback status:', err);
    }
  };

  const requestDeleteFeedback = (id, name) => {
    setDeleteConfig({
      title: `Are you sure you want to permanently delete the feedback from "${name}"?`,
      onConfirm: async () => {
        await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
        fetchData();
        notifySiteDataUpdated();
        setModalType(null);
        setStatusNotice('Feedback review deleted successfully.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    });
    setModalType('confirm_delete');
  };

  const requestDeleteLead = (id, name) => {
    setDeleteConfig({
      title: `Are you sure you want to delete the inquiry from "${name}"?`,
      onConfirm: async () => {
        await fetch(`/api/leads/${id}`, { method: 'DELETE' }).catch(() => {});
        setLeads(prev => prev.filter(l => l.id !== id));
        fetchData();
        setModalType(null);
        setStatusNotice('Customer inquiry deleted.');
        setTimeout(() => setStatusNotice(''), 4000);
      }
    });
    setModalType('confirm_delete');
  };

  // Safe Arrays
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeLand = Array.isArray(land) ? land : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeServices = Array.isArray(services) ? services : [];
  const safeGallery = Array.isArray(gallery) ? gallery : [];
  const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeVideos = Array.isArray(videos) ? videos : [];
  const heroVideos = safeVideos.filter(v => (v.video_type || 'hero') === 'hero');
  const bgVideos = safeVideos.filter(v => v.video_type === 'background');

  // Filtered lists
  const filteredFeedbacks = safeFeedbacks.filter(f =>
    (f.client_name || '').toLowerCase().includes(feedSearch.toLowerCase()) ||
    (f.location || '').toLowerCase().includes(feedSearch.toLowerCase()) ||
    (f.service || '').toLowerCase().includes(feedSearch.toLowerCase()) ||
    (f.message || '').toLowerCase().includes(feedSearch.toLowerCase())
  );

  const filteredTestimonials = safeTestimonials.filter(t =>
    (t.client_name || '').toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.location || '').toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.quote || '').toLowerCase().includes(testSearch.toLowerCase())
  );


  const filteredProperties = safeProperties.filter(p =>
    (p.title || '').toLowerCase().includes(propSearch.toLowerCase()) ||
    (p.location || '').toLowerCase().includes(propSearch.toLowerCase()) ||
    (p.property_id || '').toLowerCase().includes(propSearch.toLowerCase())
  );

  const filteredLand = safeLand.filter(l =>
    (l.title || '').toLowerCase().includes(landSearch.toLowerCase()) ||
    (l.location || '').toLowerCase().includes(landSearch.toLowerCase()) ||
    (l.land_id || '').toLowerCase().includes(landSearch.toLowerCase())
  );

  const filteredProjects = safeProjects.filter(pr =>
    (pr.name || pr.title || '').toLowerCase().includes(projSearch.toLowerCase()) ||
    (pr.location || '').toLowerCase().includes(projSearch.toLowerCase()) ||
    (pr.project_id || '').toLowerCase().includes(projSearch.toLowerCase())
  );

  // Metrics for Dashboard Summary
  const availableHousesCount = safeProperties.filter(p => p.status === 'Available').length;
  const availableLandCount = safeLand.filter(l => l.status === 'Available').length;
  const soldCount = safeProperties.filter(p => p.status === 'Sold').length + safeLand.filter(l => l.status === 'Sold').length;
  const completedProjectsCount = safeProjects.filter(p => p.status === 'Completed').length;
  const ongoingProjectsCount = safeProjects.filter(p => p.status === 'Under Construction' || p.status === 'Ongoing').length;
  const startedProjectsCount = safeProjects.filter(p => p.status === 'Planning & Approvals' || p.status === 'Planned' || p.status === 'Started' || p.status === 'Approval').length;

  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-amber-500 selection:text-black">
        {/* Dynamic Animated Gold Dust Particle Canvas */}
        <LoginBackgroundCanvas />

        {/* Ambient Gold Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-600/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Gold Specular Glassmorphism Form Card */}
        <div className="gold-specular-card bg-[#121216]/90 border border-amber-500/30 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] relative z-10 animate-fadeIn">
          <div className="specular-glare" />

          {/* Logo & Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 overflow-hidden group hover:scale-105 transition-transform duration-300">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={`${settings?.company_name || 'Company'} Logo`} className="w-11 h-11 object-contain" />
              ) : (
                <Lock size={30} className="text-amber-400" />
              )}
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
              {settings?.company_name ? `${settings.company_name} Admin` : 'Admin Portal'}
            </h2>
            <p className="text-xs font-bold text-amber-400 tracking-widest uppercase">
              {settings?.company_subtitle || 'Management Portal'}
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl mb-5 text-center font-bold flex items-center justify-center gap-2">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 font-semibold shadow-inner transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400 transition-colors p-1"
                  title={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
            >
              <ShieldCheck size={17} className="text-black group-hover:scale-110 transition-transform" />
              <span>Sign In to Dashboard</span>
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
            Secured Business Admin Dashboard
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-amber-500 selection:text-black font-sans">
      {/* Header */}
      <header className="bg-[#09090b]/90 backdrop-blur-md text-white py-3.5 px-6 shadow-xl flex items-center justify-between border-b border-amber-500/20 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <img src={settings.logo_url || '/logo/sk-builders-logo.png'} alt={`${settings?.company_name || 'Admin'} Logo`} className="w-9 h-9 object-contain rounded-md" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-amber-400">{settings?.company_name ? `${settings.company_name} Admin` : 'Admin Portal'}</h1>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">{settings?.company_subtitle || 'Management Portal'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTabChange('settings')}
            className={`font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 border-zinc-700/70'
            }`}
          >
            <Settings size={14} /> Admin Settings
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-red-500/30 cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {statusNotice && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs p-4 rounded-2xl shadow-lg flex items-center gap-2 animate-fadeIn backdrop-blur-md">
            <CheckCircle size={18} className="text-amber-400 shrink-0" /> {statusNotice}
          </div>
        )}

        {/* Tab Navigation (Single Line Full Width) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 w-full gap-1.5 pb-2 border-b border-zinc-800 overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Layers size={14} /> },
            { id: 'properties', label: 'Properties', icon: <Building size={14} /> },
            { id: 'land', label: 'Land / Plots', icon: <MapPin size={14} /> },
            { id: 'projects', label: 'Projects', icon: <Home size={14} /> },
            { id: 'gallery', label: 'Gallery', icon: <ImageIcon size={14} /> },
            { id: 'feedbacks', label: 'Feedbacks', icon: <Star size={14} /> },
            { id: 'testimonials', label: 'Testimonials', icon: <Quote size={14} /> },
            { id: 'leads', label: 'Leads', icon: <Users size={14} /> },
            { id: 'videos', label: 'Video & Frames', icon: <Video size={14} /> }
          ].map((tab) => (

            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={tab.label}
              className={`w-full px-2 py-2.5 rounded-xl text-[10.5px] xl:text-xs font-black uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all text-center whitespace-nowrap overflow-hidden ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 font-extrabold'
                  : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 0: DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#18181b]/90 p-5 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between backdrop-blur-md">
                <div>
                  <div className="text-2xl font-black text-white">{safeProperties.length}</div>
                  <div className="text-xs font-extrabold text-zinc-400 uppercase mt-0.5">Total Properties</div>
                  <div className="text-[11px] text-amber-400 font-bold mt-1">{availableHousesCount} Available Houses</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Building size={24} />
                </div>
              </div>

              <div className="bg-[#18181b]/90 p-5 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between backdrop-blur-md">
                <div>
                  <div className="text-2xl font-black text-white">{safeLand.length}</div>
                  <div className="text-xs font-extrabold text-zinc-400 uppercase mt-0.5">Total Land Plots</div>
                  <div className="text-[11px] text-emerald-400 font-bold mt-1">{availableLandCount} Available Plots</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <MapPin size={24} />
                </div>
              </div>

              <div className="bg-[#18181b]/90 p-5 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between backdrop-blur-md">
                <div>
                  <div className="text-2xl font-black text-white">{safeProjects.length}</div>
                  <div className="text-xs font-extrabold text-zinc-400 uppercase mt-0.5">Total Projects</div>
                  <div className="text-[10.5px] text-amber-300 font-bold mt-1 leading-snug">
                    <div>{completedProjectsCount} Completed • {ongoingProjectsCount} Ongoing</div>
                    <div>{startedProjectsCount} Started</div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Home size={24} />
                </div>
              </div>

              <div className="bg-[#18181b]/90 p-5 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between backdrop-blur-md">
                <div>
                  <div className="text-2xl font-black text-white">{safeLeads.length}</div>
                  <div className="text-xs font-extrabold text-zinc-400 uppercase mt-0.5">Customer Leads</div>
                  <div className="text-[11px] text-zinc-400 font-bold mt-1">{soldCount} Properties Sold</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Users size={24} />
                </div>
              </div>

              <div className="bg-[#18181b]/90 p-5 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between backdrop-blur-md">
                <div>
                  <div className="text-2xl font-black text-white">{safeFeedbacks.length}</div>
                  <div className="text-xs font-extrabold text-zinc-400 uppercase mt-0.5">Client Feedbacks</div>
                  <div className="text-[11px] text-amber-400 font-bold mt-1">
                    ★ {safeFeedbacks.length > 0 ? (safeFeedbacks.reduce((a, b) => a + (b.rating || 5), 0) / safeFeedbacks.length).toFixed(1) : '5.0'} / 5.0 Rating
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Star size={24} />
                </div>
              </div>
            </div>


            {/* Quick Actions Bar */}
            <div className="bg-[#18181b] border border-amber-500/30 text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase text-amber-400">Quick Management Actions</h3>
                <p className="text-xs text-zinc-300 mt-0.5">Add or manage real business information for your business showcase.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openCreateProperty}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md border border-amber-300/40 cursor-pointer"
                >
                  <Plus size={15} /> Add House Property
                </button>

                <button
                  onClick={openCreateLand}
                  className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus size={15} /> Add Land Plot
                </button>

                <button
                  onClick={openCreateProject}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus size={15} /> Add Construction Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PROPERTIES (HOUSES / BUILDINGS) */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Houses & Buildings ({filteredProperties.length})</h2>
                <p className="text-xs text-zinc-400">Properties appear on the public site under "Houses for Sale".</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search property title or location..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredProperties.length > 0 && (
                  <button
                    onClick={openCreateProperty}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Add New Property
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredProperties.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Building size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No House Properties Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    No house property records found. Click below to add your first house property to display on the website.
                  </p>
                </div>
                <button
                  onClick={openCreateProperty}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Property
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openEditProperty(p)}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 group"
                  >
                    {/* Left: Image & Detailed Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                        {p.image && p.image !== '/house/completed-house.jpg' && !p.image.includes('logo') ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-amber-400">
                            <Home size={28} className="text-amber-400" />
                          </div>
                        )}
                        {p.bedrooms && p.image && p.image !== '/house/completed-house.jpg' && !p.image.includes('logo') ? (
                          <span className="absolute bottom-1 left-1 bg-black/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                            {p.bedrooms.toString().includes('BHK') ? p.bedrooms : `${p.bedrooms} BHK`}
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/50">
                            {p.type || 'Individual House'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {p.status || 'Available'}
                          </span>
                          {p.bedrooms && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {p.bedrooms.toString().includes('BHK') ? p.bedrooms : `${p.bedrooms} BHK`}
                            </span>
                          )}
                          {p.facing && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {p.facing} Facing
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {p.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin size={13} className="text-amber-400 shrink-0" /> {p.location || p.area}
                          </span>
                          {p.builtup_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Builtup: {p.builtup_area} {p.builtup_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {p.plot_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Plot: {p.plot_area} {p.plot_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {p.road_width && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>{p.road_width} {p.road_width_unit || 'ft'} Road</span>
                            </>
                          )}
                          {p.updated_at && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(p.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Price Detail Container (Strict 50% Horizontal Center) */}
                    <div className="flex flex-col items-center justify-center justify-self-start md:justify-self-center px-5 py-2.5 bg-[#09090b]/90 border border-zinc-800/90 rounded-xl text-center min-w-[150px] shadow-inner">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">PRICE</span>
                      <span className="text-base font-black text-amber-400 leading-tight">{p.price || 'Price on Request'}</span>
                      {p.negotiable === 'Yes' && (
                        <span className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-tight mt-0.5">Negotiable</span>
                      )}
                    </div>

                    {/* Right: Toggle Controls */}
                    <div className="flex items-center justify-between md:justify-end md:justify-self-end gap-3 shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center" title="Published: Visible on public website">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Published</span>
                        <button
                          onClick={() => togglePropertyStatus(p.id, 'published', p.published)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${p.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${p.published ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center" title="Featured: Highlighted on homepage showcases">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Featured</span>
                        <button
                          onClick={() => togglePropertyStatus(p.id, 'featured', p.featured)}
                          className={`p-1.5 rounded-lg transition-colors ${p.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <Star size={16} fill={p.featured ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <button
                        onClick={() => requestDeleteProperty(p.id, p.title)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1 cursor-pointer"
                        title="Delete Property"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LAND (RESIDENTIAL PLOTS / LAND) */}
        {activeTab === 'land' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Land & Residential Plots ({filteredLand.length})</h2>
                <p className="text-xs text-zinc-400">Land entries appear on public site under "Lands for Sale".</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search land title or location..."
                  value={landSearch}
                  onChange={(e) => setLandSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredLand.length > 0 && (
                  <button
                    onClick={openCreateLand}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Add New Land Plot
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredLand.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <MapPin size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Land Plots Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    No land plot records exist in the database. Click below to add your first land plot.
                  </p>
                </div>
                <button
                  onClick={openCreateLand}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Land Plot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLand.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => openEditLand(l)}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 group"
                  >
                    {/* Left: Image & Detailed Land Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                        {l.image && l.image !== '/house/completed-house.jpg' && !l.image.includes('logo') ? (
                          <img
                            src={l.image}
                            alt={l.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-emerald-400">
                            <MapPin size={28} className="text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/50">
                            {l.land_type || 'Residential Plot'}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                            {l.approval_status || 'DTCP Approved'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${l.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {l.status || 'Available'}
                          </span>
                          {l.facing && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {l.facing} Facing
                            </span>
                          )}
                          {l.corner_plot === 'Yes' && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              Corner Plot
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {l.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin size={13} className="text-amber-400 shrink-0" /> {l.location || l.area}
                          </span>
                          {l.plot_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Area: {l.plot_area} {l.plot_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {(l.frontage || (l.length && l.width)) && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Dim: {l.frontage || `${l.length}x${l.width} ft`}</span>
                            </>
                          )}
                          {l.road_width && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>{l.road_width} {l.road_width_unit || 'ft'} Road</span>
                            </>
                          )}
                          {l.updated_at && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(l.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Total Price Container (Strict 50% Horizontal Center) */}
                    <div className="flex flex-col items-center justify-center justify-self-start md:justify-self-center px-5 py-2.5 bg-[#09090b]/90 border border-zinc-800/90 rounded-xl text-center min-w-[150px] shadow-inner">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">TOTAL PRICE</span>
                      <span className="text-base font-black text-amber-400 leading-tight">{l.total_price || l.price || 'Price on Request'}</span>
                      {l.negotiable === 'Yes' && (
                        <span className="text-[9px] font-bold text-emerald-400/90 uppercase tracking-tight mt-0.5">Negotiable</span>
                      )}
                    </div>

                    {/* Right: Toggle Controls */}
                    <div className="flex items-center justify-between md:justify-end md:justify-self-end gap-3 shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center" title="Published: Visible on public website">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Published</span>
                        <button
                          onClick={() => toggleLandStatus(l.id, 'published', l.published)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${l.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${l.published ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center" title="Featured: Highlighted on homepage showcases">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Featured</span>
                        <button
                          onClick={() => toggleLandStatus(l.id, 'featured', l.featured)}
                          className={`p-1.5 rounded-lg transition-colors ${l.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <Star size={16} fill={l.featured ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <button
                        onClick={() => requestDeleteLand(l.id, l.title)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1 cursor-pointer"
                        title="Delete Land"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROJECTS (CONSTRUCTION PROJECTS) */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Construction Projects ({filteredProjects.length})</h2>
                <p className="text-xs text-zinc-400">Projects appear on the public site under "Projects".</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search project name or location..."
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredProjects.length > 0 && (
                  <button
                    onClick={openCreateProject}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <Plus size={15} /> Add New Project
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredProjects.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Home size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Construction Projects Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    No construction projects exist in the database. Add your first construction project to showcase your work.
                  </p>
                </div>
                <button
                  onClick={openCreateProject}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => openEditProject(pr)}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-center gap-4 group"
                  >
                    {/* Left: Cover Image & Project Details */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                        {(pr.cover_image || pr.image) && (pr.cover_image || pr.image) !== '/house/completed-house.jpg' && !(pr.cover_image || pr.image).includes('logo') ? (
                          <img
                            src={pr.cover_image || pr.image}
                            alt={pr.name || pr.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#18181b] flex items-center justify-center text-amber-400">
                            <Home size={28} className="text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded-md border border-zinc-700/50">
                            {pr.project_type || 'Individual House'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${pr.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                            {pr.status || 'Completed'}
                          </span>
                          {pr.floors && (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {pr.floors} Floors
                            </span>
                          )}
                          {pr.bedrooms && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                              {pr.bedrooms.toString().includes('BHK') ? pr.bedrooms : `${pr.bedrooms} BHK`}
                            </span>
                          )}
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {pr.name || pr.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin size={13} className="text-amber-400 shrink-0" /> {pr.location || pr.area}
                          </span>
                          {pr.builtup_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Builtup: {pr.builtup_area} {pr.builtup_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {pr.plot_area && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Plot: {pr.plot_area} {pr.plot_area_unit || 'sq.ft'}</span>
                            </>
                          )}
                          {(pr.completion_date || pr.actual_completion_date) && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>Year: {pr.completion_date || pr.actual_completion_date}</span>
                            </>
                          )}
                          {pr.updated_at && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(pr.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Project Status / Scope Container (Strict 50% Horizontal Center) */}
                    <div className="flex flex-col items-center justify-center justify-self-start md:justify-self-center px-5 py-2.5 bg-[#09090b]/80 border border-zinc-800/90 rounded-xl text-center min-w-[150px] shadow-inner">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">PROJECT STATUS</span>
                      <span className={`text-sm font-black uppercase leading-tight ${pr.status === 'Completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {pr.status || 'Completed'}
                      </span>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center justify-between md:justify-end md:justify-self-end gap-3 shrink-0 border-t border-zinc-800 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-center" title="Published: Visible on public website">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Published</span>
                        <button
                          onClick={() => toggleProjectStatus(pr.id, 'published', pr.published)}
                          className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${pr.published ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${pr.published ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center" title="Featured: Highlighted on homepage showcases">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Featured</span>
                        <button
                          onClick={() => toggleProjectStatus(pr.id, 'featured', pr.featured)}
                          className={`p-1.5 rounded-lg transition-colors ${pr.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          <Star size={16} fill={pr.featured ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <button
                        onClick={() => requestDeleteProject(pr.id, pr.name || pr.title)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1 cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Gallery Photos ({safeGallery.length})</h2>
                <p className="text-xs text-zinc-400">Showcase photos of completed individual house construction.</p>
              </div>

              {safeGallery.length > 0 && (
                <button
                  onClick={() => {
                    setFormGal({ id: null, image: '' });
                    setModalType('gallery_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <Plus size={15} /> Upload Gallery Image
                </button>
              )}
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : safeGallery.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Gallery Photos Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Your photo gallery is currently empty. Upload photos of completed house projects and site work.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormGal({ id: null, image: '' });
                    setModalType('gallery_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Plus size={16} /> Upload First Gallery Photo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {safeGallery.map((g, idx) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setFormGal({ id: g.id, image: g.image });
                      setModalType('gallery_form');
                    }}
                    className="bg-[#18181b] hover:bg-[#202025] rounded-2xl p-3 sm:p-4 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-md"
                  >
                    {/* Left: Thumbnail & Image Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-24 sm:w-36 h-16 sm:h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-zinc-800 group-hover:border-amber-500/30 transition-colors">
                        <img src={g.image} alt="Gallery photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors truncate">
                          {g.image ? g.image.split('/').pop() : `Gallery Photo #${g.id}`}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">
                          {g.image}
                        </div>
                      </div>
                    </div>

                    {/* Right: Delete Action Button */}
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteGallery(g.id);
                        }}
                        className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-all"
                        title="Delete Photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TESTIMONIALS */}
        {activeTab === 'testimonials' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400">Client Testimonials ({filteredTestimonials.length})</h2>
                <p className="text-xs text-zinc-400">Manage client reviews displayed under the "What Our Clients Say" section on the home page.</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-56 text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={openCreateTestimonial}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Plus size={15} /> Add Testimonial
                </button>
              </div>
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredTestimonials.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Quote size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Testimonials Added</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Add client reviews and testimonials to showcase client trust on the website.
                  </p>
                </div>
                <button
                  onClick={openCreateTestimonial}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} /> Add First Testimonial
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#18181b] hover:bg-[#202025] rounded-2xl p-5 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4 shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{t.client_name}</span>
                          {t.location && (
                            <span className="text-[11px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                              {t.location}
                            </span>
                          )}
                        </div>
                        <span className="text-amber-400 text-xs tracking-widest font-black">
                          {'★'.repeat(Math.min(5, Math.max(1, t.rating || 5)))}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">
                        "{t.quote}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {t.created_at ? `Added: ${formatLastUpdated(t.created_at)}` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditTestimonial(t)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => requestDeleteTestimonial(t.id, t.client_name)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete Testimonial"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: FEEDBACKS (CLIENT FEEDBACKS PORTAL) */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400 flex items-center gap-2">
                  <Star size={18} className="text-amber-400" /> Client Feedbacks & Reviews ({filteredFeedbacks.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Reviews and feedback submitted by clients via the public feedback page (/feedback).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search feedbacks..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-56 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : filteredFeedbacks.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Star size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Client Feedbacks Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    When clients submit reviews on the Feedback portal, they will appear here with ratings and options to publish/hide.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFeedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="bg-gradient-to-br from-[#18181b] to-[#121216] rounded-xl p-3.5 sm:p-4 border border-zinc-800 hover:border-amber-500/40 transition-all space-y-2.5 shadow-md"
                  >
                    <div className="space-y-2">
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/70 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-xs sm:text-sm text-white">{f.client_name}</span>
                            {f.location && (
                              <span className="text-[9.5px] font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center gap-0.5">
                                <MapPin size={9} className="text-amber-400" />
                                {f.location}
                              </span>
                            )}
                          </div>
                          {f.service && (
                            <div className="text-[9.5px] font-extrabold text-amber-400 uppercase tracking-wider mt-0.5">
                              {f.service}
                            </div>
                          )}
                        </div>

                        {/* Star Rating Badge */}
                        <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30 shrink-0 font-black text-xs">
                          <span>{'★'.repeat(Math.min(5, Math.max(1, f.rating || 5)))}</span>
                          <span className="text-[10.5px] text-zinc-300 ml-0.5">({f.rating || 5}/5)</span>
                        </div>
                      </div>

                      {/* Contact Badges if provided */}
                      {(f.phone || f.email) && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                          {f.phone && (
                            <a
                              href={`tel:+91${f.phone.replace(/[^0-9]/g, '')}`}
                              className="text-[10.5px] font-bold text-zinc-300 hover:text-amber-300 bg-[#09090b] px-2 py-0.5 rounded-md border border-zinc-800 flex items-center gap-1"
                            >
                              <Phone size={10} className="text-amber-400" /> +91 {f.phone}
                            </a>
                          )}
                          {f.phone && (
                            <a
                              href={`https://wa.me/91${f.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(f.client_name)},%20thank%20you%20for%20your%20feedback%20to%20SK%20Builders.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1"
                            >
                              WhatsApp
                            </a>
                          )}
                          {f.email && (
                            <span className="text-[10.5px] text-zinc-400 bg-[#09090b] px-2 py-0.5 rounded-md border border-zinc-800">
                              {f.email}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Review Message Text */}
                      <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-zinc-800/80 text-xs text-zinc-200 leading-normal font-medium">
                        {f.message}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/70">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeedbackApproval(f.id, f.approved)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            f.approved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white'
                          }`}
                        >
                          <CheckCircle size={12} className={f.approved ? 'text-emerald-400' : 'text-zinc-500'} />
                          <span className="text-[11px]">{f.approved ? 'Published on Site' : 'Hidden'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[9.5px] text-zinc-500 font-mono">
                          {f.created_at ? formatLastUpdated(f.created_at) : 'Recently'}
                        </span>
                        <button
                          type="button"
                          onClick={() => requestDeleteFeedback(f.id, f.client_name)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete Feedback"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LEADS & QUICK INQUIRIES (DETAILED VIEW) */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-base font-extrabold uppercase text-amber-400 flex items-center gap-2">
                  <Users size={18} className="text-amber-400" /> Customer Inquiries & Leads ({safeLeads.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Direct quick inquiries and contact requests sent by potential clients from the website.
                </p>
              </div>

              <div className="text-xs font-bold bg-amber-500/10 text-amber-400 px-3.5 py-1.5 rounded-full border border-amber-500/30">
                {safeLeads.length} Total Leads
              </div>
            </div>

            {isInitialLoading ? (
              <AdminLoadingSkeleton />
            ) : safeLeads.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Customer Inquiries Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Inquiries submitted through the "Send Quick Inquiry" contact form will appear here with complete details, service tags, and instant Call / WhatsApp actions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {safeLeads.map((l) => {
                  const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
                  const serviceColor =
                    l.service === 'House Construction'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : l.service === 'House for Sale' || l.service === 'Individual House Purchase'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      : l.service === 'Land for Sale' || l.service === 'Residential Land Purchase'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-purple-500/15 text-purple-300 border-purple-500/40';

                  return (
                    <div
                      key={l.id}
                      className="bg-gradient-to-br from-[#18181b] to-[#121216] p-3.5 sm:p-4 rounded-xl border border-zinc-800 hover:border-amber-500/40 shadow-lg transition-all space-y-2.5"
                    >
                      {/* Top Header: Client Info & Time */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
                            {(l.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-white truncate">{l.name}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${serviceColor}`}>
                                {l.service || 'Quick Inquiry'}
                              </span>
                              {l.property_id && (
                                <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                  Ref: #{l.property_id}
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-zinc-400 font-medium">
                              {l.email ? l.email : 'Direct Website Lead'}
                            </div>
                          </div>
                        </div>

                        {/* Received Timestamp */}
                        {l.created_at && (
                          <div className="text-[10.5px] font-mono text-zinc-400 bg-[#09090b] px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0 self-start sm:self-auto">
                            Received: <strong className="text-zinc-200">{formatLastUpdated(l.created_at)}</strong>
                          </div>
                        )}
                      </div>

                      {/* Middle: Inquiry Requirement / Message Details */}
                      <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-zinc-800/80 flex items-start gap-2 text-xs">
                        <FileText size={13} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-zinc-200 font-medium leading-relaxed min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 mr-1.5">Requirement:</span>
                          {l.message && l.message.trim() ? (
                            <span>{l.message}</span>
                          ) : (
                            <span className="text-zinc-500 italic">No specific message specified (General callback requested).</span>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Quick Contact Actions & Delete - Left-aligned with reduced width */}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {/* Direct Phone Call Button */}
                        {cleanPhone ? (
                          <a
                            href={`tel:+91${cleanPhone}`}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                          >
                            <Phone size={12} />
                            <span>Call (+91 {cleanPhone})</span>
                          </a>
                        ) : null}

                        {/* WhatsApp Chat Button */}
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(l.name)},%20we%20received%20your%20inquiry%20regarding%20${encodeURIComponent(l.service || 'our services')}%20at%20SK%20Builders.%20How%20can%20we%20assist%20you?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                          >
                            <Sparkles size={12} />
                            <span>Chat on WhatsApp</span>
                          </a>
                        ) : null}

                        {/* Delete Lead Button */}
                        <button
                          type="button"
                          onClick={() => requestDeleteLead(l.id, l.name)}
                          className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-red-400 bg-zinc-900/90 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold shrink-0 active:scale-95"
                          title="Delete Lead"
                        >
                          <Trash2 size={12} className="text-red-400/80" />
                          <span className="text-[11px]">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}


        {/* TAB 6: SETTINGS CRUD */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Section A: Admin Credentials (Username & Password) CRUD */}
            <div className="bg-[#18181b] rounded-3xl border border-zinc-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={22} className="text-amber-400" />
                  <h3 className="text-base font-extrabold uppercase tracking-wide">Admin Account & Login Security</h3>
                </div>
                <span className="text-[11px] font-bold bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full uppercase border border-amber-500/30">Credentials CRUD</span>
              </div>

              {credStatusMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  <span>{credStatusMsg}</span>
                </div>
              )}

              {credErrorMsg && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <span>{credErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">New Admin Username</label>
                    <input
                      type="text"
                      value={adminUserForm.newUsername}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, newUsername: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Current Password (To Confirm Change)</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={adminUserForm.currentPassword}
                        onChange={(e) => setAdminUserForm({ ...adminUserForm, currentPassword: e.target.value })}
                        placeholder="Current password"
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={adminUserForm.newPassword}
                        onChange={(e) => setAdminUserForm({ ...adminUserForm, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Confirm New Password</label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={adminUserForm.confirmPassword}
                      onChange={(e) => setAdminUserForm({ ...adminUserForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-2 transition-all"
                  >
                    <Save size={16} /> Update Admin Credentials
                  </button>
                </div>
              </form>
            </div>

            {/* Section B: Company & Website Settings */}
            <div className="bg-[#18181b] rounded-3xl border border-zinc-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-white">
                  <Settings size={22} className="text-amber-400" />
                  <h3 className="text-base font-extrabold uppercase tracking-wide">Company & Website Information</h3>
                </div>
                <span className="text-[11px] font-bold bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full uppercase border border-amber-500/30">Site Settings</span>
              </div>

              {settingStatusMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{settingStatusMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="hidden"
                />

                {/* Top Header Row: Circled Logo on Left + Company Name & Subtitle on Right */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-[#09090b] p-4 rounded-2xl border border-zinc-800">
                  {/* Circled Logo Box (Top-Left) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative group">
                      <div
                        onClick={() => logoInputRef.current && logoInputRef.current.click()}
                        className="w-20 h-20 rounded-full bg-[#18181b] border-2 border-amber-500/40 hover:border-amber-400 flex items-center justify-center p-2 cursor-pointer shadow-md transition-all group-hover:scale-105 overflow-hidden"
                        title="Click circled logo to upload new image"
                      >
                        <img
                          src={settings.logo_url || '/logo/sk-builders-logo.png'}
                          alt="Company Logo"
                          className="w-full h-full object-contain rounded-full"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                          <Upload size={18} className="text-amber-400" />
                        </div>
                      </div>

                      {/* Remove / Reset X Badge */}
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-transform hover:scale-110"
                        title="Reset to default logo"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase text-amber-400">Company Logo</div>
                      <div className="text-[10px] text-zinc-400 font-bold mt-0.5">
                        <code className="bg-[#18181b] px-2 py-0.5 rounded border border-zinc-800 text-amber-300">{settings.logo_url || '/logo/sk-builders-logo.png'}</code>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold mt-1">
                        Click circle to upload or (X) to reset
                      </div>
                    </div>
                  </div>

                  {/* Company Name & Subtitle filling top right space */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={settingsForm.company_name ?? settings.company_name ?? 'SK BUILDERS'}
                        onChange={(e) => {
                          setIsSettingsFormDirty(true);
                          setSettingsForm({ ...settingsForm, company_name: e.target.value });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Company Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={settingsForm.company_subtitle ?? settings.company_subtitle ?? '& PROPERTY CONSULTANT'}
                        onChange={(e) => {
                          setIsSettingsFormDirty(true);
                          setSettingsForm({ ...settingsForm, company_subtitle: e.target.value });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={settingsForm.phone ?? settings.phone ?? '9876543210'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, phone: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp_number ?? settings.whatsapp_number ?? '9876543210'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={settingsForm.email ?? settings.email ?? 'info@skbuilders.com'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, email: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Primary Location</label>
                    <input
                      type="text"
                      value={settingsForm.location ?? settings.location ?? 'Poonamallee, Chennai'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, location: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Service Areas</label>
                    <input
                      type="text"
                      value={settingsForm.service_areas ?? settings.service_areas ?? 'Poonamallee, Mangadu, Kundrathur'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, service_areas: e.target.value });
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Company & Website Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold uppercase text-zinc-400 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={settingsForm.meta_description ?? settings.meta_description ?? 'Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance.'}
                      onChange={(e) => {
                        setIsSettingsFormDirty(true);
                        setSettingsForm({ ...settingsForm, meta_description: e.target.value });
                      }}
                      placeholder="Builder & Property Consultant in Poonamallee, Mangadu & Kundrathur. Houses for sale, residential land, contract construction, and property guidance."
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-2 transition-all"
                  >
                    <Save size={16} /> Save Website Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: VIDEOS (HERO & BACKGROUND SECTION SWITCHER) */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Clickable Section Switcher Buttons */}
            <div className="flex items-center justify-start gap-2">
              <button
                type="button"
                onClick={() => setVideoSectionTab('hero')}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                  videoSectionTab === 'hero'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800'
                }`}
              >
                <Video size={14} />
                <span>Hero Construction Video</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  videoSectionTab === 'hero' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-amber-400'
                }`}>
                  {heroVideos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoSectionTab('background')}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                  videoSectionTab === 'background'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800'
                }`}
              >
                <Layers size={14} />
                <span>Site Background Video</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  videoSectionTab === 'background' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-amber-400'
                }`}>
                  {bgVideos.length}
                </span>
              </button>
            </div>

            {/* SECTION 1: HERO CONSTRUCTION VIDEO */}
            {videoSectionTab === 'hero' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Upload Form Container */}
                <form onSubmit={(e) => handleVideoUploadSubmit(e, 'hero')} className="bg-[#18181b] p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Upload size={18} className="text-amber-400" /> Upload Construction Video
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Upload high-resolution video for Hero section timeline & automated 3D frame extraction.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                      Hero Section
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Select Hero Video File</label>
                      <input
                        ref={heroFileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          setSelectedHeroVideoFile(e.target.files[0]);
                          setHeroDupError(false);
                        }}
                        className="bg-[#09090b] border border-zinc-800 text-white rounded-xl px-4 py-2 text-xs w-full focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">
                        Rename File {heroDupError && <span className="text-amber-400 font-bold text-xs ml-2">⚠️ File exists! Rename here</span>}
                      </label>
                      <input
                        ref={heroRenameInputRef}
                        type="text"
                        placeholder="House_construction.mp4"
                        value={customHeroVideoName}
                        onChange={(e) => {
                          setCustomHeroVideoName(e.target.value);
                          setHeroDupError(false);
                        }}
                        className={`rounded-xl px-4 py-2.5 text-xs w-full transition-all text-white ${
                          heroDupError
                            ? 'bg-amber-500/20 border-2 border-amber-500 font-bold text-amber-300'
                            : 'bg-[#09090b] border border-zinc-800'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Upload size={14} /> Submit
                  </button>
                </form>

                {/* Preview / List Container */}
                <div className="bg-[#18181b] rounded-3xl border border-zinc-800 overflow-hidden p-6 sm:p-7 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Video size={16} className="text-amber-400" /> Hero Construction Videos
                      </h3>
                      <p className="text-xs text-zinc-400">Active video used for Hero 3D interactive frame animation.</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                      {heroVideos.length} Videos
                    </span>
                  </div>

                  <div className="space-y-3">
                    {isInitialLoading ? (
                      <AdminLoadingSkeleton />
                    ) : heroVideos.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-500 font-medium">
                        No construction videos found. Upload a video above.
                      </div>
                    ) : (
                      heroVideos.map((vid) => (
                        <div
                          key={vid.id}
                          onClick={() => {
                            setVideoRename({ id: vid.id, currentName: vid.filename, newName: vid.filename });
                            setModalType('rename_video');
                          }}
                          className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-all ${
                            vid.is_primary ? 'bg-amber-500/10 border-amber-500/60 shadow-md' : 'bg-[#09090b] border-zinc-800 hover:border-amber-500/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-extrabold text-xs text-white flex items-center gap-2">
                              <Video size={16} className="text-amber-400 shrink-0" />
                              <span>{vid.filename}</span>
                              {vid.is_primary ? (
                                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Star size={10} fill="currentColor" /> PRIMARY HERO
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 flex flex-wrap items-center gap-3">
                              <span>Path: <strong className="text-zinc-200">{vid.filepath || `uploads/videos/${vid.filename}`}</strong></span>
                              <span>•</span>
                              <span>Last Updated: <strong className="text-zinc-200">{formatLastUpdated(vid.created_at)}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {!vid.is_primary && (
                              <button
                                onClick={() => handleSetPrimaryVideo(vid.id, 'hero')}
                                className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black font-extrabold px-3 py-1.5 rounded-xl text-[11px] uppercase transition-all flex items-center gap-1 border border-amber-500/30"
                                title="Set as Primary Hero Video"
                              >
                                <Star size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => requestDeleteVideo(vid.id, vid.filename)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete Video"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: SITE BACKGROUND VIDEO */}
            {videoSectionTab === 'background' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Upload Form Container */}
                <form onSubmit={(e) => handleVideoUploadSubmit(e, 'background')} className="bg-[#18181b] p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Upload size={18} className="text-amber-400" /> Upload Background Video
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Upload an ambient background video.
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                      Site Background
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Select Background Video File</label>
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          setSelectedBgVideoFile(e.target.files[0]);
                          setBgDupError(false);
                        }}
                        className="bg-[#09090b] border border-zinc-800 text-white rounded-xl px-4 py-2 text-xs w-full focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">
                        Rename File {bgDupError && <span className="text-amber-400 font-bold text-xs ml-2">⚠️ File exists! Rename here</span>}
                      </label>
                      <input
                        ref={bgRenameInputRef}
                        type="text"
                        placeholder="Background.mp4"
                        value={customBgVideoName}
                        onChange={(e) => {
                          setCustomBgVideoName(e.target.value);
                          setBgDupError(false);
                        }}
                        className={`rounded-xl px-4 py-2.5 text-xs w-full transition-all text-white ${
                          bgDupError
                            ? 'bg-amber-500/20 border-2 border-amber-500 font-bold text-amber-300'
                            : 'bg-[#09090b] border border-zinc-800'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Upload size={14} /> Submit
                  </button>
                </form>

                {/* Preview / List Container */}
                <div className="bg-[#18181b] rounded-3xl border border-zinc-800 overflow-hidden p-6 sm:p-7 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase text-amber-400 flex items-center gap-2">
                        <Video size={16} className="text-amber-400" /> Site Background Videos
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Ambient videos for website background.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                      {bgVideos.length} Videos
                    </span>
                  </div>

                  <div className="space-y-3">
                    {isInitialLoading ? (
                      <AdminLoadingSkeleton />
                    ) : bgVideos.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-500 font-medium">
                        No background videos found. Upload a video above or place one in <code className="text-amber-400">app/public/videos</code>.
                      </div>
                    ) : (
                      bgVideos.map((vid) => (
                        <div
                          key={vid.id}
                          onClick={() => {
                            setVideoRename({ id: vid.id, currentName: vid.filename, newName: vid.filename });
                            setModalType('rename_video');
                          }}
                          className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 cursor-pointer transition-all ${
                            vid.is_primary ? 'bg-amber-500/10 border-amber-500/60 shadow-md' : 'bg-[#09090b] border-zinc-800 hover:border-amber-500/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="font-extrabold text-xs text-white flex items-center gap-2">
                              <Video size={16} className="text-amber-400 shrink-0" />
                              <span>{vid.filename}</span>
                              {vid.is_primary ? (
                                <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Star size={10} fill="currentColor" /> PRIMARY BACKGROUND
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 flex flex-wrap items-center gap-3">
                              <span>Path: <strong className="text-zinc-200">{vid.filepath || `app/public/videos/${vid.filename}`}</strong></span>
                              <span>•</span>
                              <span>Last Updated: <strong className="text-zinc-200">{formatLastUpdated(vid.created_at)}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {!vid.is_primary && (
                              <button
                                onClick={() => handleSetPrimaryVideo(vid.id, 'background')}
                                className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black font-extrabold px-3 py-1.5 rounded-xl text-[11px] uppercase transition-all flex items-center gap-1 border border-amber-500/30"
                                title="Set as Primary Background Video"
                              >
                                <Star size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => requestDeleteVideo(vid.id, vid.filename)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              title="Delete Video"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MULTI-STEP PROPERTY / LAND / PROJECT FORMS & MODALS */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-[#18181b] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-amber-500/30 relative overflow-hidden max-h-[90vh] overflow-y-auto text-white">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 z-10"
            >
              <X size={20} />
            </button>

            {/* PROPERTY MULTI-STEP FORM */}
            {modalType === 'property_form' && (
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Property Management Form (Company Developed for Sale)</span>
                  <h3 className="text-lg font-black text-white">
                    {formProp.id ? 'Edit House / Building Property' : 'Add New House / Building Property'}
                  </h3>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic', '2. Location', '3. Price', '4. Specs', '5. Construction', '6. Features', '7. Documents & Save'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormStep(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                        formStep === idx + 1
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold'
                          : 'bg-[#09090b] text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Step 1: Basic */}
                {formStep === 1 && (
                  <div className="space-y-4 text-xs">
                    {/* 1. FIRST INPUT: Upload Property Images (Multiple, Preview & Reorder) */}
                    <div className="bg-[#121214] p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="block font-black text-amber-400 text-xs uppercase tracking-wide">
                            Upload Property Photos (Cover & Gallery) *
                          </label>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Select multiple photos. Drag & drop any card to reorder. Photo #1 is automatically the Cover.
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                          {propertyImagesList.length} Photos Attached
                        </span>
                      </div>

                      {/* File Selector */}
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all">
                          <Upload size={15} />
                          <span>Choose Photos (Multiple)</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleSelectMultipleImages}
                            className="hidden"
                          />
                        </label>
                        {uploadingBasicImage && (
                          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold animate-pulse">
                            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            <span>Uploading & processing photos...</span>
                          </div>
                        )}
                      </div>

                      {/* Photo Previews and Reordering Grid (Drag & Drop) */}
                      {propertyImagesList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                          {propertyImagesList.map((imgItem, idx) => {
                            const isBeingDragged = draggedImgIdx === idx;
                            const isDragTarget = dragOverImgIdx === idx && !isBeingDragged;

                            return (
                              <div
                                key={imgItem.id || idx}
                                draggable
                                onDragStart={(e) => handleImageDragStart(e, idx)}
                                onDragOver={(e) => handleImageDragOver(e, idx)}
                                onDragLeave={(e) => handleImageDragLeave(e, idx)}
                                onDrop={(e) => handleImageDrop(e, idx)}
                                onDragEnd={handleImageDragEnd}
                                className={`relative rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none transition-all duration-150 flex flex-col ${
                                  isBeingDragged
                                    ? 'opacity-30 scale-95 border-dashed border-amber-500 ring-2 ring-amber-500/50'
                                    : isDragTarget
                                    ? 'border-amber-400 ring-2 ring-amber-400 bg-amber-500/20 scale-[1.03] shadow-xl'
                                    : idx === 0
                                    ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-lg bg-black/60'
                                    : 'border-zinc-800 bg-black/60 hover:border-zinc-700'
                                }`}
                              >
                                <div className="aspect-video w-full overflow-hidden flex items-center justify-center bg-zinc-950 relative pointer-events-none">
                                  <img src={imgItem.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                  {idx === 0 ? (
                                    <span className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                      <Star size={9} fill="currentColor" /> COVER
                                    </span>
                                  ) : (
                                    <span className="absolute top-1.5 left-1.5 bg-black/80 text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                      #{idx + 1}
                                    </span>
                                  )}
                                </div>

                                {/* Controls Bar (No arrow buttons: Drag handle indicator, Set Cover button, Remove button) */}
                                <div className="p-1.5 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 text-zinc-400 pl-0.5">
                                    <GripVertical size={13} className="text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Drag</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {idx !== 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPropertyCoverImage(idx);
                                        }}
                                        className="text-[9px] font-black text-amber-400 hover:text-amber-300 px-1.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-0.5"
                                        title="Set as Main Cover Photo"
                                      >
                                        <Star size={9} /> Set Cover
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removePropertyImage(idx);
                                      }}
                                      className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                                      title="Remove Photo"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-zinc-500 space-y-1">
                          <ImageIcon size={26} className="mx-auto text-zinc-600 mb-1" />
                          <p className="font-bold text-xs text-zinc-400">No photos uploaded yet</p>
                          <p className="text-[11px] text-zinc-500">Click "Choose Photos" above to select multiple photos. Photo #1 will be your main Cover Photo.</p>
                        </div>
                      )}
                    </div>

                    {/* 2. SECOND INPUT: Property Title (Selectable Input) & Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Property Title *</label>
                        <select
                          value={isCustomPropertyTitle ? 'CUSTOM' : (formProp.title || 'Individual House for Sale')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomPropertyTitle(true);
                              updateFormProp({ title: '' });
                            } else {
                              setIsCustomPropertyTitle(false);
                              updateFormProp({ title: val });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          required
                        >
                          {propertyTitleOptions.map((titleOpt) => (
                            <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                          ))}
                          <option value="CUSTOM">Custom Title... (Enter custom)</option>
                        </select>

                        {isCustomPropertyTitle && (
                          <div className="mt-2 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Enter custom property title..."
                              value={formProp.title || ''}
                              onChange={(e) => updateFormProp({ title: e.target.value })}
                              className="w-full bg-[#09090b] border border-amber-500 text-white rounded-xl px-3 py-2 font-bold focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Property Type</label>
                        <select
                          value={formProp.type || 'Individual House'}
                          onChange={(e) => updateFormProp({ type: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Individual House">Individual House</option>
                          <option value="Independent House">Independent House</option>
                          <option value="Villa">Villa</option>
                          <option value="Duplex House">Duplex House</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Residential Building">Residential Building</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Listing Status</label>
                        <select
                          value={formProp.status || 'Available'}
                          onChange={(e) => updateFormProp({ status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Construction">Under Construction</option>
                          <option value="Sold">Sold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formProp.location || serviceAreaOptions[0] || 'Poonamallee'}
                        onChange={(e) => updateFormProp({ location: e.target.value, area: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Google Maps URL</label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/?q=..."
                        value={formProp.maps_url || ''}
                        onChange={(e) => updateFormProp({ maps_url: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formProp.address || ''}
                        onChange={(e) => updateFormProp({ address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Price */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Price *</label>
                      {/* Unified connected container: NO spaces between container ₹ 58 Lakhs */}
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500 transition-colors shadow-inner">
                        <span className="bg-[#18181b] border-r border-zinc-800 text-amber-400 font-black px-3.5 py-2.5 text-sm flex items-center justify-center shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProp.price_amount ?? (formProp.price || '').replace(/[^0-9.]/g, '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const unit = formProp.price_unit || ((formProp.price || '').includes('Crore') ? 'Crores' : (formProp.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs');
                            updateFormProp({
                              price_amount: val,
                              price_unit: unit,
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="flex-1 bg-transparent border-0 px-3.5 py-2.5 text-sm font-extrabold text-amber-400 placeholder-zinc-600 focus:outline-none"
                          placeholder="e.g. 58"
                        />
                        <select
                          value={formProp.price_unit || ((formProp.price || '').includes('Crore') ? 'Crores' : (formProp.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs')}
                          onChange={(e) => {
                            const unit = e.target.value;
                            const val = formProp.price_amount ?? (formProp.price || '').replace(/[^0-9.]/g, '');
                            updateFormProp({
                              price_unit: unit,
                              price_amount: val,
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="Lakhs">Lakhs</option>
                          <option value="Thousands">Thousands</option>
                          <option value="Crores">Crores</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Negotiable</label>
                      <select
                        value={formProp.negotiable || 'Yes'}
                        onChange={(e) => updateFormProp({ negotiable: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4: Specs */}
                {formStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Bedrooms</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formProp.bedrooms ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateFormProp({ bedrooms: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 3"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          BHK
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProp.plot_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProp({ plot_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1000"
                        />
                        <select
                          value={formProp.plot_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProp({ plot_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                          <option value="Acre">Acre</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Built-up Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProp.builtup_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProp({ builtup_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1200"
                        />
                        <select
                          value={formProp.builtup_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProp({ builtup_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Construction */}
                {formStep === 5 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Construction Type</label>
                      <select
                        value={formProp.construction_type || 'RCC / Concrete'}
                        onChange={(e) => updateFormProp({ construction_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="RCC / Concrete">RCC / Concrete</option>
                        <option value="Frame Structure">Frame Structure</option>
                        <option value="Load Bearing">Load Bearing</option>
                        <option value="Steel & Concrete">Steel & Concrete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Roof Type</label>
                      <select
                        value={formProp.roof_type || 'RCC Flat Concrete Roof'}
                        onChange={(e) => updateFormProp({ roof_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="RCC Flat Concrete Roof">RCC Flat Concrete Roof</option>
                        <option value="Sloped Concrete Roof">Sloped Concrete Roof</option>
                        <option value="Tiled Roof">Tiled Roof</option>
                        <option value="Metal Sheet Roof">Metal Sheet Roof</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Facing</label>
                      <select
                        value={formProp.facing || 'East'}
                        onChange={(e) => updateFormProp({ facing: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="East">East</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="West">West</option>
                        <option value="North-East">North-East</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Road Width</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 30"
                          value={formProp.road_width ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProp({ road_width: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                        />
                        <select
                          value={formProp.road_width_unit || 'ft'}
                          onChange={(e) => updateFormProp({ road_width_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="ft">ft</option>
                          <option value="inch">inch</option>
                          <option value="meter">meter</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Year Built</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024"
                        value={formProp.year_built || ''}
                        onChange={(e) => updateFormProp({ year_built: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Features */}
                {formStep === 6 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    {[
                      ['compound_wall', 'Compound Wall'],
                      ['gate', 'Dedicated Gate'],
                      ['water_connection', 'Water Connection'],
                      ['eb_connection', 'EB Connection'],
                      ['borewell', 'Borewell'],
                      ['overhead_tank', 'Overhead Tank'],
                      ['sewer_connection', 'Drainage/Sewer Facility'],
                      ['ground_water', 'Good Ground Water'],
                      ['road_access', 'Direct Road Access']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white hover:border-amber-500/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!formProp[key]}
                          onChange={(e) => updateFormProp({ [key]: e.target.checked })}
                          className="accent-amber-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}

                {/* Step 7: Documents & Save */}
                {formStep === 7 && (
                  <div className="space-y-4 text-xs">
                    {propertyFormError && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400 shrink-0" />
                        <span>{propertyFormError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Patta Status</label>
                        <select
                          value={formProp.patta_status || 'Available'}
                          onChange={(e) => updateFormProp({ patta_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">EC (Encumbrance Certificate)</label>
                        <select
                          value={formProp.ec_status || 'Available'}
                          onChange={(e) => updateFormProp({ ec_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Approved Building Plan</label>
                        <select
                          value={formProp.approved_plan_status || 'Available'}
                          onChange={(e) => updateFormProp({ approved_plan_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Sale Deed Status</label>
                        <select
                          value={formProp.sale_deed_status || 'Available'}
                          onChange={(e) => updateFormProp({ sale_deed_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Clear Title">Clear Title</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Other Documents / Registration Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Approved Plan DTCP No: 128/2023, Building Permit No: 441, Encumbrance Certificate No: 582"
                        value={formProp.other_documents || ''}
                        onChange={(e) => updateFormProp({ other_documents: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Description / Details</label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generatePropertyDescription(formProp);
                            setFormProp(prev => ({ ...prev, description: generated, isDescriptionCustomized: false }));
                          }}
                          className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} /> Auto-Generate from Fields
                        </button>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Property description automatically generates from selected fields, or you can write your own custom details..."
                        value={formProp.description || ''}
                        onChange={(e) => setFormProp(prev => ({ ...prev, description: e.target.value, isDescriptionCustomized: true }))}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProp.published}
                          onChange={(e) => updateFormProp({ published: e.target.checked })}
                          className="accent-amber-500"
                        /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProp.featured}
                          onChange={(e) => updateFormProp({ featured: e.target.checked })}
                          className="accent-amber-500"
                        /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button
                      key="prop-prev-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.max(s - 1, 1));
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors cursor-pointer"
                    >
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 7 ? (
                    <button
                      key="prop-next-step-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.min(s + 1, 7));
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      key="prop-save-property-btn"
                      type="button"
                      disabled={isSavingProperty}
                      onClick={handleSaveProperty}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSavingProperty ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Saving Property...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} /> <span>Save Property</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* LAND MULTI-STEP FORM */}
            {modalType === 'land_form' && (
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Land & Plots Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formLand.id ? 'Edit Land Plot' : 'Add New Residential Land Plot'}
                  </h3>
                </div>

                {/* Step Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic & Photos', '2. Location', '3. Price', '4. Area & Dimensions', '5. Utilities & Approvals', '6. Documents & Save'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormStep(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                        formStep === idx + 1 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold' : 'bg-[#09090b] text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Step 1: Basic & Photos */}
                {formStep === 1 && (
                  <div className="space-y-4 text-xs">
                    {/* 1. FIRST INPUT: Multi-Image Upload */}
                    <div className="bg-[#09090b] p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-black text-white text-xs">Land / Plot Photos & Gallery</label>
                          <p className="text-[11px] text-zinc-400">Upload multiple plot photos. Drag & drop to reorder. Photo #1 is the Cover Photo.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {landImagesList.length} Attached
                          </span>
                          <label className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3 py-1.5 rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleSelectMultipleLandImages}
                              className="hidden"
                            />
                            {uploadingLandImage ? (
                              <>
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={13} />
                                <span>Choose Photos</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Photo Grid Preview with Drag & Drop */}
                      {landImagesList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                          {landImagesList.map((imgItem, idx) => {
                            const isCover = idx === 0;
                            const isBeingDragged = draggedLandImgIdx === idx;
                            const isOver = dragOverLandImgIdx === idx;

                            return (
                              <div
                                key={imgItem.id || idx}
                                draggable
                                onDragStart={(e) => handleLandImageDragStart(e, idx)}
                                onDragOver={(e) => handleLandImageDragOver(e, idx)}
                                onDragLeave={(e) => handleLandImageDragLeave(e, idx)}
                                onDrop={(e) => handleLandImageDrop(e, idx)}
                                onDragEnd={handleLandImageDragEnd}
                                className={`group relative rounded-xl overflow-hidden border bg-zinc-950/80 aspect-video flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-150 ${
                                  isBeingDragged
                                    ? 'opacity-30 scale-95 border-amber-500'
                                    : isOver
                                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-102 z-10'
                                    : isCover
                                    ? 'border-amber-500 ring-1 ring-amber-500/40'
                                    : 'border-zinc-800 hover:border-zinc-600'
                                }`}
                              >
                                <img
                                  src={imgItem.url}
                                  alt={`Plot photo ${idx + 1}`}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                />

                                {/* Index Badge */}
                                <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                  #{idx + 1}
                                </span>

                                {/* Drag Grip Indicator */}
                                <div className="absolute top-1.5 left-8 bg-black/70 text-zinc-300 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <GripVertical size={12} />
                                </div>

                                {/* Cover Badge */}
                                {isCover && (
                                  <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                                    ★ Cover Photo
                                  </span>
                                )}

                                {/* Hover Actions Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setLandCoverImage(idx)}
                                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-2 py-1 rounded text-[10px] uppercase shadow cursor-pointer transition-all"
                                      title="Set as Main Cover Photo"
                                    >
                                      Set Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeLandImage(idx)}
                                    className="bg-red-500/90 hover:bg-red-500 text-white p-1 rounded-lg text-[10px] shadow cursor-pointer transition-all"
                                    title="Remove Photo"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-zinc-500 space-y-1">
                          <ImageIcon size={26} className="mx-auto text-zinc-600 mb-1" />
                          <p className="font-bold text-xs text-zinc-400">No photos uploaded yet</p>
                          <p className="text-[11px] text-zinc-500">Click "Choose Photos" above to select multiple photos. Photo #1 will be your main Cover Photo.</p>
                        </div>
                      )}
                    </div>

                    {/* 2. SECOND INPUT: Land Title (Selectable Input) & Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Land Title *</label>
                        <select
                          value={isCustomLandTitle ? 'CUSTOM' : (formLand.title || 'DTCP Approved Residential Plot')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomLandTitle(true);
                              updateFormLand({ title: '' });
                            } else {
                              setIsCustomLandTitle(false);
                              updateFormLand({ title: val });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          required
                        >
                          {landTitleOptions.map((titleOpt) => (
                            <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                          ))}
                          <option value="CUSTOM">Custom Title... (Enter custom)</option>
                        </select>

                        {isCustomLandTitle && (
                          <div className="mt-2 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Enter custom land plot title..."
                              value={formLand.title || ''}
                              onChange={(e) => updateFormLand({ title: e.target.value })}
                              className="w-full bg-[#09090b] border border-amber-500 text-white rounded-xl px-3 py-2 font-bold focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Land Type</label>
                        <select
                          value={formLand.land_type || 'Residential Plot'}
                          onChange={(e) => updateFormLand({ land_type: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Residential Plot">Residential Plot</option>
                          <option value="Commercial Plot">Commercial Plot</option>
                          <option value="Gated Community Plot">Gated Community Plot</option>
                          <option value="Villa Plot">Villa Plot</option>
                          <option value="Corner Plot">Corner Plot</option>
                          <option value="Agricultural Land">Agricultural Land</option>
                          <option value="Industrial Plot">Industrial Plot</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Listing Status</label>
                        <select
                          value={formLand.status || 'Available'}
                          onChange={(e) => updateFormLand({ status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Negotiation">Under Negotiation</option>
                          <option value="Sold">Sold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formLand.location || serviceAreaOptions[0] || 'Poonamallee'}
                        onChange={(e) => updateFormLand({ location: e.target.value, area: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Google Maps URL</label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/?q=..."
                        value={formLand.maps_url || ''}
                        onChange={(e) => updateFormLand({ maps_url: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formLand.address || ''}
                        onChange={(e) => updateFormLand({ address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Price */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Total Price *</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500 transition-colors shadow-inner">
                        <span className="bg-[#18181b] border-r border-zinc-800 text-amber-400 font-black px-3.5 py-2.5 text-sm flex items-center justify-center shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formLand.price_amount ?? (formLand.total_price || formLand.price || '').replace(/[^0-9.]/g, '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            const unit = formLand.price_unit || ((formLand.total_price || formLand.price || '').includes('Crore') ? 'Crores' : (formLand.total_price || formLand.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs');
                            updateFormLand({
                              price_amount: val,
                              price_unit: unit,
                              total_price: val ? `₹${val} ${unit}` : '',
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="flex-1 bg-transparent border-0 px-3.5 py-2.5 text-sm font-extrabold text-amber-400 placeholder-zinc-600 focus:outline-none"
                          placeholder="e.g. 32"
                        />
                        <select
                          value={formLand.price_unit || ((formLand.total_price || formLand.price || '').includes('Crore') ? 'Crores' : (formLand.total_price || formLand.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs')}
                          onChange={(e) => {
                            const unit = e.target.value;
                            const val = formLand.price_amount ?? (formLand.total_price || formLand.price || '').replace(/[^0-9.]/g, '');
                            updateFormLand({
                              price_unit: unit,
                              price_amount: val,
                              total_price: val ? `₹${val} ${unit}` : '',
                              price: val ? `₹${val} ${unit}` : ''
                            });
                          }}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="Lakhs">Lakhs</option>
                          <option value="Thousands">Thousands</option>
                          <option value="Crores">Crores</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Negotiable</label>
                      <select
                        value={formLand.negotiable || 'Yes'}
                        onChange={(e) => updateFormLand({ negotiable: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Price per sq.ft (Optional)</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <span className="bg-[#18181b] border-r border-zinc-800 text-amber-400 font-black px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formLand.price_per_sqft ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormLand({ price_per_sqft: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 2650"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-zinc-400 font-bold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          / sq.ft
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Area & Dimensions */}
                {formStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area *</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formLand.plot_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormLand({ plot_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1200"
                          required
                        />
                        <select
                          value={formLand.plot_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormLand({ plot_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                          <option value="Acre">Acre</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Length (ft)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formLand.length ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          updateFormLand({ length: val, frontage: val && formLand.width ? `${val}x${formLand.width}` : formLand.frontage });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                        placeholder="e.g. 40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Width (ft)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formLand.width ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          updateFormLand({ width: val, frontage: formLand.length && val ? `${formLand.length}x${val}` : formLand.frontage });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                        placeholder="e.g. 30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Facing</label>
                      <select
                        value={formLand.facing || 'East'}
                        onChange={(e) => updateFormLand({ facing: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      >
                        <option value="East">East</option>
                        <option value="North">North</option>
                        <option value="South">South</option>
                        <option value="West">West</option>
                        <option value="North-East">North-East</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Road Width</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 30"
                          value={formLand.road_width ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormLand({ road_width: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                        />
                        <select
                          value={formLand.road_width_unit || 'ft'}
                          onChange={(e) => updateFormLand({ road_width_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="ft">ft</option>
                          <option value="inch">inch</option>
                          <option value="meter">meter</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Road Type</label>
                      <select
                        value={formLand.road_type || 'Tar Road'}
                        onChange={(e) => updateFormLand({ road_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Tar Road">Tar Road</option>
                        <option value="Concrete Road">Concrete Road</option>
                        <option value="Paved Road">Paved Road</option>
                        <option value="Gravel Road">Gravel Road</option>
                        <option value="Mud Road">Mud Road</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Corner Plot</label>
                      <select
                        value={formLand.corner_plot || 'No'}
                        onChange={(e) => updateFormLand({ corner_plot: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes (Corner Plot)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 5: Utilities & Approvals */}
                {formStep === 5 && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Approval Status *</label>
                      <select
                        value={formLand.approval_status || 'DTCP Approved'}
                        onChange={(e) => updateFormLand({ approval_status: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="DTCP Approved">DTCP Approved</option>
                        <option value="CMDA Approved">CMDA Approved</option>
                        <option value="Panchayat Approved">Panchayat Approved</option>
                        <option value="RERA Approved">RERA Approved</option>
                        <option value="Unapproved / Patta Land">Unapproved / Patta Land</option>
                        <option value="Not Provided">Not Provided</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-bold pt-2">
                      {[
                        ['eb_available', 'EB Power Line Available'],
                        ['water_available', 'Drinking Water Facility'],
                        ['drainage_available', 'Drainage / Sewerage System'],
                        ['borewell_available', 'Potable Sweet Ground Water'],
                        ['gated_community', 'Gated Community Boundary'],
                        ['street_lights', 'Street Lights Installed']
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white hover:border-amber-500/40 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!formLand[key]}
                            onChange={(e) => updateFormLand({ [key]: e.target.checked })}
                            className="accent-amber-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 6: Documents & Save */}
                {formStep === 6 && (
                  <div className="space-y-4 text-xs">
                    {landFormError && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400 shrink-0" />
                        <span>{landFormError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Patta Status</label>
                        <select
                          value={formLand.patta_status || 'Available'}
                          onChange={(e) => updateFormLand({ patta_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">EC (Encumbrance Certificate)</label>
                        <select
                          value={formLand.ec_status || 'Available'}
                          onChange={(e) => updateFormLand({ ec_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Clear EC">Clear EC</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Parent Documents</label>
                        <select
                          value={formLand.parent_documents_status || 'Available'}
                          onChange={(e) => updateFormLand({ parent_documents_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Verified">Verified</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Approval Order Copy</label>
                        <select
                          value={formLand.approval_documents_status || 'Available'}
                          onChange={(e) => updateFormLand({ approval_documents_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Under Process">Under Process</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Sale Deed Status</label>
                        <select
                          value={formLand.sale_deed_status || 'Available'}
                          onChange={(e) => updateFormLand({ sale_deed_status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Clear Title">Clear Title</option>
                          <option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Other Documents / Registration Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. DTCP Approval Order No: 154/2023, Survey No: 284/1B"
                        value={formLand.other_documents || ''}
                        onChange={(e) => updateFormLand({ other_documents: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Description / Details</label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateLandDescription(formLand);
                            setFormLand(prev => ({ ...prev, description: generated, isDescriptionCustomized: false }));
                          }}
                          className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} /> Auto-Generate from Fields
                        </button>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Plot description automatically generates from selected fields, or you can write your own custom details..."
                        value={formLand.description || ''}
                        onChange={(e) => setFormLand(prev => ({ ...prev, description: e.target.value, isDescriptionCustomized: true }))}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formLand.published}
                          onChange={(e) => updateFormLand({ published: e.target.checked })}
                          className="accent-amber-500"
                        /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formLand.featured}
                          onChange={(e) => updateFormLand({ featured: e.target.checked })}
                          className="accent-amber-500"
                        /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button
                      key="land-prev-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.max(s - 1, 1));
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors cursor-pointer"
                    >
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 6 ? (
                    <button
                      key="land-next-step-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.min(s + 1, 6));
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      key="land-save-land-btn"
                      type="button"
                      disabled={isSavingLand}
                      onClick={handleSaveLand}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSavingLand ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Saving Land Plot...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} /> <span>Save Land Plot</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* PROJECT MULTI-STEP FORM */}
            {modalType === 'project_form' && (
              <form
                onSubmit={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Construction Project Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formProj.id ? 'Edit Construction Project' : 'Add New Construction Project'}
                  </h3>
                </div>

                {/* Step Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic & Photos', '2. Location', '3. Specs & Dimensions', '4. Scope of Work', '5. Details & Save'].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormStep(idx + 1)}
                      className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                        formStep === idx + 1 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold' : 'bg-[#09090b] text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Step 1: Basic & Photos */}
                {formStep === 1 && (
                  <div className="space-y-4 text-xs">
                    {/* 1. Multi-Image Upload */}
                    <div className="bg-[#09090b] p-3.5 rounded-2xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block font-black text-white text-xs">Project Photos & Gallery</label>
                          <p className="text-[11px] text-zinc-400">Upload multiple project photos. Drag & drop to reorder. Photo #1 is the Cover Photo.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {projectImagesList.length} Attached
                          </span>
                          <label className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3 py-1.5 rounded-xl text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleSelectMultipleProjectImages}
                              className="hidden"
                            />
                            {uploadingProjectImage ? (
                              <>
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={13} />
                                <span>Choose Photos</span>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Photo Grid Preview with Drag & Drop */}
                      {projectImagesList.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                          {projectImagesList.map((imgItem, idx) => {
                            const isCover = idx === 0;
                            const isBeingDragged = draggedProjImgIdx === idx;
                            const isOver = dragOverProjImgIdx === idx;

                            return (
                              <div
                                key={imgItem.id || idx}
                                draggable
                                onDragStart={(e) => handleProjImageDragStart(e, idx)}
                                onDragOver={(e) => handleProjImageDragOver(e, idx)}
                                onDragLeave={(e) => handleProjImageDragLeave(e, idx)}
                                onDrop={(e) => handleProjImageDrop(e, idx)}
                                onDragEnd={handleProjImageDragEnd}
                                className={`group relative rounded-xl overflow-hidden border bg-zinc-950/80 aspect-video flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-150 ${
                                  isBeingDragged
                                    ? 'opacity-30 scale-95 border-amber-500'
                                    : isOver
                                    ? 'border-amber-400 ring-2 ring-amber-400/50 scale-102 z-10'
                                    : isCover
                                    ? 'border-amber-500 ring-1 ring-amber-500/40'
                                    : 'border-zinc-800 hover:border-zinc-600'
                                }`}
                              >
                                <img
                                  src={imgItem.url}
                                  alt={`Project photo ${idx + 1}`}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                />

                                {/* Index Badge */}
                                <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                  #{idx + 1}
                                </span>

                                {/* Drag Grip Indicator */}
                                <div className="absolute top-1.5 left-8 bg-black/70 text-zinc-300 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  <GripVertical size={12} />
                                </div>

                                {/* Cover Badge */}
                                {isCover && (
                                  <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                                    ★ Cover Photo
                                  </span>
                                )}

                                {/* Hover Actions Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => setProjectCoverImage(idx)}
                                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-2 py-1 rounded text-[10px] uppercase shadow cursor-pointer transition-all"
                                      title="Set as Main Cover Photo"
                                    >
                                      Set Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeProjectImage(idx)}
                                    className="bg-red-500/90 hover:bg-red-500 text-white p-1 rounded-lg text-[10px] shadow cursor-pointer transition-all"
                                    title="Remove Photo"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-zinc-800 rounded-xl p-5 text-center text-zinc-500 space-y-1">
                          <ImageIcon size={26} className="mx-auto text-zinc-600 mb-1" />
                          <p className="font-bold text-xs text-zinc-400">No photos uploaded yet</p>
                          <p className="text-[11px] text-zinc-500">Click "Choose Photos" above to select multiple photos. Photo #1 will be your main Cover Photo.</p>
                        </div>
                      )}
                    </div>

                    {/* 2. Project Name / Title (Selectable Input) & Type & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-zinc-400 mb-1">Project Name / Title *</label>
                        <select
                          value={isCustomProjectTitle ? 'CUSTOM' : (formProj.name || formProj.title || 'Individual Villa Construction')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setIsCustomProjectTitle(true);
                              updateFormProj({ name: '', title: '' });
                            } else {
                              setIsCustomProjectTitle(false);
                              updateFormProj({ name: val, title: val });
                            }
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                          required
                        >
                          {projectTitleOptions.map((titleOpt) => (
                            <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                          ))}
                          <option value="CUSTOM">Custom Title... (Enter custom)</option>
                        </select>

                        {isCustomProjectTitle && (
                          <div className="mt-2 animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Enter custom construction project name..."
                              value={formProj.name || formProj.title || ''}
                              onChange={(e) => updateFormProj({ name: e.target.value, title: e.target.value })}
                              className="w-full bg-[#09090b] border border-amber-500 text-white rounded-xl px-3 py-2 font-bold focus:outline-none placeholder-zinc-600"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Project Category / Type</label>
                        <select
                          value={formProj.project_type || 'Contract Construction'}
                          onChange={(e) => updateFormProj({ project_type: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Contract Construction">Contract Construction</option>
                          <option value="Individual House">Individual House</option>
                          <option value="Villa">Villa</option>
                          <option value="Duplex House">Duplex House</option>
                          <option value="Residential Building">Residential Building</option>
                          <option value="Commercial Building">Commercial Building</option>
                          <option value="Renovation & Remodeling">Renovation & Remodeling</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Project Status</label>
                        <select
                          value={formProj.status || 'Completed'}
                          onChange={(e) => updateFormProj({ status: e.target.value })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="Completed">Completed</option>
                          <option value="Under Construction">Ongoing (Under Construction)</option>
                          <option value="Planning & Approvals">Started (Planning & Approvals)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formProj.location || serviceAreaOptions[0] || 'Poonamallee'}
                        onChange={(e) => updateFormProj({ location: e.target.value, area: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Google Maps Location URL</label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/?q=..."
                        value={formProj.maps_url || ''}
                        onChange={(e) => updateFormProj({ maps_url: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formProj.address || ''}
                        onChange={(e) => updateFormProj({ address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Specs & Dimensions */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Built-up Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProj.builtup_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProj({ builtup_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1500"
                        />
                        <select
                          value={formProj.builtup_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProj({ builtup_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formProj.plot_area ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            updateFormProj({ plot_area: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 1200"
                        />
                        <select
                          value={formProj.plot_area_unit || 'sq.ft'}
                          onChange={(e) => updateFormProj({ plot_area_unit: e.target.value })}
                          className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-2.5 py-2 text-xs focus:outline-none cursor-pointer shrink-0"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="sq.m">sq.m</option>
                          <option value="Cent">Cent</option>
                          <option value="Ground">Ground</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Floors</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formProj.floors ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateFormProj({ floors: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 2"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          Floors
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Bedrooms</label>
                      <div className="flex items-stretch rounded-xl border border-zinc-800 bg-[#09090b] overflow-hidden focus-within:border-amber-500">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formProj.bedrooms ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateFormProj({ bedrooms: val });
                          }}
                          className="w-full bg-transparent px-3 py-2 text-white font-bold outline-none placeholder-zinc-600"
                          placeholder="e.g. 3"
                        />
                        <span className="bg-[#18181b] border-l border-zinc-800 text-amber-400 font-extrabold px-3 py-2 text-xs flex items-center justify-center shrink-0 select-none">
                          BHK
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Bathrooms</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 3"
                        value={formProj.bathrooms ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          updateFormProj({ bathrooms: val });
                        }}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Completion Year / Date</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024 or Aug 2024"
                        value={formProj.completion_date || formProj.actual_completion_date || ''}
                        onChange={(e) => updateFormProj({ completion_date: e.target.value, actual_completion_date: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Start Date / Year (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 2023 or Jan 2023"
                        value={formProj.start_date || ''}
                        onChange={(e) => updateFormProj({ start_date: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Scope of Work */}
                {formStep === 4 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    {[
                      ['rcc_structure', 'RCC Framed Structure'],
                      ['concrete_roof', 'Reinforced Concrete Roof'],
                      ['compound_wall', 'Compound Wall'],
                      ['gate', 'Dedicated Gate'],
                      ['parking', 'Vehicle Parking'],
                      ['water_connection', 'Water Line Connection'],
                      ['electrical_work', 'Electrical & Modular Switches'],
                      ['plumbing', 'Plumbing & Sanitaryware'],
                      ['painting', 'Exterior & Interior Painting'],
                      ['interior_work', 'Interior Woodwork & Modular Kitchen']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white hover:border-amber-500/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!formProj[key]}
                          onChange={(e) => updateFormProj({ [key]: e.target.checked })}
                          className="accent-amber-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}

                {/* Step 5: Details & Save */}
                {formStep === 5 && (
                  <div className="space-y-4 text-xs">
                    {projectFormError && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle size={15} className="text-red-400 shrink-0" />
                        <span>{projectFormError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Special Features / Highlights</label>
                      <input
                        type="text"
                        placeholder="e.g. Teak wood main door, Italian marble flooring, solar water heater"
                        value={formProj.special_features || ''}
                        onChange={(e) => updateFormProj({ special_features: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-400">Description / Overview</label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateProjectDescription(formProj);
                            setFormProj(prev => ({ ...prev, description: generated, overview: generated, isDescriptionCustomized: false }));
                          }}
                          className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={13} /> Auto-Generate from Fields
                        </button>
                      </div>
                      <textarea
                        rows="4"
                        placeholder="Project overview automatically generates from selected specs, or you can write your own custom details..."
                        value={formProj.description || formProj.overview || ''}
                        onChange={(e) => setFormProj(prev => ({ ...prev, description: e.target.value, overview: e.target.value, isDescriptionCustomized: true }))}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-zinc-600 leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProj.published}
                          onChange={(e) => updateFormProj({ published: e.target.checked })}
                          className="accent-amber-500"
                        /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formProj.featured}
                          onChange={(e) => updateFormProj({ featured: e.target.checked })}
                          className="accent-amber-500"
                        /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button
                      key="proj-prev-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.max(s - 1, 1));
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase transition-colors cursor-pointer"
                    >
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 5 ? (
                    <button
                      key="proj-next-step-btn"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormStep(s => Math.min(s + 1, 5));
                      }}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      key="proj-save-project-btn"
                      type="button"
                      disabled={isSavingProject}
                      onClick={handleSaveProject}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSavingProject ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Saving Project...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} /> <span>Save Construction Project</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* GALLERY UPLOAD / EDIT FORM */}
            {modalType === 'gallery_form' && (
              <form onSubmit={handleSaveGallery} className="space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Gallery Photo Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formGal.id ? 'Edit Gallery Photo' : 'Upload New Gallery Photo'}
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Select Gallery Image File *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const selectedFile = e.target.files[0];
                          const formData = new FormData();
                          formData.append('image', selectedFile);

                          try {
                            const res = await fetch('/api/media/upload-image?section=gallery', {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data.imageUrl) {
                              setFormGal(prev => ({ ...prev, image: data.imageUrl }));
                            } else {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                setFormGal(prev => ({ ...prev, image: uploadEvent.target.result }));
                              };
                              reader.readAsDataURL(selectedFile);
                            }
                          } catch (err) {
                            console.error('Direct upload failed, using FileReader fallback:', err);
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              setFormGal(prev => ({ ...prev, image: uploadEvent.target.result }));
                            };
                            reader.readAsDataURL(selectedFile);
                          }
                        }
                      }}
                      className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>

                  {formGal.image ? (
                    <div className="mt-2">
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Image Preview</label>
                      <div className="w-full h-52 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 p-1">
                        <img src={formGal.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">Cancel</button>
                  <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5">
                    <Save size={14} /> Save Gallery Photo
                  </button>
                </div>
              </form>
            )}

            {/* TESTIMONIAL MODAL FORM */}
            {modalType === 'testimonial_form' && (
              <form onSubmit={handleSaveTestimonial} className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Client Review Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formTestimonial.id ? 'Edit Testimonial' : 'Add New Testimonial'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Client / Family Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh & Family"
                      value={formTestimonial.client_name}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, client_name: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Location / Area</label>
                    <input
                      type="text"
                      placeholder="e.g. Poonamallee"
                      value={formTestimonial.location}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, location: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-400 mb-1">Star Rating</label>
                    <select
                      value={formTestimonial.rating || 5}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, rating: parseInt(e.target.value) || 5 })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                      <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                      <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-400 mb-1">Testimonial Quote / Review Text *</label>
                    <textarea
                      rows="3"
                      placeholder="Write client experience or review quote..."
                      value={formTestimonial.quote}
                      onChange={(e) => setFormTestimonial({ ...formTestimonial, quote: e.target.value })}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">Cancel</button>
                  <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5 cursor-pointer">
                    <Save size={14} /> Save Testimonial
                  </button>
                </div>
              </form>
            )}

            {/* RENAME VIDEO MODAL */}
            {modalType === 'rename_video' && (
              <form onSubmit={handleRenameVideoSubmit} className="space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Video Action</span>
                  <h3 className="text-lg font-black text-white">Rename Video File</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Current Filename & Path</label>
                  <div className="text-xs font-mono font-bold bg-[#09090b] border border-zinc-800 p-2.5 rounded-xl text-amber-300 break-all">
                    uploads/videos/{videoRename.currentName}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">New Filename (.mp4)</label>
                  <input
                    type="text"
                    value={videoRename.newName}
                    onChange={(e) => setVideoRename({ ...videoRename, newName: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">Cancel</button>
                  <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5">
                    <Save size={14} /> Save New Name
                  </button>
                </div>
              </form>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {modalType === 'confirm_delete' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle size={30} />
                </div>
                <h3 className="text-lg font-black text-white">Confirm Deletion</h3>
                <p className="text-xs text-zinc-300 font-medium px-4">{deleteConfig.title}</p>
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-5 py-2.5 rounded-xl text-xs uppercase">Cancel</button>
                  <button type="button" onClick={() => deleteConfig.onConfirm()} className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md">Yes, Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
