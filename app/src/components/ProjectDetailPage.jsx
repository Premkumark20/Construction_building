import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, ChevronLeft, X, CheckCircle2, Home, Sparkles, ShieldCheck, Hammer } from 'lucide-react';
import Navbar from './Navbar.jsx';
import { useSiteData } from '../hooks/useSiteData.jsx';

const ProjectDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, settings } = useSiteData();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Retrieve item from router state or fallback to first item in projects
  const passedItem = location.state?.item;
  const activeItem = passedItem || (projects && projects.length > 0 ? projects[0] : null);

  // Gallery images for project
  const rawImages = activeItem?.images && activeItem.images.length > 0
    ? activeItem.images.map(img => img.image_url)
    : [activeItem?.cover_image || activeItem?.image];
  const validImages = rawImages.filter(url => url && !url.includes('logo') && url !== '/house/completed-house.jpg');

  const [activeImage, setActiveImage] = useState(validImages[0] || activeItem?.cover_image || activeItem?.image || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState('');

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Lock body scroll when Lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  const handleOpenLightbox = (imgUrl) => {
    setLightboxImg(imgUrl || activeImage || activeItem?.cover_image);
    setIsLightboxOpen(true);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      setSubmitError('Name and phone number are required.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email || '',
          notes: `Inquiry for Project: ${activeItem?.name || activeItem?.title || 'Unknown'} - ${contactForm.message || ''}`
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', phone: '', email: '', message: '' });
      } else {
        setSubmitError('Failed to send inquiry. Please try calling directly.');
      }
    } catch (err) {
      setSubmitError('Network error. Please call or WhatsApp directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeItem) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Hammer size={48} className="text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black mb-2">Project Not Found</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md">The requested construction project record could not be loaded.</p>
          <button
            onClick={() => navigate('/#projects')}
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider"
          >
            ← Return to Projects
          </button>
        </div>
      </div>
    );
  }

  const nameDisplay = activeItem.name || activeItem.title || 'Construction Project';
  const typeDisplay = activeItem.project_type || 'Individual House Construction';
  const locationDisplay = activeItem.location || activeItem.area || 'Poonamallee, Chennai';
  const statusDisplay = activeItem.status || 'Under Construction';

  const phoneNum = settings?.phone || '7358266257';
  const waNum = settings?.whatsapp_number || phoneNum;

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10 space-y-8">
        
        {/* Top Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <button
            onClick={() => navigate('/#projects')}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-full font-bold text-xs transition-all w-fit cursor-pointer"
          >
            <ChevronLeft size={16} /> Back to Projects Showcase
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              statusDisplay === 'Completed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {statusDisplay}
            </span>
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest bg-zinc-900/80 px-3 py-1 rounded-full border border-white/10">
              {typeDisplay}
            </span>
          </div>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Image Gallery & Project Specifications (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Featured Image Card */}
            <div className="gold-specular-card bg-[#121216] p-3 sm:p-4 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden group">
              <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                {validImages.length > 0 ? (
                  <img
                    src={activeImage || validImages[0]}
                    alt={nameDisplay}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                    onClick={() => handleOpenLightbox(activeImage || validImages[0])}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1c1c20] to-[#0a0a0c] flex items-center justify-center text-amber-400">
                    <Home size={64} className="text-amber-400/80" />
                  </div>
                )}
                
                {validImages.length > 0 && (
                  <button
                    onClick={() => handleOpenLightbox(activeImage || validImages[0])}
                    className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white hover:text-amber-400 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    🔍 Click to Enlarge
                  </button>
                )}
              </div>

              {/* Thumbnails Row */}
              {validImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pt-3 scrollbar-none">
                  {validImages.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Project Photo ${idx + 1}`}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 cursor-pointer transition-all ${
                        activeImage === imgUrl ? 'border-amber-400 scale-105 shadow-lg' : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title & Project Highlights Card */}
            <div className="gold-specular-card bg-[#121216] p-6 sm:p-8 rounded-3xl border border-white/15 shadow-xl space-y-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <MapPin size={14} /> {locationDisplay}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  {nameDisplay}
                </h1>
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  {typeDisplay} • {statusDisplay} Project
                </div>
              </div>

              {/* Description & Overview */}
              {(activeItem.description || activeItem.details) && (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider">Project Overview & Specifications</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {activeItem.description || activeItem.details}
                  </p>
                </div>
              )}

              {/* Key Construction Features */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider">Construction Quality Assurance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-zinc-200">
                  <div className="flex items-center gap-2 bg-[#18181c] p-3 rounded-xl border border-white/10">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Structural Warranty & Superior Soil Testing</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#18181c] p-3 rounded-xl border border-white/10">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Premium Brand Bricks, Cement & TMT Steel</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#18181c] p-3 rounded-xl border border-white/10">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>On-Time Milestone Construction Delivery</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#18181c] p-3 rounded-xl border border-white/10">
                    <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                    <span>Complete Legal & Approval Documentation</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Direct Contact & Inquiry Form (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Quick Action Buttons */}
            <div className="gold-specular-card bg-[#121216] p-6 rounded-3xl border border-white/15 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" /> Consult With Builder
              </h3>

              <a
                href={`tel:${phoneNum}`}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Phone size={16} /> Call Builder ({phoneNum})
              </a>

              <a
                href={`https://wa.me/91${waNum}?text=${encodeURIComponent(`Hi SK Builders, I would like to inquire about project: ${nameDisplay} in ${locationDisplay}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <MessageSquare size={16} /> WhatsApp Inquiry
              </a>
            </div>

            {/* Project Inquiry Form */}
            <div className="gold-specular-card bg-[#121216] p-6 rounded-3xl border border-white/15 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Inquire About This Project
              </h3>

              {submitSuccess ? (
                <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-2xl text-emerald-300 text-xs font-bold text-center space-y-2">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                  <p>Inquiry sent! Our project management team will reach out to you.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  {submitError && (
                    <div className="bg-red-500/20 border border-red-500/40 p-3 rounded-xl text-red-300 text-xs font-bold text-center">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Enter full name"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Enter mobile number"
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-400 mb-1">Message (Optional)</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Inquire about construction budget, floor plan, or timeline..."
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 h-20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Project Inquiry'}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* FULLSCREEN SQUARE/RECTANGLE LIGHTBOX MODAL (Tight fit around image, background scroll locked, click backdrop to close) */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn cursor-pointer select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-auto h-auto p-1.5 sm:p-2 bg-[#121216] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button floating top right of container */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-zinc-900 border border-amber-500/50 text-white hover:text-amber-400 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xl"
              title="Close Image"
            >
              <X size={16} />
            </button>

            {/* Tight Square / Rectangle Image View */}
            <img
              src={lightboxImg || activeImage}
              alt="High-Res Project Preview"
              className="max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl select-none"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetailPage;
