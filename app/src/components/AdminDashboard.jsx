import React, { useState, useEffect, useRef } from 'react';
import { Lock, LogOut, Plus, Trash2, ShieldCheck, Home, MapPin, Users, Settings, Image as ImageIcon, Video, CheckCircle, Upload, X, Save, AlertTriangle, Star, Building, Layers, Eye, EyeOff, FileText, Check, Map, Compass, Phone, User } from 'lucide-react';

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

  const VALID_TABS = ['dashboard', 'properties', 'land', 'projects', 'gallery', 'leads', 'settings', 'videos'];

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

  // Database Data States
  const defaultSettingsState = {
    company_name: 'SK BUILDERS',
    company_subtitle: '& PROPERTY CONSULTANT',
    phone: '9876543210',
    whatsapp_number: '9876543210',
    email: 'info@skbuilders.com',
    location: 'Poonamallee, Chennai',
    service_areas: 'Poonamallee, Mangadu, Kundrathur',
    logo_url: '/logo/sk-builders-logo.png'
  };

  const [settings, setSettings] = useState(defaultSettingsState);
  const [settingsForm, setSettingsForm] = useState(defaultSettingsState);
  const [isSettingsFormDirty, setIsSettingsFormDirty] = useState(false);
  const [services, setServices] = useState([]);
  const [properties, setProperties] = useState([]);
  const [land, setLand] = useState([]);
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [leads, setLeads] = useState([]);
  const [videos, setVideos] = useState([]);
  const [statusNotice, setStatusNotice] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Dynamically compute location selection options from Admin Settings -> Service Areas
  const serviceAreaOptions = getServiceAreaOptions(settingsForm.service_areas || settings?.service_areas, settingsForm.location || settings?.location);

  // Set Admin Tab Title
  useEffect(() => {
    document.title = `${settings?.company_name || 'Admin'} - Admin Portal`;
  }, [settings?.company_name]);

  // Form State Containers
  const [formProp, setFormProp] = useState({
    id: null, property_id: '', title: '', type: 'Individual House', listing_type: 'For Sale', status: 'Available',
    address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
    price: '₹58 Lakhs', price_display_type: 'Exact Price', negotiable: 'Yes', price_per_sqft: '',
    plot_area: '1000', plot_area_unit: 'sq.ft', builtup_area: '1200', builtup_area_unit: 'sq.ft', floor_area: '',
    floors: '2', bedrooms: '2 BHK', bathrooms: '2', balconies: '1', kitchens: '1', living_room: '1', dining_area: '1', pooja_room: '1',
    construction_status: 'Completed', year_built: '2024', construction_type: 'RCC / Concrete', roof_type: 'RCC Flat Concrete Roof',
    parking_available: 'Yes', parking_type: 'Car + Bike', cars: '1', bikes: '2',
    compound_wall: true, gate: true, water_connection: true, eb_connection: true, sewer_connection: true, borewell: true, overhead_tank: true, ground_water: true, road_access: true,
    facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', corner_property: 'No',
    patta_status: 'Available', ec_status: 'Available', approved_plan_status: 'Available', building_approval_status: 'Available', property_tax_status: 'Available', sale_deed_status: 'Available', other_documents: '',
    short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
  });

  const [formLand, setFormLand] = useState({
    id: null, land_id: '', title: '', land_type: 'Residential Plot', listing_type: 'For Sale', status: 'Available',
    address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
    plot_area: '1200', plot_area_unit: 'sq.ft', frontage: '30 ft', length: '40', width: '30',
    total_price: '₹32 Lakhs', price_per_sqft: '₹2,666', negotiable: 'Yes', price_display_type: 'Exact Price',
    approval_status: 'DTCP Approved', facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', road_facing: 'North', corner_plot: 'No',
    eb_available: true, water_available: true, drainage_available: true, borewell_available: true,
    patta_status: 'Available', ec_status: 'Available', parent_documents_status: 'Available', sale_deed_status: 'Available', approval_documents_status: 'Available', other_documents: '',
    nearby_school: '1.2 km', nearby_hospital: '2 km', nearby_bus_stop: '500m', nearby_railway: '3 km', nearby_main_road: '300m', nearby_shopping: '1 km',
    short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
  });

  const [formProj, setFormProj] = useState({
    id: null, project_id: '', name: '', title: '', project_type: 'Individual House', status: 'Completed',
    address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '',
    plot_area: '1200', plot_area_unit: 'sq.ft', builtup_area: '1500', builtup_area_unit: 'sq.ft', floors: '2', bedrooms: '3 BHK', bathrooms: '3',
    start_date: '2023-01-15', expected_completion_date: '2024-03-30', actual_completion_date: '2024-03-15',
    rcc_structure: true, concrete_roof: true, compound_wall: true, gate: true, parking: true, water_connection: true, electrical_work: true, plumbing: true, painting: true, interior_work: true,
    overview: '', description: '', construction_details: '', special_features: '', challenges: '', solutions: '', client_requirements: '', final_outcome: '',
    completion_date: '2024', cover_image: '/house/completed-house.jpg', published: true, featured: true, location: 'Poonamallee', images: []
  });

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
      const [sRes, srvRes, propRes, landRes, projRes, galRes, testRes, leadRes, vidRes] = await Promise.all([
        fetch('/api/settings').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/services').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/properties').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/land').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/projects').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/gallery').then(r => r.ok ? r.json() : null).catch(() => null),
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
      setTestimonials(Array.isArray(testRes) ? testRes : []);
      setLeads(Array.isArray(leadRes) ? leadRes : []);
      setVideos(Array.isArray(vidRes) ? vidRes : []);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoadingData(false);
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
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });

      if (res.ok) {
        setIsSettingsFormDirty(false);
        setSettings(settingsForm);
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
    e.preventDefault();
    const isEdit = !!formProp.id;
    const url = isEdit ? `/api/properties/${formProp.id}` : '/api/properties';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProp)
    });

    if (res.ok) {
      const data = await res.json();
      const recordId = isEdit ? formProp.id : data.id;

      if (selectedImageFiles.length > 0 && recordId) {
        await handleBatchImageUpload('/api/properties', recordId, selectedImageFiles);
      }

      fetchData();
      notifySiteDataUpdated();
      setModalType(null);
      setSelectedImageFiles([]);
      setStatusNotice(isEdit ? 'Property updated successfully!' : 'New Property created!');
      setTimeout(() => setStatusNotice(''), 3000);
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
    e.preventDefault();
    const isEdit = !!formLand.id;
    const url = isEdit ? `/api/land/${formLand.id}` : '/api/land';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formLand)
    });

    if (res.ok) {
      const data = await res.json();
      const recordId = isEdit ? formLand.id : data.id;

      if (selectedImageFiles.length > 0 && recordId) {
        await handleBatchImageUpload('/api/land', recordId, selectedImageFiles);
      }

      fetchData();
      notifySiteDataUpdated();
      setModalType(null);
      setSelectedImageFiles([]);
      setStatusNotice(isEdit ? 'Land record updated!' : 'New Land plot added!');
      setTimeout(() => setStatusNotice(''), 3000);
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
    e.preventDefault();
    const isEdit = !!formProj.id;
    const url = isEdit ? `/api/projects/${formProj.id}` : '/api/projects';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProj)
    });

    if (res.ok) {
      const data = await res.json();
      const recordId = isEdit ? formProj.id : data.id;

      if (selectedImageFiles.length > 0 && recordId) {
        await handleBatchImageUpload('/api/projects', recordId, selectedImageFiles, imageCategory);
      }

      fetchData();
      notifySiteDataUpdated();
      setModalType(null);
      setSelectedImageFiles([]);
      setStatusNotice(isEdit ? 'Project updated!' : 'New Project created!');
      setTimeout(() => setStatusNotice(''), 3000);
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

  // Safe Arrays
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeLand = Array.isArray(land) ? land : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeServices = Array.isArray(services) ? services : [];
  const safeGallery = Array.isArray(gallery) ? gallery : [];
  const safeLeads = Array.isArray(leads) ? leads : [];
  const safeVideos = Array.isArray(videos) ? videos : [];
  const heroVideos = safeVideos.filter(v => (v.video_type || 'hero') === 'hero');
  const bgVideos = safeVideos.filter(v => v.video_type === 'background');

  // Filtered lists
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
  const ongoingProjectsCount = safeProjects.filter(p => p.status === 'Under Construction').length;

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
                  placeholder="admin"
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
                  placeholder="••••••••"
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

        <button
          onClick={handleLogout}
          className="bg-red-500/15 hover:bg-red-500/30 text-red-400 hover:text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-red-500/30"
        >
          <LogOut size={14} /> Logout
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {statusNotice && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs p-4 rounded-2xl shadow-lg flex items-center gap-2 animate-fadeIn backdrop-blur-md">
            <CheckCircle size={18} className="text-amber-400 shrink-0" /> {statusNotice}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-800">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Layers size={15} /> },
            { id: 'properties', label: 'Properties', icon: <Building size={15} /> },
            { id: 'land', label: 'Land / Plots', icon: <MapPin size={15} /> },
            { id: 'projects', label: 'Projects', icon: <Home size={15} /> },
            { id: 'gallery', label: 'Gallery', icon: <ImageIcon size={15} /> },
            { id: 'leads', label: 'Leads', icon: <Users size={15} /> },
            { id: 'settings', label: 'Admin Settings', icon: <Settings size={15} /> },
            { id: 'videos', label: 'Video & Frames Manager', icon: <Video size={15} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#18181b] text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 0: DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="text-[11px] text-amber-300 font-bold mt-1">{completedProjectsCount} Completed • {ongoingProjectsCount} Ongoing</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Home size={24} />
                </div>
              </div>

              <div className="bg-[#18181b]/90 p-5 rounded-3xl border border-zinc-800 shadow-xl flex items-center justify-between backdrop-blur-md">
                <div>
                  <div className="text-2xl font-black text-white">{safeLeads.length}</div>
                  <div className="text-xs font-extrabold text-zinc-400 uppercase mt-0.5">New Inquiries</div>
                  <div className="text-[11px] text-zinc-400 font-bold mt-1">{soldCount} Properties Sold</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Users size={24} />
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
                  onClick={() => {
                    setFormStep(1);
                    setFormProp({
                      id: null, property_id: '', title: '', type: 'Individual House', listing_type: 'For Sale', status: 'Available',
                      address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
                      price: '₹58 Lakhs', price_display_type: 'Exact Price', negotiable: 'Yes', price_per_sqft: '',
                      plot_area: '1000', plot_area_unit: 'sq.ft', builtup_area: '1200', builtup_area_unit: 'sq.ft', floor_area: '',
                      floors: '2', bedrooms: '2 BHK', bathrooms: '2', balconies: '1', kitchens: '1', living_room: '1', dining_area: '1', pooja_room: '1',
                      construction_status: 'Completed', year_built: '2024', construction_type: 'RCC / Concrete', roof_type: 'RCC Flat Concrete Roof',
                      parking_available: 'Yes', parking_type: 'Car + Bike', cars: '1', bikes: '2',
                      compound_wall: true, gate: true, water_connection: true, eb_connection: true, sewer_connection: true, borewell: true, overhead_tank: true, ground_water: true, road_access: true,
                      facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', corner_property: 'No',
                      patta_status: 'Available', ec_status: 'Available', approved_plan_status: 'Available', building_approval_status: 'Available', property_tax_status: 'Available', sale_deed_status: 'Available', other_documents: '',
                      short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
                    });
                    setModalType('property_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md border border-amber-300/40"
                >
                  <Plus size={15} /> Add House Property
                </button>

                <button
                  onClick={() => {
                    setFormStep(1);
                    setFormLand({
                      id: null, land_id: '', title: '', land_type: 'Residential Plot', listing_type: 'For Sale', status: 'Available',
                      address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
                      plot_area: '1200', plot_area_unit: 'sq.ft', frontage: '30 ft', length: '40', width: '30',
                      total_price: '₹32 Lakhs', price_per_sqft: '₹2,666', negotiable: 'Yes', price_display_type: 'Exact Price',
                      approval_status: 'DTCP Approved', facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', road_facing: 'North', corner_plot: 'No',
                      eb_available: true, water_available: true, drainage_available: true, borewell_available: true,
                      patta_status: 'Available', ec_status: 'Available', parent_documents_status: 'Available', sale_deed_status: 'Available', approval_documents_status: 'Available', other_documents: '',
                      nearby_school: '1.2 km', nearby_hospital: '2 km', nearby_bus_stop: '500m', nearby_railway: '3 km', nearby_main_road: '300m', nearby_shopping: '1 km',
                      short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
                    });
                    setModalType('land_form');
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md"
                >
                  <Plus size={15} /> Add Land Plot
                </button>

                <button
                  onClick={() => {
                    setFormStep(1);
                    setFormProj({
                      id: null, project_id: '', name: '', title: '', project_type: 'Individual House', status: 'Completed',
                      address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '',
                      plot_area: '1200', plot_area_unit: 'sq.ft', builtup_area: '1500', builtup_area_unit: 'sq.ft', floors: '2', bedrooms: '3 BHK', bathrooms: '3',
                      start_date: '2023-01-15', expected_completion_date: '2024-03-30', actual_completion_date: '2024-03-15',
                      rcc_structure: true, concrete_roof: true, compound_wall: true, gate: true, parking: true, water_connection: true, electrical_work: true, plumbing: true, painting: true, interior_work: true,
                      overview: '', description: '', construction_details: '', special_features: '', challenges: '', solutions: '', client_requirements: '', final_outcome: '',
                      completion_date: '2024', cover_image: '/house/completed-house.jpg', published: true, featured: true, location: 'Poonamallee', images: []
                    });
                    setModalType('project_form');
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md"
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
                  placeholder="Search property title, ID or location..."
                  value={propSearch}
                  onChange={(e) => setPropSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredProperties.length > 0 && (
                  <button
                    onClick={() => {
                      setFormStep(1);
                      setFormProp({
                        id: null, property_id: '', title: '', type: 'Individual House', listing_type: 'For Sale', status: 'Available',
                        address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
                        price: '₹58 Lakhs', price_display_type: 'Exact Price', negotiable: 'Yes', price_per_sqft: '',
                        plot_area: '1000', plot_area_unit: 'sq.ft', builtup_area: '1200', builtup_area_unit: 'sq.ft', floor_area: '',
                        floors: '2', bedrooms: '2 BHK', bathrooms: '2', balconies: '1', kitchens: '1', living_room: '1', dining_area: '1', pooja_room: '1',
                        construction_status: 'Completed', year_built: '2024', construction_type: 'RCC / Concrete', roof_type: 'RCC Flat Concrete Roof',
                        parking_available: 'Yes', parking_type: 'Car + Bike', cars: '1', bikes: '2',
                        compound_wall: true, gate: true, water_connection: true, eb_connection: true, sewer_connection: true, borewell: true, overhead_tank: true, ground_water: true, road_access: true,
                        facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', corner_property: 'No',
                        patta_status: 'Available', ec_status: 'Available', approved_plan_status: 'Available', building_approval_status: 'Available', property_tax_status: 'Available', sale_deed_status: 'Available', other_documents: '',
                        short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
                      });
                      setModalType('property_form');
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <Plus size={15} /> Add New Property
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isLoadingData && filteredProperties.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
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
                  onClick={() => {
                    setFormStep(1);
                    setFormProp({
                      id: null, property_id: '', title: '', type: 'Individual House', listing_type: 'For Sale', status: 'Available',
                      address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
                      price: '₹58 Lakhs', price_display_type: 'Exact Price', negotiable: 'Yes', price_per_sqft: '',
                      plot_area: '1000', plot_area_unit: 'sq.ft', builtup_area: '1200', builtup_area_unit: 'sq.ft', floor_area: '',
                      floors: '2', bedrooms: '2 BHK', bathrooms: '2', balconies: '1', kitchens: '1', living_room: '1', dining_area: '1', pooja_room: '1',
                      construction_status: 'Completed', year_built: '2024', construction_type: 'RCC / Concrete', roof_type: 'RCC Flat Concrete Roof',
                      parking_available: 'Yes', parking_type: 'Car + Bike', cars: '1', bikes: '2',
                      compound_wall: true, gate: true, water_connection: true, eb_connection: true, sewer_connection: true, borewell: true, overhead_tank: true, ground_water: true, road_access: true,
                      facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', corner_property: 'No',
                      patta_status: 'Available', ec_status: 'Available', approved_plan_status: 'Available', building_approval_status: 'Available', property_tax_status: 'Available', sale_deed_status: 'Available', other_documents: '',
                      short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
                    });
                    setModalType('property_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Plus size={16} /> Add First Property
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProperties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setFormProp({ ...p, published: !!p.published, featured: !!p.featured });
                      setFormStep(1);
                      setModalType('property_form');
                    }}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Image & Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative">
                        <img
                          src={p.image || '/house/completed-house.jpg'}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-500/30">
                          {p.bedrooms || '2 BHK'}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {p.property_id || `HOUSE-${p.id}`}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">
                            {p.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${p.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                            {p.status}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {p.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-amber-400" /> {p.location || p.area}
                          </span>
                          <span>•</span>
                          <span>{p.builtup_area || '1200 Sq.ft'}</span>
                          {p.updated_at && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(p.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Toggle Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-zinc-800 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Price</div>
                        <div className="text-sm font-black text-amber-400">{p.price}</div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1"
                          title="Delete Property"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                  placeholder="Search land title, ID or location..."
                  value={landSearch}
                  onChange={(e) => setLandSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredLand.length > 0 && (
                  <button
                    onClick={() => {
                      setFormStep(1);
                      setFormLand({
                        id: null, land_id: '', title: '', land_type: 'Residential Plot', listing_type: 'For Sale', status: 'Available',
                        address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
                        plot_area: '1200', plot_area_unit: 'sq.ft', frontage: '30 ft', length: '40', width: '30',
                        total_price: '₹32 Lakhs', price_per_sqft: '₹2,666', negotiable: 'Yes', price_display_type: 'Exact Price',
                        approval_status: 'DTCP Approved', facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', road_facing: 'North', corner_plot: 'No',
                        eb_available: true, water_available: true, drainage_available: true, borewell_available: true,
                        patta_status: 'Available', ec_status: 'Available', parent_documents_status: 'Available', sale_deed_status: 'Available', approval_documents_status: 'Available', other_documents: '',
                        nearby_school: '1.2 km', nearby_hospital: '2 km', nearby_bus_stop: '500m', nearby_railway: '3 km', nearby_main_road: '300m', nearby_shopping: '1 km',
                        short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
                      });
                      setModalType('land_form');
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <Plus size={15} /> Add New Land Plot
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isLoadingData && filteredLand.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
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
                  onClick={() => {
                    setFormStep(1);
                    setFormLand({
                      id: null, land_id: '', title: '', land_type: 'Residential Plot', listing_type: 'For Sale', status: 'Available',
                      address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '', landmark: '',
                      plot_area: '1200', plot_area_unit: 'sq.ft', frontage: '30 ft', length: '40', width: '30',
                      total_price: '₹32 Lakhs', price_per_sqft: '₹2,666', negotiable: 'Yes', price_display_type: 'Exact Price',
                      approval_status: 'DTCP Approved', facing: 'East', road_width: '30', road_width_unit: 'ft', road_type: 'Tar Road', road_facing: 'North', corner_plot: 'No',
                      eb_available: true, water_available: true, drainage_available: true, borewell_available: true,
                      patta_status: 'Available', ec_status: 'Available', parent_documents_status: 'Available', sale_deed_status: 'Available', approval_documents_status: 'Available', other_documents: '',
                      nearby_school: '1.2 km', nearby_hospital: '2 km', nearby_bus_stop: '500m', nearby_railway: '3 km', nearby_main_road: '300m', nearby_shopping: '1 km',
                      short_description: '', full_description: '', highlights: '', published: true, featured: true, location: 'Poonamallee', image: '/house/completed-house.jpg', images: []
                    });
                    setModalType('land_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Plus size={16} /> Add First Land Plot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLand.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setFormLand({ ...l, published: !!l.published, featured: !!l.featured });
                      setFormStep(1);
                      setModalType('land_form');
                    }}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Image & Land Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative">
                        <img
                          src={l.image || '/house/completed-house.jpg'}
                          alt={l.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 left-1 bg-emerald-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
                          Land
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {l.land_id || `LAND-${l.id}`}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {l.approval_status || 'DTCP Approved'}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {l.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-amber-400" /> {l.location || l.area}
                          </span>
                          <span>•</span>
                          <span>Area: {l.plot_area} {l.plot_area_unit || 'sq.ft'}</span>
                          {l.updated_at && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(l.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Total Price & Toggles */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-zinc-800 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">Total Price</div>
                        <div className="text-sm font-black text-amber-400">{l.total_price || l.price}</div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1"
                          title="Delete Land"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                  placeholder="Search project name, ID or location..."
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                  className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-2 text-xs w-64 text-white focus:border-amber-500 focus:outline-none"
                />

                {filteredProjects.length > 0 && (
                  <button
                    onClick={() => {
                      setFormStep(1);
                      setFormProj({
                        id: null, project_id: '', name: '', title: '', project_type: 'Individual House', status: 'Completed',
                        address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '',
                        plot_area: '1200', plot_area_unit: 'sq.ft', builtup_area: '1500', builtup_area_unit: 'sq.ft', floors: '2', bedrooms: '3 BHK', bathrooms: '3',
                        start_date: '2023-01-15', expected_completion_date: '2024-03-30', actual_completion_date: '2024-03-15',
                        rcc_structure: true, concrete_roof: true, compound_wall: true, gate: true, parking: true, water_connection: true, electrical_work: true, plumbing: true, painting: true, interior_work: true,
                        overview: '', description: '', construction_details: '', special_features: '', challenges: '', solutions: '', client_requirements: '', final_outcome: '',
                        completion_date: '2024', cover_image: '/house/completed-house.jpg', published: true, featured: true, location: 'Poonamallee', images: []
                      });
                      setModalType('project_form');
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <Plus size={15} /> Add New Project
                  </button>
                )}
              </div>
            </div>

            {/* List / Empty State */}
            {isLoadingData && filteredProjects.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-24 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
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
                  onClick={() => {
                    setFormStep(1);
                    setFormProj({
                      id: null, project_id: '', name: '', title: '', project_type: 'Individual House', status: 'Completed',
                      address: '', area: 'Poonamallee', city: 'Chennai', pincode: '600056', maps_url: '', latitude: '', longitude: '',
                      plot_area: '1200', plot_area_unit: 'sq.ft', builtup_area: '1500', builtup_area_unit: 'sq.ft', floors: '2', bedrooms: '3 BHK', bathrooms: '3',
                      start_date: '2023-01-15', expected_completion_date: '2024-03-30', actual_completion_date: '2024-03-15',
                      rcc_structure: true, concrete_roof: true, compound_wall: true, gate: true, parking: true, water_connection: true, electrical_work: true, plumbing: true, painting: true, interior_work: true,
                      overview: '', description: '', construction_details: '', special_features: '', challenges: '', solutions: '', client_requirements: '', final_outcome: '',
                      completion_date: '2024', cover_image: '/house/completed-house.jpg', published: true, featured: true, location: 'Poonamallee', images: []
                    });
                    setModalType('project_form');
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <Plus size={16} /> Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => {
                      setFormProj({ ...pr, name: pr.name || pr.title, published: !!pr.published, featured: !!pr.featured });
                      setFormStep(1);
                      setModalType('project_form');
                    }}
                    className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Cover Image & Project Details */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative">
                        <img
                          src={pr.cover_image || '/house/completed-house.jpg'}
                          alt={pr.name || pr.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black text-amber-400 uppercase tracking-wide bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {pr.project_id || `PROJ-${pr.id}`}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${pr.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                            {pr.status}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                          {pr.name || pr.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-semibold flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-amber-400" /> {pr.location || pr.area}
                          </span>
                          <span>•</span>
                          <span>Builtup: {pr.builtup_area || '1500 sq.ft'}</span>
                          {pr.updated_at && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-zinc-500">Updated: {formatLastUpdated(pr.updated_at)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t border-zinc-800 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

            {isLoadingData && safeGallery.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
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

        {/* TAB 5: LEADS */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <h2 className="text-base font-extrabold uppercase text-amber-400">Customer Inquiries & Leads ({safeLeads.length})</h2>

            {isLoadingData && safeLeads.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-20 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : safeLeads.length === 0 ? (
              <div className="bg-[#18181b]/90 border border-zinc-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">No Customer Inquiries Yet</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Inquiries submitted by website visitors through the Contact form or WhatsApp buttons will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {safeLeads.map((l) => (
                  <div key={l.id} className="bg-[#18181b]/90 p-4 rounded-2xl border border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-white">{l.name}</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                          {l.phone}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">
                          {l.service || 'General Inquiry'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium">{l.message}</p>
                    </div>
                    {l.created_at && (
                      <div className="text-[11px] text-zinc-400 font-bold shrink-0">
                        Received: {formatLastUpdated(l.created_at)}
                      </div>
                    )}
                  </div>
                ))}
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
                    <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1">Service Areas</label>
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
                    {isLoadingData && heroVideos.length === 0 ? (
                      <div className="h-24 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
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
                    {isLoadingData && bgVideos.length === 0 ? (
                      <div className="h-24 bg-[#18181b]/70 border border-white/5 rounded-2xl animate-pulse" />
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
              <form onSubmit={handleSaveProperty} className="space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Property Management Form</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Property Title *</label>
                      <select
                        value={formProp.title || '3 BHK Individual House'}
                        onChange={(e) => setFormProp({ ...formProp, title: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                        required
                      >
                        <option value="3 BHK Individual House">3 BHK Individual House</option>
                        <option value="2 BHK Individual House">2 BHK Individual House</option>
                        <option value="4 BHK Individual House">4 BHK Individual House</option>
                        <option value="1 BHK Individual House">1 BHK Individual House</option>
                        <option value="Individual House for Sale">Individual House for Sale</option>
                        <option value="Independent Villa for Sale">Independent Villa for Sale</option>
                        <option value="Duplex Villa">Duplex Villa</option>
                        <option value="Luxury House">Luxury House</option>
                        <option value="Custom Construction House">Custom Construction House</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Property Type</label>
                      <select
                        value={formProp.type}
                        onChange={(e) => setFormProp({ ...formProp, type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
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
                        value={formProp.status}
                        onChange={(e) => setFormProp({ ...formProp, status: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Available">Available</option>
                        <option value="Under Construction">Under Construction</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Service Area Location *</label>
                      <select
                        value={formProp.location || serviceAreaOptions[0]}
                        onChange={(e) => setFormProp({ ...formProp, location: e.target.value, area: e.target.value })}
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
                        value={formProp.maps_url}
                        onChange={(e) => setFormProp({ ...formProp, maps_url: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Full Address / Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Kovil Street, Poonamallee"
                        value={formProp.address}
                        onChange={(e) => setFormProp({ ...formProp, address: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Price */}
                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Price *</label>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#18181b] border border-zinc-800 text-amber-400 font-extrabold px-3 py-2 rounded-xl text-sm shrink-0 select-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          value={(formProp.price || '').replace(/[^0-9.]/g, '') || '58'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const unit = (formProp.price || '').includes('Crore') ? 'Crores' : (formProp.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs';
                            setFormProp({ ...formProp, price: `₹${val} ${unit}` });
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 font-extrabold text-amber-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                          placeholder="58"
                          required
                        />
                        <select
                          value={(formProp.price || '').includes('Crore') ? 'Crores' : (formProp.price || '').includes('Thousand') ? 'Thousands' : 'Lakhs'}
                          onChange={(e) => {
                            const val = (formProp.price || '').replace(/[^0-9.]/g, '') || '58';
                            setFormProp({ ...formProp, price: `₹${val} ${e.target.value}` });
                          }}
                          className="bg-[#09090b] border border-zinc-800 text-amber-400 font-extrabold rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
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
                        value={formProp.negotiable}
                        onChange={(e) => setFormProp({ ...formProp, negotiable: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
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
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={(formProp.bedrooms || '').replace(/[^0-9]/g, '') || '2'}
                          onChange={(e) => setFormProp({ ...formProp, bedrooms: `${e.target.value} BHK` })}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                        />
                        <span className="bg-[#18181b] border border-zinc-800 text-amber-400 font-extrabold px-3 py-2 rounded-xl text-xs shrink-0 select-none">
                          BHK
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={(formProp.plot_area || '').replace(/[^0-9.]/g, '') || '1000'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const unit = (formProp.plot_area || '').includes('sq.m') ? 'sq.m' : (formProp.plot_area || '').includes('Cent') ? 'Cent' : (formProp.plot_area || '').includes('Ground') ? 'Ground' : (formProp.plot_area || '').includes('Acre') ? 'Acre' : 'sq.ft';
                            setFormProp({ ...formProp, plot_area: `${val} ${unit}` });
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                          placeholder="1000"
                        />
                        <select
                          value={(formProp.plot_area || '').includes('sq.m') ? 'sq.m' : (formProp.plot_area || '').includes('Cent') ? 'Cent' : (formProp.plot_area || '').includes('Ground') ? 'Ground' : (formProp.plot_area || '').includes('Acre') ? 'Acre' : 'sq.ft'}
                          onChange={(e) => {
                            const val = (formProp.plot_area || '').replace(/[^0-9.]/g, '') || '1000';
                            setFormProp({ ...formProp, plot_area: `${val} ${e.target.value}` });
                          }}
                          className="bg-[#09090b] border border-zinc-800 text-zinc-300 font-bold rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-amber-500"
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
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={(formProp.builtup_area || '').replace(/[^0-9.]/g, '') || '1200'}
                          onChange={(e) => {
                            const val = e.target.value;
                            const unit = (formProp.builtup_area || '').includes('sq.m') ? 'sq.m' : (formProp.builtup_area || '').includes('Cent') ? 'Cent' : (formProp.builtup_area || '').includes('Ground') ? 'Ground' : 'sq.ft';
                            setFormProp({ ...formProp, builtup_area: `${val} ${unit}` });
                          }}
                          className="w-full bg-[#09090b] border border-zinc-800 text-white font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                          placeholder="1200"
                        />
                        <select
                          value={(formProp.builtup_area || '').includes('sq.m') ? 'sq.m' : (formProp.builtup_area || '').includes('Cent') ? 'Cent' : (formProp.builtup_area || '').includes('Ground') ? 'Ground' : 'sq.ft'}
                          onChange={(e) => {
                            const val = (formProp.builtup_area || '').replace(/[^0-9.]/g, '') || '1200';
                            setFormProp({ ...formProp, builtup_area: `${val} ${e.target.value}` });
                          }}
                          className="bg-[#09090b] border border-zinc-800 text-zinc-300 font-bold rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-amber-500"
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
                        onChange={(e) => setFormProp({ ...formProp, construction_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
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
                        onChange={(e) => setFormProp({ ...formProp, roof_type: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="RCC Flat Concrete Roof">RCC Flat Concrete Roof</option>
                        <option value="Sloped Concrete Roof">Sloped Concrete Roof</option>
                        <option value="Tiled Roof">Tiled Roof</option>
                        <option value="Metal Sheet Roof">Metal Sheet Roof</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 6: Features */}
                {formStep === 6 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                    {[
                      ['compound_wall', 'Compound Wall'], ['gate', 'Gate'], ['water_connection', 'Water Connection'],
                      ['eb_connection', 'EB Connection'], ['borewell', 'Borewell'], ['overhead_tank', 'Overhead Tank']
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2.5 bg-[#09090b] rounded-xl border border-zinc-800 cursor-pointer text-white">
                        <input
                          type="checkbox"
                          checked={!!formProp[key]}
                          onChange={(e) => setFormProp({ ...formProp, [key]: e.target.checked })}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">Patta Status</label>
                        <select value={formProp.patta_status} onChange={(e) => setFormProp({ ...formProp, patta_status: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500">
                          <option value="Available">Available</option><option value="Not Available">Not Available</option><option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-zinc-400 mb-1">EC Status</label>
                        <select value={formProp.ec_status} onChange={(e) => setFormProp({ ...formProp, ec_status: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500">
                          <option value="Available">Available</option><option value="Not Available">Not Available</option><option value="Not Provided">Not Provided</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Description / Details</label>
                      <textarea
                        rows="3"
                        value={formProp.description}
                        onChange={(e) => setFormProp({ ...formProp, description: e.target.value })}
                        className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-6 font-bold pt-2 text-white">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formProp.published} onChange={(e) => setFormProp({ ...formProp, published: e.target.checked })} className="accent-amber-500" /> Published on Website
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formProp.featured} onChange={(e) => setFormProp({ ...formProp, featured: e.target.checked })} className="accent-amber-500" /> Mark Featured
                      </label>
                    </div>
                  </div>
                )}

                {/* Form Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button type="button" onClick={() => setFormStep(s => s - 1)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">
                      Previous Step
                    </button>
                  ) : <div />}

                  {formStep < 7 ? (
                    <button type="button" onClick={() => setFormStep(s => s + 1)} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase">
                      Next Step
                    </button>
                  ) : (
                    <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5">
                      <Save size={14} /> Save Property
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* LAND MULTI-STEP FORM */}
            {modalType === 'land_form' && (
              <form onSubmit={handleSaveLand} className="space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Land & Plots Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formLand.id ? 'Edit Land Plot' : 'Add New Residential Land Plot'}
                  </h3>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none text-[11px] font-bold uppercase">
                  {['1. Basic', '2. Location', '3. Plot Size', '4. Price & Approval', '5. Media & Save'].map((label, idx) => (
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

                {formStep === 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Land ID (Auto)</label>
                      <input type="text" value={formLand.land_id || 'LAND-001'} onChange={(e) => setFormLand({ ...formLand, land_id: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 font-bold text-amber-400 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Land Title *</label>
                      <input type="text" placeholder="DTCP Approved Plot in Poonamallee" value={formLand.title} onChange={(e) => setFormLand({ ...formLand, title: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" required />
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Location *</label>
                      <select value={formLand.location || serviceAreaOptions[0]} onChange={(e) => setFormLand({ ...formLand, location: e.target.value, area: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500">
                        {serviceAreaOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-400 mb-1">Google Maps URL</label>
                      <input type="url" placeholder="https://maps.google.com/?q=..." value={formLand.maps_url} onChange={(e) => setFormLand({ ...formLand, maps_url: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Plot Area (sq.ft)</label>
                      <input type="text" value={formLand.plot_area} onChange={(e) => setFormLand({ ...formLand, plot_area: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" required />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Dimensions (e.g. 30x40)</label>
                      <input type="text" value={formLand.frontage} onChange={(e) => setFormLand({ ...formLand, frontage: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Total Price (e.g. ₹32 Lakhs)</label>
                      <input type="text" value={formLand.total_price} onChange={(e) => setFormLand({ ...formLand, total_price: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-amber-400 rounded-xl px-3 py-2 font-extrabold focus:outline-none" required />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Approval Status</label>
                      <select value={formLand.approval_status} onChange={(e) => setFormLand({ ...formLand, approval_status: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500">
                        <option value="DTCP Approved">DTCP Approved</option>
                        <option value="CMDA Approved">CMDA Approved</option>
                        <option value="Panchayat Approved">Panchayat Approved</option>
                        <option value="Not Provided">Not Provided</option>
                      </select>
                    </div>
                  </div>
                )}

                {formStep === 5 && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Select Multiple Plot Gallery Images</label>
                      <input type="file" multiple accept="image/*" onChange={(e) => setSelectedImageFiles(Array.from(e.target.files))} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block font-bold text-zinc-400 mb-1">Description</label>
                      <textarea rows="3" value={formLand.description} onChange={(e) => setFormLand({ ...formLand, description: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  {formStep > 1 ? (
                    <button type="button" onClick={() => setFormStep(s => s - 1)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">Previous</button>
                  ) : <div />}

                  {formStep < 5 ? (
                    <button type="button" onClick={() => setFormStep(s => s + 1)} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase">Next Step</button>
                  ) : (
                    <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5">
                      <Save size={14} /> Save Land Plot
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* PROJECT MULTI-STEP FORM */}
            {modalType === 'project_form' && (
              <form onSubmit={handleSaveProject} className="space-y-6">
                <div className="border-b border-zinc-800 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Construction Project Form</span>
                  <h3 className="text-lg font-black text-white">
                    {formProj.id ? 'Edit Construction Project' : 'Add New Construction Project'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Project ID (Auto)</label>
                    <input type="text" value={formProj.project_id || 'PROJ-001'} onChange={(e) => setFormProj({ ...formProj, project_id: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 font-bold text-amber-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Project Name *</label>
                    <input type="text" placeholder="Poonamallee Villa Project" value={formProj.name} onChange={(e) => setFormProj({ ...formProj, name: e.target.value, title: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" required />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Location *</label>
                    <select value={formProj.location || serviceAreaOptions[0]} onChange={(e) => setFormProj({ ...formProj, location: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500">
                      {serviceAreaOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-400 mb-1">Project Status</label>
                    <select value={formProj.status} onChange={(e) => setFormProj({ ...formProj, status: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500">
                      <option value="Completed">Completed</option>
                      <option value="Under Construction">Under Construction</option>
                      <option value="Planning">Planning</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-400 mb-1">Google Maps Location URL</label>
                    <input type="url" placeholder="https://maps.google.com/?q=..." value={formProj.maps_url} onChange={(e) => setFormProj({ ...formProj, maps_url: e.target.value })} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-zinc-400 mb-1">Select Categorized Construction Images</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => setSelectedImageFiles(Array.from(e.target.files))} className="w-full bg-[#09090b] border border-zinc-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalType(null)} className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs uppercase">Cancel</button>
                  <button type="submit" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md flex items-center gap-1.5">
                    <Save size={14} /> Save Construction Project
                  </button>
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
