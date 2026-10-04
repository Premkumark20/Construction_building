import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, HardHat, Home } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';

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
  const navigate = useNavigate();
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

  const { projects, loading } = useSiteData();
  const safeProjects = (Array.isArray(projects) ? projects : []).filter(p => p.published !== 0);

  const filteredProjects = safeProjects.filter((item) => {
    if (activeFilter === 'All Projects') return true;
    return item.status === activeFilter;
  });

  const first10Projects = filteredProjects.slice(0, 10);

  const handleOpenDetail = (item) => {
    navigate('/project-details', { state: { item } });
  };

  const handleFilterChange = (tab) => {
    setActiveFilter(tab);
    setActiveCardIndex(0);
    if (trackRef.current) {
      gsap.set(trackRef.current, { x: 0 });
    }
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  };

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
      const getScrollAmount = () => {
        if (!track || !trackWrapper) return 0;
        const overflow = track.scrollWidth - trackWrapper.clientWidth;
        return Math.max(0, overflow + 80);
      };

      if (header) gsap.set(header, { opacity: 0, y: 35 });
      if (timelineBox) gsap.set(timelineBox, { opacity: 0, y: 25 });
      if (filterPills) gsap.set(filterPills, { opacity: 0, y: 20 });
      if (trackWrapper) gsap.set(trackWrapper, { opacity: 0, y: 30, scale: 0.98 });
      if (ctaBtn) gsap.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 });

      const scrollDistance = 2600;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: `+=${scrollDistance}`,
          scrub: 1.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const cardCount = track.children.length || 1;
            if (self.progress < 0.10) {
              setActiveStep(0);
              setActiveCardIndex(0);
            } else if (self.progress <= 0.65) {
              const timelineProgress = Math.min(1, Math.max(0, (self.progress - 0.10) / (0.65 - 0.10)));
              const stepIdx = Math.min(4, Math.floor(timelineProgress * 5));
              setActiveStep(stepIdx);
              setActiveCardIndex(0);
            } else {
              setActiveStep(4);
              const cardProgress = Math.min(1, Math.max(0, (self.progress - 0.65) / (0.94 - 0.65)));
              const currentIdx = Math.min(cardCount - 1, Math.floor(cardProgress * cardCount));
              setActiveCardIndex(currentIdx);
            }
          },
        },
      });

      if (header) tl.set(header, { opacity: 0, y: 35 }, 0);
      if (timelineBox) tl.set(timelineBox, { opacity: 0, y: 25 }, 0);
      if (filterPills) tl.set(filterPills, { opacity: 0, y: 20 }, 0);
      if (trackWrapper) tl.set(trackWrapper, { opacity: 0, y: 30, scale: 0.98 }, 0);
      if (ctaBtn) tl.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 }, 0);

      if (header) {
        tl.to(header, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0);
      }

      if (timelineBox) {
        tl.to(timelineBox, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.04);
      }

      if (filterPills) {
        tl.to(filterPills, { opacity: 1, y: 0, duration: 0.06, ease: 'power2.out' }, 0.08);
      }

      const cardStartProgress = 0.65;
      const cardEndProgress = 0.94;
      const cardSpan = cardEndProgress - cardStartProgress;

      if (trackWrapper) {
        tl.to(
          trackWrapper,
          { opacity: 1, y: 0, scale: 1, duration: 0.12, ease: 'power2.out' },
          cardStartProgress
        );
      }

      tl.to(
        track,
        {
          x: () => -getScrollAmount(),
          duration: cardSpan,
          ease: 'none',
        },
        cardStartProgress
      );

      if (ctaBtn) {
        tl.to(
          ctaBtn,
          { opacity: 1, y: 0, scale: 1, duration: 0.06, ease: 'back.out(1.4)' },
          0.94
        );
      }

      const refreshTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

      return () => clearTimeout(refreshTimeout);
    });

    // 2. MOBILE: Simple Section View with Auto-Advancing Storyline Highlight
    mm.add('(max-width: 768px)', () => {
      if (header) gsap.set(header, { clearProps: 'all' });
      if (timelineBox) gsap.set(timelineBox, { clearProps: 'all' });
      if (filterPills) gsap.set(filterPills, { clearProps: 'all' });
      if (trackWrapper) gsap.set(trackWrapper, { clearProps: 'all' });
      if (ctaBtn) gsap.set(ctaBtn, { clearProps: 'all' });
      if (track) gsap.set(track, { clearProps: 'all' });

      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 5);
      }, 4500);

      return () => clearInterval(interval);
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="projects" className="relative z-10 w-full bg-transparent text-white overflow-hidden scroll-mt-16 sm:scroll-mt-20">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center gap-2 sm:gap-3 pt-6 pb-3 sm:py-20 relative">
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
                Step {activeStep + 1} of 5: {progressMilestones[activeStep].title}
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
                onClick={() => handleFilterChange(tab)}
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

        {/* HORIZONTAL CARDS TRACK */}
        <div ref={trackWrapperRef} className="w-full touch-carousel overflow-x-auto sm:overflow-hidden px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div
            ref={trackRef}
            className={`py-1.5 sm:py-2 select-none perspective-1200 will-change-transform ${first10Projects.length === 0 ? 'w-full flex justify-center' : 'flex gap-3 sm:gap-5 w-max'}`}
          >
            {first10Projects.length === 0 ? (
              loading ? (
                <div className="flex gap-3 sm:gap-5 w-max py-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="w-[300px] sm:w-[360px] h-[380px] rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
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
              )
            ) : (
              first10Projects.map((item, idx) => {
                const isActive = activeCardIndex === idx;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => handleOpenDetail(item)}
                    className={`w-[60vw] max-w-[225px] sm:w-[250px] md:w-[270px] shrink-0 gold-specular-card rounded-xl sm:rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 sm:tilt-3d relative sm:preserve-3d ${isActive ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'border-white/10'
                      }`}
                  >
                    <div className="specular-glare" />

                    <div className="sm:preserve-3d relative z-10">
                      {/* Compact Image Container */}
                      <div className="relative h-32 sm:h-36 md:h-40 w-full overflow-hidden bg-black border-b border-white/10 flex items-center justify-center">
                        {(item.cover_image && item.cover_image !== '/house/completed-house.jpg' && !item.cover_image.includes('logo')) || (item.image && item.image !== '/house/completed-house.jpg' && !item.image.includes('logo')) ? (
                          <img
                            src={item.cover_image || item.image}
                            alt={item.name || item.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1c1c20] to-[#0a0a0c] flex items-center justify-center text-amber-400">
                            <Home size={38} className="text-amber-400/80" />
                          </div>
                        )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className="bg-white/10 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-600 text-white group-hover:text-black text-[9.5px] sm:text-[10.5px] font-extrabold px-2 sm:px-2.5 py-1 rounded-lg transition-all shadow-md cursor-pointer"
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
              onClick={() => navigate('/all-projects')}
              className="magnetic-btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-7 py-2 rounded-xl text-xs sm:text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 border border-amber-300/40 cursor-pointer"
            >
              View All Projects
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
