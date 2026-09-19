import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Maximize, X, Home } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';

gsap.registerPlugin(ScrollTrigger);

const getStatusBadgeStyle = (status) => {
  const s = (status || 'Available').toLowerCase();
  if (s.includes('under construction') || s.includes('construction')) {
    return 'bg-amber-500/90 text-black border border-amber-400/80 shadow-amber-500/30';
  }
  if (s.includes('sold')) {
    return 'bg-red-500/90 text-white border border-red-400/80 shadow-red-500/30';
  }
  if (s.includes('negotiation')) {
    return 'bg-blue-500/90 text-white border border-blue-400/80 shadow-blue-500/30';
  }
  return 'bg-emerald-600/90 text-white border border-emerald-400/80 shadow-emerald-500/30';
};

const FeaturedProperties = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const headerRef = useRef(null);
  const filterRef = useRef(null);
  const trackWrapperRef = useRef(null);
  const trackRef = useRef(null);
  const ctaBtnRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Houses for Sale');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const { properties, land, loading } = useSiteData();

  const safeProperties = (Array.isArray(properties) ? properties : []).filter(p => p.published !== 0);
  const safeLand = (Array.isArray(land) ? land : []).filter(l => l.published !== 0);

  const displayedItems = activeTab === 'Houses for Sale' ? safeProperties : safeLand;
  const first10Items = displayedItems.slice(0, 10);

  const handleOpenDetail = (item) => {
    const isLand = activeTab === 'Lands for Sale' || item.land_type || item.total_price;
    navigate('/property-details', { state: { item, type: isLand ? 'land' : 'property' } });
  };

  // Responsive Scroll Engine (Desktop Pinning vs Mobile Touch Scroll)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const header = headerRef.current;
    const filter = filterRef.current;
    const track = trackRef.current;
    const trackWrapper = trackWrapperRef.current;
    const ctaBtn = ctaBtnRef.current;

    if (!section || !pinContainer || !track || !trackWrapper) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinned Horizontal Sequential Retrieval on Scroll
    mm.add('(min-width: 769px)', () => {
      const getScrollAmount = () => {
        if (!track || !trackWrapper) return 0;
        const overflow = track.scrollWidth - trackWrapper.clientWidth;
        return Math.max(0, overflow + 80);
      };

      if (header) gsap.set(header, { opacity: 0, y: 35 });
      if (filter) gsap.set(filter, { opacity: 0, y: 25 });
      if (trackWrapper) gsap.set(trackWrapper, { opacity: 0, y: 30, scale: 0.98 });
      if (ctaBtn) gsap.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 });

      const scrollDistance = 2200;

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
            const cardCount = track.children.length || 1;
            if (self.progress < 0.18) {
              setActiveCardIndex(0);
            } else {
              const cardProgress = Math.min(1, Math.max(0, (self.progress - 0.18) / 0.72));
              const currentIdx = Math.min(cardCount - 1, Math.floor(cardProgress * cardCount));
              setActiveCardIndex(currentIdx);
            }
          },
        },
      });

      if (header) tl.set(header, { opacity: 0, y: 35 }, 0);
      if (filter) tl.set(filter, { opacity: 0, y: 25 }, 0);
      if (trackWrapper) tl.set(trackWrapper, { opacity: 0, y: 30, scale: 0.98 }, 0);
      if (ctaBtn) tl.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 }, 0);

      if (header) {
        tl.to(header, { opacity: 1, y: 0, duration: 0.10, ease: 'power2.out' }, 0);
      }

      if (filter) {
        tl.to(filter, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.10);
      }

      const cardStartProgress = 0.18;
      const cardEndProgress = 0.90;
      const cardSpan = cardEndProgress - cardStartProgress;

      if (trackWrapper) {
        tl.to(
          trackWrapper,
          { opacity: 1, y: 0, scale: 1, duration: 0.15, ease: 'power2.out' },
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
          0.90
        );
      }

      const refreshTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

      return () => clearTimeout(refreshTimeout);
    });

    // 2. MOBILE: Simple Section View with Manual Horizontal Touch Scroll
    mm.add('(max-width: 768px)', () => {
      if (header) gsap.set(header, { clearProps: 'all' });
      if (filter) gsap.set(filter, { clearProps: 'all' });
      if (trackWrapper) gsap.set(trackWrapper, { clearProps: 'all' });
      if (ctaBtn) gsap.set(ctaBtn, { clearProps: 'all' });
      if (track) gsap.set(track, { clearProps: 'all' });
    });

    return () => mm.revert();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveCardIndex(0);
    if (trackRef.current) {
      gsap.set(trackRef.current, { x: 0 });
    }
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  };

  return (
    <section ref={sectionRef} id="properties" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center pt-6 pb-3 sm:py-20 relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10 w-full mb-2 sm:mb-5">
          {/* Section Header & Tab Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
            <div ref={headerRef}>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Featured Properties
                </h2>
              </div>
              <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full mt-1 sm:mt-1.5 shadow-sm shadow-amber-500/50"></div>
            </div>

            {/* Tab Filters */}
            <div ref={filterRef} className="flex bg-[#121216]/90 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={() => handleTabChange('Houses for Sale')}
                className={`px-3 sm:px-5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-300 ${activeTab === 'Houses for Sale'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Houses ({safeProperties.length})
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('Lands for Sale')}
                className={`px-3 sm:px-5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-300 ${activeTab === 'Lands for Sale'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Lands ({safeLand.length})
              </button>
            </div>
          </div>
        </div>

        {/* HORIZONTAL CARDS TRACK */}
        <div ref={trackWrapperRef} className="w-full touch-carousel overflow-x-auto sm:overflow-hidden px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div
            ref={trackRef}
            className={`py-2 sm:py-3 select-none perspective-1200 will-change-transform ${first10Items.length === 0 ? 'w-full flex justify-center' : 'flex gap-3 sm:gap-6 w-max'}`}
          >
            {first10Items.length === 0 ? (
              <div className="w-full max-w-xl mx-auto py-8 px-6 rounded-3xl bg-[#18181b]/90 border border-zinc-800 text-center backdrop-blur-md shadow-2xl my-2 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                  {activeTab === 'Lands for Sale' ? <MapPin size={24} /> : <Home size={24} />}
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                  No {activeTab === 'Lands for Sale' ? 'Land Plots' : 'Houses'} Listed Yet
                </h3>
                <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                  No {activeTab === 'Lands for Sale' ? 'residential land plot' : 'individual house property'} records found. Properties added in Admin Portal will automatically appear here.
                </p>
              </div>
            ) : (
              first10Items.map((item, idx) => {
                const isLandItem = activeTab === 'Lands for Sale' || item.land_type || item.total_price;
                const priceVal = item.price || item.total_price || 'Price on Request';
                const typeLabel = item.type || item.land_type || (isLandItem ? 'Residential Plot' : 'Individual House');
                const sizeLabel = item.builtup_area || (item.plot_area ? `${item.plot_area} ${item.plot_area_unit || 'sq.ft'}` : 'N/A');
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
                        {item.image && item.image !== '/house/completed-house.jpg' && !item.image.includes('logo') ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br from-[#1c1c20] to-[#0a0a0c] flex items-center justify-center ${isLandItem ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isLandItem ? (
                              <MapPin size={38} className="text-emerald-400/80" />
                            ) : (
                              <Home size={38} className="text-amber-400/80" />
                            )}
                          </div>
                        )}
                        <div className={`absolute top-2 left-2 backdrop-blur-md text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md sm:translate-z-30 ${getStatusBadgeStyle(item.status)}`}>
                          {item.status || 'Available'}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-2.5 sm:p-4 sm:preserve-3d">
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold mb-1 sm:translate-z-20">
                          <span className="text-amber-400 font-black uppercase text-[9.5px] sm:text-[10px] tracking-wider truncate max-w-[120px]">{typeLabel}</span>
                          <span className="flex items-center gap-1 text-zinc-400 font-semibold shrink-0 text-[9.5px] sm:text-[10px]">
                            <MapPin size={11} className="text-amber-400" /> {item.location || item.area || ''}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-xs sm:text-sm text-white truncate mb-1 sm:mb-2 group-hover:text-amber-300 transition-colors sm:translate-z-20">
                          {item.title}
                        </h3>

                        {/* Specs Row */}
                        <div className="flex items-center gap-2 text-[9.5px] sm:text-[11px] text-zinc-300 font-medium border-t border-white/10 pt-1.5 sm:pt-2 sm:translate-z-20">
                          {item.bedrooms && item.bedrooms !== 'N/A' && (
                            <div className="flex items-center gap-1">
                              <BedDouble size={12} className="text-amber-400" />
                              <span>{item.bedrooms} BHK</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Maximize size={12} className="text-amber-400" />
                            <span>{sizeLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 sm:p-4 pt-0 flex items-center justify-between relative z-10 sm:translate-z-20">
                      <div className="text-[11px] sm:text-base font-black text-amber-400">{priceVal}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                        className="bg-white/10 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-600 text-white group-hover:text-black text-[9.5px] sm:text-[11px] font-extrabold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all shadow-md cursor-pointer"
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
        {displayedItems.length > 0 && (
          <div ref={ctaBtnRef} className="text-center mt-3 sm:mt-5 relative z-10">
            <button
              onClick={() => navigate('/all-properties')}
              className="magnetic-btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-8 py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 border border-amber-300/40 cursor-pointer"
            >
              View All Properties & Lands
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProperties;
