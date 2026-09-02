import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, ExternalLink, MessageCircle, Phone, HardHat, CheckCircle2, Search } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';
import { handlePhoneCall, getWhatsAppUrl } from '../utils/phoneUtils.js';

gsap.registerPlugin(ScrollTrigger);

const filterTabs = ['All Projects', 'Completed', 'Under Construction', 'Sold Out'];

const progressMilestones = [
  { step: '01', title: 'PLANNING', desc: 'Blueprint 2D/3D design & approval documents.' },
  { step: '02', title: 'STRUCTURE', desc: 'Deep column footing & RCC frame structure.' },
  { step: '03', title: 'WALLS & MASONRY', desc: 'Red brick wall construction & plastering.' },
  { step: '04', title: 'FINISHING', desc: 'Flooring tiles, doors & painting fitout.' },
  { step: '05', title: 'KEY HANDOVER', desc: 'Inspection clearance & happy key handover.' }
];

const Projects = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const headerRef = useRef(null);
  const timelineBoxRef = useRef(null);
  const filterPillsRef = useRef(null);
  const trackWrapperRef = useRef(null);
  const trackRef = useRef(null);
  const ctaBtnRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All Projects');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

  // View All Projects Full Screen Modal state
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalFilter, setModalFilter] = useState('All Projects');

  const { projects, settings, loading } = useSiteData();
  const safeProjects = (Array.isArray(projects) ? projects : []).filter(p => p.published !== 0);

  const filteredProjects = safeProjects.filter((item) => {
    if (activeFilter === 'All Projects') return true;
    return item.status === activeFilter;
  });

  // First 10 items
  const first10Projects = filteredProjects.slice(0, 10);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (selectedProject || isViewAllOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject, isViewAllOpen]);

  const filteredModalProjects = safeProjects.filter((item) => {
    const matchesStatus = modalFilter === 'All Projects' || item.status === modalFilter;
    const name = (item.name || item.title || '').toLowerCase();
    const loc = (item.location || item.area || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || loc.includes(query);
    return matchesStatus && matchesSearch;
  });

  // Responsive Scroll Engine (Desktop Pinning & Sequential Retrieval vs Mobile Manual Horizontal Scroll)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const header = headerRef.current;
    const timelineBox = timelineBoxRef.current;
    const filterPills = filterPillsRef.current;
    const track = trackRef.current;
    const trackWrapper = trackWrapperRef.current;
    const ctaBtn = ctaBtnRef.current;

    if (!section || !pinContainer || !track || !trackWrapper) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinned Timeline Progression & Sequential Cards Retrieval
    mm.add('(min-width: 769px)', () => {
      const cards = Array.from(track.children);
      const totalCards = cards.length;

      const getScrollAmount = () => {
        const overflow = track.scrollWidth - trackWrapper.clientWidth;
        return Math.max(0, overflow + 80);
      };

      // Initial State: Hidden
      if (header) gsap.set(header, { opacity: 0, y: 35 });
      if (timelineBox) gsap.set(timelineBox, { opacity: 0, y: 25 });
      if (filterPills) gsap.set(filterPills, { opacity: 0, y: 20 });
      if (ctaBtn) gsap.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 });
      cards.forEach((card) => {
        gsap.set(card, { opacity: 0, scale: 0.85, y: 40 });
      });

      const scrollAmount = getScrollAmount();
      // If scrollAmount > 0 (cards overflow screen width), pin dynamically proportional to overflow width
      // If scrollAmount === 0 (empty card or cards fit screen), crisp smooth entrance pin (800px)
      // Expanded scroll distance and slow scrub so TIMELINE STORYLINE glides deliberately and calmly
      const scrollDistance = scrollAmount > 0
        ? Math.max(3400, Math.floor(scrollAmount * 2.2 + totalCards * 340))
        : 2600;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: `+=${scrollDistance}`,
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress < 0.05) {
              setActiveStep(0);
              setActiveCardIndex(0);
            } else if (self.progress <= 0.65) {
              // Gentle, slow paced progression through all 5 timeline milestones
              const timelineProgress = Math.min(1, Math.max(0, (self.progress - 0.05) / (0.65 - 0.05)));
              const stepIdx = Math.min(4, Math.floor(timelineProgress * 5));
              setActiveStep(stepIdx);
              setActiveCardIndex(0);
            } else {
              setActiveStep(4);
              const cardProgress = Math.min(1, Math.max(0, (self.progress - 0.65) / (0.94 - 0.65)));
              const currentIdx = Math.min(totalCards - 1, Math.floor(cardProgress * totalCards));
              setActiveCardIndex(currentIdx);
            }
          },
        },
      });

      // 0. Ensure all cards and elements are strictly locked hidden at time 0 of timeline
      tl.set(cards, { opacity: 0, scale: 0.85, y: 40 }, 0);
      if (header) tl.set(header, { opacity: 0, y: 35 }, 0);
      if (timelineBox) tl.set(timelineBox, { opacity: 0, y: 25 }, 0);
      if (filterPills) tl.set(filterPills, { opacity: 0, y: 20 }, 0);
      if (ctaBtn) tl.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 }, 0);

      // STEP 1: Heading
      if (header) {
        tl.to(
          header,
          { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' },
          0
        );
      }

      // STEP 2: Timeline Storyline box & Filter Pills
      if (timelineBox) {
        tl.to(
          timelineBox,
          { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' },
          0.03
        );
      }

      if (filterPills) {
        tl.to(
          filterPills,
          { opacity: 1, y: 0, duration: 0.05, ease: 'power2.out' },
          0.04
        );
      }

      // STEP 3 & 4: Cards retrieved sequentially
      const cardStartProgress = 0.65;
      const cardEndProgress = 0.94;
      const cardSpan = cardEndProgress - cardStartProgress;
      const stepDuration = cardSpan / totalCards;

      tl.to(
        track,
        {
          x: () => -getScrollAmount(),
          duration: cardSpan,
          ease: 'none',
        },
        cardStartProgress
      );

      cards.forEach((card, idx) => {
        const cardEntry = cardStartProgress + idx * stepDuration;
        tl.to(
          card,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: stepDuration * 0.85,
            ease: 'power2.out',
          },
          cardEntry
        );
      });

      // STEP 5: CTA button
      if (ctaBtn) {
        tl.to(
          ctaBtn,
          { opacity: 1, y: 0, scale: 1, duration: 0.06, ease: 'back.out(1.4)' },
          0.92
        );
      }

      const refreshTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

      return () => clearTimeout(refreshTimeout);
    });

    // 2. MOBILE: Simple Section View with Manual Horizontal Touch Scroll + Auto-Advancing Storyline Highlight
    mm.add('(max-width: 768px)', () => {
      if (header) gsap.set(header, { clearProps: 'all' });
      if (timelineBox) gsap.set(timelineBox, { clearProps: 'all' });
      if (filterPills) gsap.set(filterPills, { clearProps: 'all' });
      if (ctaBtn) gsap.set(ctaBtn, { clearProps: 'all' });
      if (track) gsap.set(track, { clearProps: 'all' });
      if (track?.children) {
        gsap.set(Array.from(track.children), { clearProps: 'all' });
      }

      // Infinite auto-cycle highlight across 5 milestones on mobile with relaxed slow pacing
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 5);
      }, 2800);

      return () => clearInterval(interval);
    });

    return () => mm.revert();
  }, [activeFilter, first10Projects.length]);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openProjectModal = async (project) => {
    setSelectedProject(project);
    try {
      const res = await fetch(`/api/projects/${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProjectDetails(data.project);
      }
    } catch (e) {
      console.error('Error fetching project detail:', e);
    }
  };

  const closeModal = () => {
    setSelectedProject(null);
    setSelectedProjectDetails(null);
    setIsLightboxOpen(false);
  };

  return (
    <section ref={sectionRef} id="projects" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center gap-2 sm:gap-3 py-10 sm:py-20 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[650px] h-[550px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mb-1.5 sm:mb-2">
          {/* Section Heading Story */}
          <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-1.5 sm:mb-2">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                SEE HOW IT <span className="text-gold-gradient">TAKES SHAPE</span>
              </h2>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-1 shadow-sm shadow-amber-500/50"></div>
            <p className="text-zinc-300 text-[11px] sm:text-xs mt-1 font-medium leading-relaxed">
              Real construction progress stories of completed individual homes and ongoing contract construction sites.
            </p>
          </div>

          {/* Construction Timeline Bar */}
          <div ref={timelineBoxRef} className="mb-2 sm:mb-2.5 bg-[#121216]/85 backdrop-blur-xl p-2 sm:p-2.5 rounded-2xl border border-amber-500/30 shadow-2xl perspective-1200">
            <div className="text-center mb-1.5 flex items-center justify-between px-1">
              <span className="text-[9.5px] font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">TIMELINE STORYLINE</span>
              <h3 className="text-xs font-extrabold text-white hidden sm:block">5-Stage Structural Lifecycle</h3>
              <span className="text-[10.5px] font-mono text-amber-400 font-bold">
                {activeCardIndex > 0
                  ? `✓ 5-Stage Storyline Complete • Site #${activeCardIndex + 1}`
                  : `Step ${activeStep + 1} of 5: ${progressMilestones[activeStep].title}`}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative sm:preserve-3d">
              {progressMilestones.map((m, idx) => {
                const isActive = activeStep === idx;
                const isPast = activeStep > idx;

                return (
                  <div
                    key={m.step}
                    className={`text-center p-1.5 sm:p-2 rounded-xl border transition-all duration-300 sm:preserve-3d ${isActive
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-[1.02]'
                        : isPast
                          ? 'bg-[#18181c]/80 border-amber-500/30 opacity-90'
                          : 'bg-[#141418]/60 border-white/10 opacity-70'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-black text-[9px] sm:text-[10px] mx-auto mb-0.5 transition-all shadow-sm ${isActive
                          ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/40'
                          : isPast
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-white/5 text-zinc-400 border border-white/10'
                        }`}
                    >
                      {m.step}
                    </div>
                    <div
                      className={`text-[8.5px] sm:text-[10.5px] font-black uppercase transition-colors truncate ${isActive ? 'text-amber-300' : 'text-white'
                        }`}
                    >
                      {m.title}
                    </div>
                    <div className="text-[8.5px] sm:text-[9.5px] text-zinc-400 mt-0.5 line-clamp-1 hidden sm:block">
                      {m.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Pills */}
          <div ref={filterPillsRef} className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold transition-all duration-300 ${activeFilter === tab
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 scale-105'
                    : 'bg-[#121216]/90 text-zinc-300 hover:bg-[#18181c] border border-white/10 hover:border-amber-500/30'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* HORIZONTAL CARDS TRACK: Desktop Pinned Scroll / Mobile Manual X-Axis Touch Scroll */}
        <div ref={trackWrapperRef} className="w-full touch-carousel overflow-x-auto sm:overflow-hidden px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div
            ref={trackRef}
            className={`py-1.5 sm:py-2 select-none perspective-1200 will-change-transform ${first10Projects.length === 0 ? 'w-full flex justify-center' : 'flex gap-3 sm:gap-5 w-max'}`}
          >
            {loading && first10Projects.length === 0 ? (
              <div className="flex gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4 justify-center">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="w-[250px] md:w-[270px] h-[340px] rounded-2xl bg-[#18181b]/70 border border-white/5 animate-pulse flex flex-col p-4 justify-between">
                    <div className="w-full h-40 rounded-xl bg-zinc-800/60 animate-pulse" />
                    <div className="space-y-2 mt-4">
                      <div className="w-3/4 h-4 rounded bg-zinc-800/80 animate-pulse" />
                      <div className="w-1/2 h-3 rounded bg-zinc-800/50 animate-pulse" />
                    </div>
                    <div className="w-full h-8 rounded-xl bg-zinc-800/40 animate-pulse mt-4" />
                  </div>
                ))}
              </div>
            ) : first10Projects.length === 0 ? (
              <div className="w-full max-w-xl mx-auto py-10 px-6 rounded-3xl bg-[#18181b]/90 border border-zinc-800 text-center backdrop-blur-md shadow-2xl my-2 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                  <HardHat size={28} />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider mb-1.5">
                  No Construction Projects Added Yet
                </h3>
                <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                  No construction project records found for this category. New projects added in the Admin Portal will automatically appear here.
                </p>
              </div>
            ) : (
              first10Projects.map((item, idx) => {
                const isActive = activeCardIndex === idx;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => openProjectModal(item)}
                    className={`w-[60vw] max-w-[225px] sm:w-[250px] md:w-[270px] shrink-0 gold-specular-card rounded-xl sm:rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 sm:tilt-3d relative sm:preserve-3d ${isActive ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'border-white/10'
                      }`}
                  >
                    <div className="specular-glare" />

                    <div className="sm:preserve-3d relative z-10">
                      {/* Compact Image Container */}
                      <div className="relative h-32 sm:h-36 md:h-40 w-full overflow-hidden bg-black border-b border-white/10">
                        <img
                          src={item.cover_image || item.image || '/house/completed-house.jpg'}
                          alt={item.name || item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        <div
                          className={`absolute top-2 right-2 text-[9px] sm:text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase shadow-md sm:translate-z-30 ${item.status === 'Completed'
                              ? 'bg-green-500/90 text-white'
                              : item.status === 'Under Construction'
                                ? 'bg-amber-500/90 text-black'
                                : 'bg-purple-900/90 text-white'
                            }`}
                        >
                          {item.status}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-2.5 sm:p-3 sm:preserve-3d">
                        <h3 className="font-extrabold text-xs sm:text-sm text-white truncate mb-0.5 group-hover:text-amber-300 transition-colors sm:translate-z-20">
                          {item.name || item.title}
                        </h3>
                        <p className="flex items-center gap-1 text-zinc-400 text-[10px] sm:text-[11px] font-semibold sm:translate-z-20">
                          <MapPin size={11} className="text-amber-400" /> {item.location || item.area || ''}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 sm:p-3 pt-0 flex items-center justify-between relative z-10 sm:translate-z-20">
                      <span className="text-[10px] sm:text-[10.5px] font-bold text-amber-400">{item.project_type || 'Individual House'}</span>
                      <button
                        type="button"
                        className="bg-white/10 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-600 text-white group-hover:text-black text-[9.5px] sm:text-[10.5px] font-extrabold px-2 sm:px-2.5 py-1 rounded-lg transition-all shadow-md"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* View All Button */}
        {filteredProjects.length > 0 && (
          <div ref={ctaBtnRef} className="text-center mt-2 sm:mt-3 relative z-10">
            <button
              onClick={() => setIsViewAllOpen(true)}
              className="magnetic-btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-7 py-2 rounded-xl text-xs sm:text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 border border-amber-300/40"
            >
              View All Projects
            </button>
          </div>
        )}
      </div>

      {/* FULL SCREEN MODAL FORM FOR VIEW ALL PROJECTS */}
      {isViewAllOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col overflow-hidden animate-fadeIn">
          {/* Top Sticky Header */}
          <div className="p-4 sm:p-6 bg-[#121216] border-b border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span className="text-amber-400">All Construction</span> Projects ({filteredModalProjects.length})
              </h2>
              <button
                onClick={() => setIsViewAllOpen(false)}
                className="p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white sm:hidden"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar & Filter Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search project name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex bg-[#18181c] p-1 rounded-xl border border-white/10 overflow-x-auto">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setModalFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${modalFilter === tab ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsViewAllOpen(false)}
                className="hidden sm:flex p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white shrink-0"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
            {filteredModalProjects.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <p className="text-lg font-bold">No projects match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredModalProjects.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openProjectModal(item)}
                    className="gold-specular-card rounded-2xl overflow-hidden shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:-translate-y-1 relative"
                  >
                    <div className="specular-glare" />

                    <div className="relative z-10">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black border-b border-white/10">
                        <img
                          src={item.cover_image || item.image || '/house/completed-house.jpg'}
                          alt={item.name || item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        <div
                          className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-md ${item.status === 'Completed'
                              ? 'bg-green-500/90 text-white'
                              : item.status === 'Under Construction'
                                ? 'bg-amber-500/90 text-black'
                                : 'bg-purple-900/90 text-white'
                            }`}
                        >
                          {item.status}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-extrabold text-sm text-white truncate mb-1 group-hover:text-amber-300">
                          {item.name || item.title}
                        </h3>
                        <p className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
                          <MapPin size={12} className="text-amber-400" /> {item.location || item.area || ''}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between relative z-10">
                      <span className="text-[11px] font-mono text-amber-400">{item.project_type || 'Individual House'}</span>
                      <button className="bg-white/10 group-hover:bg-amber-500 text-white group-hover:text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL ESTATE BUYER APPLICATION FULL SCREEN SHEET FOR PROJECT */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col overflow-y-auto animate-fadeIn">

          {/* Top Sticky Header */}
          <div className="sticky top-0 z-30 bg-[#121216]/95 backdrop-blur-xl border-b border-amber-500/30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
            <button
              onClick={closeModal}
              className="flex items-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-full font-black text-xs transition-all"
            >
              ← Back to Projects
            </button>

            <div className="text-center hidden md:block">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">CONSTRUCTION SITE SHEET</span>
              <h3 className="text-sm font-extrabold text-white truncate max-w-md">{selectedProject.name || selectedProject.title}</h3>
            </div>

            <button
              onClick={closeModal}
              className="p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Full Screen Buyer Application Body */}
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">

            {/* Image Container with Thumbnails */}
            {(() => {
              const imageList = selectedProjectDetails?.images && selectedProjectDetails.images.length > 0
                ? selectedProjectDetails.images.map(img => img.image_url)
                : [selectedProject.cover_image || selectedProject.image || '/house/completed-house.jpg'];

              return (
                <div className="bg-[#121216] p-4 rounded-3xl border border-white/10 shadow-xl space-y-3">
                  <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                    <img
                      src={selectedProject.cover_image || imageList[0]}
                      alt={selectedProject.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#09090b]/90 border border-amber-500/30 text-amber-400 text-xs font-black px-3 py-1 rounded-full uppercase">
                      {selectedProject.status}
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex items-center justify-between gap-3 text-xs font-bold pt-1">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {imageList.map((imgUrl, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden w-12 h-12 bg-black shrink-0 border border-white/10">
                          <img src={imgUrl} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                    >
                      📷 {imageList.length} Photos — View All
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ORDERED BUYER APPLICATION SECTIONS (1 TO 7) */}
            <div className="bg-[#121216] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8">

              {/* 1. BASIC DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">1</span>
                  <span>Basic Details</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Project Name</span>
                    <span className="text-white font-black">{selectedProject.name || selectedProject.title}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Type</span>
                    <span className="text-white font-black">{selectedProject.project_type || 'Contract House Construction'}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Status</span>
                    <span className="text-green-400 font-black">{selectedProject.status}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Target Timeline</span>
                    <span className="text-white font-black">{selectedProject.completion_date || 'On Schedule'}</span>
                  </div>
                </div>
              </div>

              {/* 2. LOCATION DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">2</span>
                  <span>Location Details</span>
                </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#18181c] p-4 rounded-2xl border border-white/5">
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-1.5">
                          <MapPin size={16} className="text-amber-400" /> {selectedProject.location || selectedProject.area || ''}
                        </div>
                        <p className="text-xs text-zinc-400 font-medium mt-1">Contract house site located in prime residential layout.</p>
                      </div>

                      <a
                        href={selectedProject.maps_url || (selectedProject.location || selectedProject.area ? `https://maps.google.com/?q=${encodeURIComponent(selectedProject.location || selectedProject.area)}` : '#contact')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 shadow-md shrink-0"
                  >
                    Open Location on Google Maps <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* 3. PRICE & COST ESTIMATION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">3</span>
                  <span>Price & Construction Budget</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#18181c] p-4 rounded-xl border border-amber-500/30">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Contract Estimation</span>
                    <span className="text-xl font-black text-amber-400">Custom Sq.Ft Budgeting</span>
                  </div>
                  <div className="bg-[#18181c] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Material Standard</span>
                    <span className="text-sm font-black text-white">First Class Red Brick & TMT</span>
                  </div>
                  <div className="bg-[#18181c] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Stage Payment</span>
                    <span className="text-xs font-black text-green-400">Transparent Stage Installments</span>
                  </div>
                </div>
              </div>

              {/* 4. SPECIFICATIONS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">4</span>
                  <span>Specifications</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Built-up Area</span>
                    <span className="text-white font-black">{selectedProject.builtup_area || '1500 Sq.Ft'}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Floors</span>
                    <span className="text-white font-black">{selectedProject.floors ? `${selectedProject.floors} Floors` : 'G+1 Structure'}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Structure</span>
                    <span className="text-white font-black">RCC Column Footing</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Timeline</span>
                    <span className="text-white font-black">On Schedule</span>
                  </div>
                </div>
              </div>

              {/* 5. CONSTRUCTION & PROGRESS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">5</span>
                  <span>Construction Details & Progress</span>
                </div>

                <div className="bg-[#18181c] p-4 rounded-2xl border border-white/5 space-y-3">
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {selectedProject.overview || selectedProject.description || 'Full contract house construction executed with RCC column foundation, red brick masonry walls, waterproof flat concrete roof, and premium fitting finishes.'}
                  </p>
                  {selectedProject.construction_details && (
                    <div className="pt-2 border-t border-white/10 text-xs text-amber-300 font-medium">
                      {selectedProject.construction_details}
                    </div>
                  )}
                </div>
              </div>

              {/* 6. FEATURES & AMENITIES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">6</span>
                  <span>Features & Architectural Standards</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                  {['2D/3D Architectural Plan', 'Vasthu Compliant Layout', 'Structural Engineer Supervision', 'Underground Septic Tank', 'Overhead Water Storage', 'Compound Wall & Gate'].map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 bg-[#18181c] p-3 rounded-xl border border-white/5 text-zinc-200">
                      <span className="text-amber-400 font-black">✓</span> {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. VERIFIED LEGAL DOCUMENTS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">7</span>
                  <span>Verified Legal Documents & Approvals</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-3 rounded-xl text-green-300">
                    <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                    <div>
                      <div className="font-black">Municipal & Plan Approval</div>
                      <div className="text-[10px] text-green-400/80 font-medium">100% legal building plan approval</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-3 rounded-xl text-green-300">
                    <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                    <div>
                      <div className="font-black">Structural Quality Clearance</div>
                      <div className="text-[10px] text-green-400/80 font-medium">Quality engineer certified foundation</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Dynamic Action Footer Bar */}
            <div className="sticky bottom-4 z-30 bg-[#121216]/95 backdrop-blur-xl border border-amber-500/40 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black text-white">{settings?.company_name || ''} {settings?.company_subtitle || ''}</div>
                <div className="text-[10px] text-zinc-400 font-semibold">Contract Construction Site Inspection • Poonamallee</div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <a
                  href={settings?.phone ? `tel:+91${settings.phone.replace(/[^0-9]/g, '')}` : '#contact'}
                  onClick={(e) => handlePhoneCall(e, settings?.phone)}
                  className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-extrabold px-6 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-md text-center"
                >
                  <Phone size={15} /> {settings?.phone ? `Call +91 ${settings.phone}` : 'Contact Support'}
                </a>
                <a
                  href={getWhatsAppUrl(settings?.whatsapp_number || settings?.phone, `Hi, I'm interested in knowing more about the ${selectedProject.name || selectedProject.title}.`)}
                  target={settings?.whatsapp_number || settings?.phone ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-center"
                >
                  <MessageCircle size={15} /> WhatsApp Inquiry
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL SCREEN LIGHTBOX MODAL FOR PROJECT GALLERY */}
      {isLightboxOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn">
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              Construction Site Photo Gallery ({selectedProjectDetails?.images?.length || 1} Photos)
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center py-6">
            <img
              src={selectedProject.cover_image || selectedProject.image || '/house/completed-house.jpg'}
              alt="High-Res Site Preview"
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto justify-center pb-2">
            {(selectedProjectDetails?.images && selectedProjectDetails.images.length > 0
              ? selectedProjectDetails.images.map(img => img.image_url)
              : [selectedProject.cover_image || selectedProject.image || '/house/completed-house.jpg']
            ).map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt="Thumb"
                className="w-16 h-16 object-cover rounded-xl border-2 border-amber-400 shadow-lg cursor-pointer"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Projects;
