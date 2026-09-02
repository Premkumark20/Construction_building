import React, { useState, useEffect, useRef } from 'react';
import { MapPin, BedDouble, Maximize, ExternalLink, X, MessageCircle, Phone, FileCheck, Search } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';
import { handlePhoneCall } from '../utils/phoneUtils.js';

gsap.registerPlugin(ScrollTrigger);

const FeaturedProperties = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const headerRef = useRef(null);
  const filterRef = useRef(null);
  const trackWrapperRef = useRef(null);
  const trackRef = useRef(null);
  const ctaBtnRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Houses for Sale');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [activeModalImage, setActiveModalImage] = useState(null);

  // View All Full Screen Modal state
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewAllFilter, setViewAllFilter] = useState('All');

  const { properties, land, settings, loading } = useSiteData();

  const safeProperties = (Array.isArray(properties) ? properties : []).filter(p => p.published !== 0);
  const safeLand = (Array.isArray(land) ? land : []).filter(l => l.published !== 0);

  const displayedItems = activeTab === 'Houses for Sale' ? safeProperties : safeLand;
  // First 10 items
  const first10Items = displayedItems.slice(0, 10);

  const allCombinedItems = [
    ...safeProperties.map(p => ({ ...p, itemCategory: 'House' })),
    ...safeLand.map(l => ({ ...l, itemCategory: 'Land' }))
  ];

  const filteredViewAllItems = allCombinedItems.filter(item => {
    const matchesCategory =
      viewAllFilter === 'All' ||
      (viewAllFilter === 'Houses' && item.itemCategory === 'House') ||
      (viewAllFilter === 'Lands' && item.itemCategory === 'Land');

    const title = (item.title || '').toLowerCase();
    const loc = (item.location || item.area || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || loc.includes(query);

    return matchesCategory && matchesSearch;
  });

  // Lock background scroll when modal is open
  useEffect(() => {
    if (selectedItem || isViewAllOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem, isViewAllOpen]);

  // Responsive Scroll Engine (Desktop Pinning & Sequential Retrieval vs Mobile Manual Horizontal Scroll)
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
      const cards = Array.from(track.children);
      const totalCards = cards.length;

      const getScrollAmount = () => {
        const overflow = track.scrollWidth - trackWrapper.clientWidth;
        return Math.max(0, overflow + 80);
      };

      // Initial State: Hidden
      if (header) gsap.set(header, { opacity: 0, y: 35 });
      if (filter) gsap.set(filter, { opacity: 0, y: 25 });
      if (ctaBtn) gsap.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 });
      cards.forEach((card) => {
        gsap.set(card, { opacity: 0, scale: 0.85, y: 40 });
      });

      const scrollAmount = getScrollAmount();
      // If scrollAmount > 0 (cards overflow screen width), pin dynamically proportional to overflow width
      // If scrollAmount === 0 (empty card or cards fit screen), crisp smooth entrance pin (600px)
      const scrollDistance = scrollAmount > 0
        ? Math.max(1800, Math.floor(scrollAmount * 1.4 + totalCards * 160))
        : 1000;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: `+=${scrollDistance}`,
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress < 0.18) {
              setActiveCardIndex(0);
            } else {
              const cardProgress = Math.min(1, Math.max(0, (self.progress - 0.18) / 0.72));
              const currentIdx = Math.min(totalCards - 1, Math.floor(cardProgress * totalCards));
              setActiveCardIndex(currentIdx);
            }
          },
        },
      });

      // 0. Ensure all cards and elements are strictly locked hidden at time 0 of timeline
      tl.set(cards, { opacity: 0, scale: 0.85, y: 40 }, 0);
      if (header) tl.set(header, { opacity: 0, y: 35 }, 0);
      if (filter) tl.set(filter, { opacity: 0, y: 25 }, 0);
      if (ctaBtn) tl.set(ctaBtn, { opacity: 0, y: 25, scale: 0.95 }, 0);

      // STEP 1: Heading
      if (header) {
        tl.to(
          header,
          { opacity: 1, y: 0, duration: 0.10, ease: 'power2.out' },
          0
        );
      }

      // STEP 2: Filter tabs
      if (filter) {
        tl.to(
          filter,
          { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' },
          0.10
        );
      }

      // STEP 3: Cards retrieved sequentially one by one
      const cardStartProgress = 0.18;
      const cardEndProgress = 0.90;
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

      // STEP 4: Reveal Bottom CTA button
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
      if (ctaBtn) gsap.set(ctaBtn, { clearProps: 'all' });
      if (track) gsap.set(track, { clearProps: 'all' });
      if (track?.children) {
        gsap.set(Array.from(track.children), { clearProps: 'all' });
      }
    });

    return () => mm.revert();
  }, [activeTab, first10Items.length]);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openItemModal = async (item) => {
    setSelectedItem(item);
    setActiveModalImage(item.image || item.cover_image || '/house/completed-house.jpg');

    const isHouse = item.itemCategory === 'House' || item.bedrooms || item.builtup_area;
    const endpoint = isHouse ? `/api/properties/${item.id}` : `/api/land/${item.id}`;
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const detail = data.property || data.land;
        setSelectedItemDetails(detail);
        if (detail?.images && detail.images.length > 0) {
          const coverImg = detail.images.find(img => img.is_cover) || detail.images[0];
          setActiveModalImage(coverImg.image_url);
        }
      }
    } catch (e) {
      console.error('Error fetching detail:', e);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedItemDetails(null);
    setActiveModalImage(null);
    setIsLightboxOpen(false);
  };

  const getWhatsAppUrl = (item) => {
    const title = item.title || 'Property';
    const loc = item.location || item.area || 'Chennai';
    const phoneNum = (settings?.whatsapp_number || settings?.phone || '').replace(/[^0-9]/g, '');

    if (!phoneNum) return '#contact';

    const numWithCountry = phoneNum.length === 10 ? `91${phoneNum}` : phoneNum;
    const msg = `Hi, I'm interested in this property.\n\nProperty: ${title}\nLocation: ${loc}\n\nCould you please share more details?`;
    return `https://api.whatsapp.com/send/?phone=${numWithCountry}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;
  };

  return (
    <section ref={sectionRef} id="properties" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center py-10 sm:py-20 relative">
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
                onClick={() => setActiveTab('Houses for Sale')}
                className={`px-3 sm:px-5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all duration-300 ${activeTab === 'Houses for Sale'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Houses ({safeProperties.length})
              </button>
              <button
                onClick={() => setActiveTab('Lands for Sale')}
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

        {/* HORIZONTAL CARDS TRACK: Desktop Pinned Scroll / Mobile Manual X-Axis Touch Scroll */}
        <div ref={trackWrapperRef} className="w-full touch-carousel overflow-x-auto sm:overflow-hidden px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div
            ref={trackRef}
            className={`py-2 sm:py-3 select-none perspective-1200 will-change-transform ${first10Items.length === 0 ? 'w-full flex justify-center' : 'flex gap-3 sm:gap-6 w-max'}`}
          >
            {loading && first10Items.length === 0 ? (
              <div className="flex gap-4 sm:gap-6 w-full max-w-7xl mx-auto px-4 justify-center">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="w-[250px] md:w-[270px] h-[360px] rounded-2xl bg-[#18181b]/70 border border-white/5 animate-pulse flex flex-col p-4 justify-between">
                    <div className="w-full h-44 rounded-xl bg-zinc-800/60 animate-pulse" />
                    <div className="space-y-2 mt-4">
                      <div className="w-3/4 h-4 rounded bg-zinc-800/80 animate-pulse" />
                      <div className="w-1/2 h-3 rounded bg-zinc-800/50 animate-pulse" />
                    </div>
                    <div className="w-full h-10 rounded-xl bg-zinc-800/40 animate-pulse mt-4" />
                  </div>
                ))}
              </div>
            ) : first10Items.length === 0 ? (
              <div className="w-full max-w-xl mx-auto py-10 px-6 rounded-3xl bg-[#18181b]/90 border border-zinc-800 text-center backdrop-blur-md shadow-2xl my-2 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                  <MapPin size={28} />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider mb-1.5">
                  No {activeTab === 'Houses for Sale' ? 'House Properties' : 'Land Plots'} Listed Yet
                </h3>
                <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                  No {activeTab === 'Houses for Sale' ? 'house' : 'land plot'} records found. New entries added in the Admin Portal will automatically appear here.
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
                    onClick={() => openItemModal(item)}
                    className={`w-[60vw] max-w-[225px] sm:w-[250px] md:w-[270px] shrink-0 gold-specular-card rounded-xl sm:rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 sm:tilt-3d relative sm:preserve-3d ${isActive ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'border-white/10'
                      }`}
                  >
                    <div className="specular-glare" />

                    <div className="sm:preserve-3d relative z-10">
                      {/* Compact Image Container */}
                      <div className="relative h-32 sm:h-36 md:h-40 w-full overflow-hidden bg-black border-b border-white/10">
                        <img
                          src={item.image || '/house/completed-house.jpg'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-[#09090b]/90 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md sm:translate-z-30">
                          {typeLabel}
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
                        className="bg-white/10 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-600 text-white group-hover:text-black text-[9.5px] sm:text-[11px] font-extrabold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all shadow-md"
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

        {/* View All Button (Reveals at end of scroll) */}
        {displayedItems.length > 0 && (
          <div ref={ctaBtnRef} className="text-center mt-5 relative z-10">
            <button
              onClick={() => setIsViewAllOpen(true)}
              className="magnetic-btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-8 py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 border border-amber-300/40"
            >
              View All Properties & Lands
            </button>
          </div>
        )}
      </div>

      {/* FULL SCREEN MODAL FORM FOR VIEW ALL PROPERTIES */}
      {isViewAllOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col overflow-hidden animate-fadeIn">
          {/* Top Sticky Header */}
          <div className="p-4 sm:p-6 bg-[#121216] border-b border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span className="text-amber-400">All Properties</span> & Lands ({filteredViewAllItems.length})
              </h2>
              <button
                onClick={() => setIsViewAllOpen(false)}
                className="p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white sm:hidden"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar & Category Filters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by title or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex bg-[#18181c] p-1 rounded-xl border border-white/10">
                {['All', 'Houses', 'Lands'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setViewAllFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${viewAllFilter === f ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    {f}
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

          {/* Full Screen Scrollable Grid Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
            {filteredViewAllItems.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <p className="text-lg font-bold">No properties match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredViewAllItems.map((item) => (
                  <div
                    key={`${item.itemCategory}-${item.id}`}
                    onClick={() => openItemModal(item)}
                    className="gold-specular-card rounded-2xl overflow-hidden shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:-translate-y-1 relative"
                  >
                    <div className="specular-glare" />

                    <div className="relative z-10">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black border-b border-white/10">
                        <img
                          src={item.image || '/house/completed-house.jpg'}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-[#09090b]/90 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-md">
                          {item.type || item.land_type || item.itemCategory}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-amber-400 font-black uppercase text-[10px]">{item.itemCategory}</span>
                          <span className="flex items-center gap-1 text-zinc-400 text-[10px]">
                            <MapPin size={12} className="text-amber-400" /> {item.location || item.area || ''}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-white truncate mb-2 group-hover:text-amber-300">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between relative z-10">
                      <div className="text-base font-black text-amber-400">
                        {item.price || item.total_price || 'Price on Request'}
                      </div>
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

      {/* REAL ESTATE BUYER APPLICATION FULL SCREEN SHEET */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col overflow-y-auto animate-fadeIn">

          {/* Top Portal Navigation Header */}
          <div className="sticky top-0 z-30 bg-[#121216]/95 backdrop-blur-xl border-b border-amber-500/30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xl">
            <button
              onClick={closeModal}
              className="flex items-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-full font-black text-xs transition-all"
            >
              ← Back to Properties
            </button>

            <div className="text-center hidden md:block">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">REAL ESTATE BUYER PORTAL</span>
              <h3 className="text-sm font-extrabold text-white truncate max-w-md">{selectedItem.title}</h3>
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
              const imageList = selectedItemDetails?.images && selectedItemDetails.images.length > 0
                ? selectedItemDetails.images.map(img => img.image_url)
                : [selectedItem.image || '/house/completed-house.jpg'];
              const currentImgIdx = imageList.indexOf(activeModalImage) >= 0 ? imageList.indexOf(activeModalImage) : 0;

              return (
                <div className="bg-[#121216] p-4 rounded-3xl border border-white/10 shadow-xl space-y-3">
                  <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                    <img
                      src={activeModalImage || imageList[0]}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#09090b]/90 border border-amber-500/30 text-amber-400 text-xs font-black px-3 py-1 rounded-full uppercase">
                      {selectedItem.type || selectedItem.land_type || 'Verified Listing'}
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex items-center justify-between gap-3 text-xs font-bold pt-1">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {imageList.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt="Thumb"
                          onClick={() => setActiveModalImage(imgUrl)}
                          className={`w-12 h-12 object-cover rounded-lg border-2 cursor-pointer transition-all ${(activeModalImage === imgUrl || (!activeModalImage && i === 0))
                              ? 'border-amber-400 scale-105 shadow-md'
                              : 'border-white/10 opacity-60 hover:opacity-100'
                            }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-extrabold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5 shrink-0 transition-all shadow-md"
                    >
                      📷 {currentImgIdx + 1} / {imageList.length} Photos — View All
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
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Property Title</span>
                    <span className="text-white font-black">{selectedItem.title}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Category / Type</span>
                    <span className="text-white font-black">{selectedItem.type || selectedItem.land_type || selectedItem.itemCategory}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Property ID</span>
                    <span className="text-amber-400 font-mono font-black">{selectedItem.property_id || selectedItem.land_id || 'PROP-001'}</span>
                  </div>
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Possession Status</span>
                    <span className="text-green-400 font-black">Ready for Handover</span>
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
                      <MapPin size={16} className="text-amber-400" /> {selectedItem.location || selectedItem.area}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium mt-1">Prime residential zone with excellent connectivity.</p>
                  </div>

                  <a
                    href={selectedItem.maps_url || (selectedItem.location || selectedItem.area ? `https://maps.google.com/?q=${encodeURIComponent(selectedItem.location || selectedItem.area)}` : '#contact')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 shadow-md shrink-0"
                  >
                    Open Location on Google Maps <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* 3. PRICE & COSTING */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">3</span>
                  <span>Price & Financials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#18181c] p-4 rounded-xl border border-amber-500/30">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Total Agreed Price</span>
                    <span className="text-2xl font-black text-amber-400">{selectedItem.price || selectedItem.total_price || 'Price on Request'}</span>
                  </div>
                  <div className="bg-[#18181c] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Price per Sq.Ft</span>
                    <span className="text-sm font-black text-white">₹4,833 / sq.ft (Approx)</span>
                  </div>
                  <div className="bg-[#18181c] p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Bank Loan Support</span>
                    <span className="text-xs font-black text-green-400">SBI • HDFC • LIC Approved</span>
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
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Plot Area</span>
                    <span className="text-white font-black">{selectedItem.plot_size || (selectedItem.plot_area ? `${selectedItem.plot_area} ${selectedItem.plot_area_unit || 'sq.ft'}` : '1200 Sq.Ft')}</span>
                  </div>
                  {selectedItem.builtup_area && (
                    <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Built-up Area</span>
                      <span className="text-white font-black">{selectedItem.builtup_area}</span>
                    </div>
                  )}
                  {selectedItem.bedrooms && (
                    <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Bedrooms / BHK</span>
                      <span className="text-white font-black">{selectedItem.bedrooms} BHK</span>
                    </div>
                  )}
                  <div className="bg-[#18181c] p-3.5 rounded-xl border border-white/5">
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-1">Road Width</span>
                    <span className="text-white font-black">30 Feet Tar Road</span>
                  </div>
                </div>
              </div>

              {/* 5. CONSTRUCTION QUALITY */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">5</span>
                  <span>Construction Quality</span>
                </div>

                <div className="bg-[#18181c] p-4 rounded-2xl border border-white/5 space-y-2 text-xs text-zinc-300 leading-relaxed font-medium">
                  <p>• RCC column footing foundation designed for multi-story load capacity.</p>
                  <p>• Premium red brick masonry walls with smooth inner plastering & Asian Royale paint finish.</p>
                  <p>• Teakwood main door frame, vitrified floor tiles & branded Parryware/Jaguar sanitaryware.</p>
                </div>
              </div>

              {/* 6. FEATURES & AMENITIES */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">6</span>
                  <span>Features & Amenities</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold">
                  {['24/7 Water Supply', 'Vasthu Compliant', 'Individual EB Meter', 'Covered Car Parking', 'Compound Wall Built', 'Clear Title Deeds'].map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 bg-[#18181c] p-3 rounded-xl border border-white/5 text-zinc-200">
                      <span className="text-amber-400 font-black">✓</span> {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. VERIFIED DOCUMENTS & APPROVALS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px]">7</span>
                  <span>Verified Legal Documents</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold">
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-3 rounded-xl text-green-300">
                    <FileCheck size={18} className="text-green-400 shrink-0" />
                    <div>
                      <div className="font-black">DTCP / CMDA Approved Layout</div>
                      <div className="text-[10px] text-green-400/80 font-medium">Clear municipal approval status</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-3 rounded-xl text-green-300">
                    <FileCheck size={18} className="text-green-400 shrink-0" />
                    <div>
                      <div className="font-black">Patta & EC Clear Title</div>
                      <div className="text-[10px] text-green-400/80 font-medium">100% legal verification cleared</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Dynamic Contact Action Bar */}
            <div className="sticky bottom-4 z-30 bg-[#121216]/95 backdrop-blur-xl border border-amber-500/40 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black text-white">{settings?.company_name || ''} {settings?.company_subtitle || ''}</div>
                <div className="text-[10px] text-zinc-400 font-semibold">Direct Builder Consultation • Poonamallee</div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <a
                  href={settings?.phone ? `tel:+91${settings.phone.replace(/[^0-9]/g, '')}` : '#contact'}
                  onClick={(e) => handlePhoneCall(e, settings?.phone)}
                  className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-400 font-extrabold px-6 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-md"
                >
                  <Phone size={15} /> {settings?.phone ? `Call +91 ${settings.phone}` : 'Contact Support'}
                </a>
                <a
                  href={getWhatsAppUrl(selectedItem)}
                  target={settings?.whatsapp_number || settings?.phone ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-6 py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <MessageCircle size={15} /> WhatsApp Inquiry
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL SCREEN LIGHTBOX MODAL FOR PHOTO GALLERY */}
      {isLightboxOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn">
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-4">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              Full Property Photo Gallery ({selectedItemDetails?.images?.length || 1} Images)
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
              src={activeModalImage || selectedItem.image || '/house/completed-house.jpg'}
              alt="High-Res Property Preview"
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto justify-center pb-2">
            {(selectedItemDetails?.images && selectedItemDetails.images.length > 0
              ? selectedItemDetails.images.map(img => img.image_url)
              : [selectedItem.image || '/house/completed-house.jpg']
            ).map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt="Thumb"
                onClick={() => setActiveModalImage(imgUrl)}
                className={`w-16 h-16 object-cover rounded-xl border-2 cursor-pointer transition-all ${activeModalImage === imgUrl ? 'border-amber-400 scale-105 shadow-lg' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default FeaturedProperties;
