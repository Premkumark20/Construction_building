import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * 3D Landscape Coverflow Track with responsive visible images:
 * - 7 visible images on Desktop (offsets -3, -2, -1, 0, 1, 2, 3), bleeding in/out at screen edges
 * - 5 visible images on Mobile (offsets -2, -1, 0, 1, 2), bleeding in/out at screen edges
 * - Continuous smooth auto-scroll with 2.0s hold in center
 * - Compact widescreen landscape cards, clean images with no text/overlays
 */
const CoverflowTrack = ({ items, direction = 'left', onSelectImage }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Normalize items to ensure at least 14 elements for seamless continuous circular wrap-around
  const normalizedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    let list = items.map((it, idx) => ({ ...it, uniqueKey: `${it.id || 'item'}-${idx}` }));
    while (list.length < 14) {
      list = [
        ...list,
        ...items.map((it, idx) => ({
          ...it,
          uniqueKey: `${it.id || 'item'}-dup-${list.length}-${idx}`
        }))
      ];
    }
    return list;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll loop: stops 2.0s in center, then smoothly transitions to next card over 800ms
  useEffect(() => {
    if (isPaused || normalizedItems.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        if (direction === 'left') {
          return (prev + 1) % normalizedItems.length;
        } else {
          return (prev - 1 + normalizedItems.length) % normalizedItems.length;
        }
      });
    }, 2800); // 2000ms stop in center + 800ms smooth slide transition

    return () => clearInterval(timer);
  }, [isPaused, direction, normalizedItems.length]);

  if (normalizedItems.length === 0) return null;

  const total = normalizedItems.length;

  return (
    <div
      className="relative w-full h-[110px] sm:h-[150px] md:h-[215px] lg:h-[245px] xl:h-[270px] flex items-center justify-center overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Perspective Stage spanning full viewport width so edge cards bleed smoothly */}
      <div className="relative w-full h-full flex items-center justify-center">
        {normalizedItems.map((item, idx) => {
          // Calculate shortest circular offset distance from activeIndex
          let offset = idx - activeIndex;
          while (offset > total / 2) offset -= total;
          while (offset < -total / 2) offset += total;

          // 7 images for desktop, 5 images for mobile
          const maxVisibleOffset = isMobile ? 2 : 3;
          const isVisible = Math.abs(offset) <= maxVisibleOffset;
          const isCenter = offset === 0;

          // Position calculations with viewport units: exactly 5 images on mobile and 7 on desktop
          let xTranslate = '0px';
          let scale = 0.7;
          let zTranslate = '-20px';
          let zIndex = 1;
          let opacity = 0;
          let filter = 'brightness(0.6)';
          let boxShadow = '0 8px 20px rgba(0, 0, 0, 0.5)';
          let borderColor = 'rgba(255, 255, 255, 0.08)';

          if (isCenter) {
            // Position 0: Elevated center card, prominent gold specular glow
            xTranslate = '0px';
            scale = isMobile ? 1.06 : 1.08;
            zTranslate = '45px';
            zIndex = 35;
            opacity = 1;
            filter = 'brightness(1.05)';
            borderColor = 'rgba(245, 158, 11, 0.75)';
            boxShadow = '0 20px 45px -10px rgba(0, 0, 0, 0.9), 0 0 32px rgba(245, 158, 11, 0.35)';
          } else if (offset === 1) {
            // Position +1: Inner Right
            xTranslate = isMobile ? '20vw' : '13.5vw';
            scale = isMobile ? 0.88 : 0.91;
            zTranslate = '20px';
            zIndex = 25;
            opacity = 0.95;
            filter = 'brightness(0.90)';
            borderColor = 'rgba(255, 255, 255, 0.18)';
            boxShadow = '0 14px 28px rgba(0, 0, 0, 0.7)';
          } else if (offset === -1) {
            // Position -1: Inner Left
            xTranslate = isMobile ? '-20vw' : '-13.5vw';
            scale = isMobile ? 0.88 : 0.91;
            zTranslate = '20px';
            zIndex = 25;
            opacity = 0.95;
            filter = 'brightness(0.90)';
            borderColor = 'rgba(255, 255, 255, 0.18)';
            boxShadow = '0 14px 28px rgba(0, 0, 0, 0.7)';
          } else if (offset === 2) {
            // Position +2: Outer Right on Mobile / Middle Right on Desktop
            xTranslate = isMobile ? '38vw' : '27vw';
            scale = isMobile ? 0.75 : 0.78;
            zTranslate = '5px';
            zIndex = 15;
            opacity = isMobile ? 0.80 : 0.88;
            filter = 'brightness(0.78)';
            borderColor = 'rgba(255, 255, 255, 0.12)';
            boxShadow = '0 10px 24px rgba(0, 0, 0, 0.6)';
          } else if (offset === -2) {
            // Position -2: Outer Left on Mobile / Middle Left on Desktop
            xTranslate = isMobile ? '-38vw' : '-27vw';
            scale = isMobile ? 0.75 : 0.78;
            zTranslate = '5px';
            zIndex = 15;
            opacity = isMobile ? 0.80 : 0.88;
            filter = 'brightness(0.78)';
            borderColor = 'rgba(255, 255, 255, 0.12)';
            boxShadow = '0 10px 24px rgba(0, 0, 0, 0.6)';
          } else if (offset === 3 && !isMobile) {
            // Position +3: Desktop Outer Right (clearly visible on right edge)
            xTranslate = '39.5vw';
            scale = 0.65;
            zTranslate = '-8px';
            zIndex = 8;
            opacity = 0.75;
            filter = 'brightness(0.70)';
            borderColor = 'rgba(255, 255, 255, 0.10)';
            boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5)';
          } else if (offset === -3 && !isMobile) {
            // Position -3: Desktop Outer Left (clearly visible on left edge)
            xTranslate = '-39.5vw';
            scale = 0.65;
            zTranslate = '-8px';
            zIndex = 8;
            opacity = 0.75;
            filter = 'brightness(0.70)';
            borderColor = 'rgba(255, 255, 255, 0.10)';
            boxShadow = '0 6px 16px rgba(0, 0, 0, 0.5)';
          } else {
            // Offscreen buffer cards (smoothly enter/exit from offscreen)
            xTranslate = offset < 0 ? '-58vw' : '58vw';
            scale = 0.55;
            zTranslate = '-25px';
            zIndex = 1;
            opacity = 0;
          }

          const transform = `translate3d(calc(-50% + ${xTranslate}), -50%, ${zTranslate}) scale(${scale})`;

          return (
            <div
              key={item.uniqueKey}
              onClick={() => {
                if (isCenter) {
                  onSelectImage?.(item);
                } else if (isVisible) {
                  setActiveIndex(idx);
                }
              }}
              style={{
                transform,
                zIndex,
                opacity,
                filter,
                boxShadow,
                borderColor,
                transition: 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1), opacity 800ms cubic-bezier(0.22, 1, 0.36, 1), filter 800ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 800ms cubic-bezier(0.22, 1, 0.36, 1), border-color 800ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
              className={`absolute left-1/2 top-1/2 w-[125px] sm:w-[170px] md:w-[240px] lg:w-[290px] xl:w-[330px] h-[80px] sm:h-[110px] md:h-[155px] lg:h-[185px] xl:h-[210px] rounded-lg sm:rounded-2xl overflow-hidden bg-[#0e0e12] border cursor-pointer will-change-transform group ${
                !isVisible ? 'pointer-events-none' : ''
              }`}
            >
              {/* Pure image without eye icon, project showcase text, or location */}
              <img
                src={item.image}
                alt={item.title || 'Gallery Landscape Photo'}
                className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                draggable="false"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Gallery = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const { gallery, properties, land, projects, loading } = useSiteData();
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Compile unified image list dynamically from database
  const sourceItems = useMemo(() => {
    const dbGalleryItems = Array.isArray(gallery)
      ? gallery.filter(g => g.image).map(g => ({
          id: `gal-${g.id}`,
          image: g.image,
          title: 'Gallery Photo'
        }))
      : [];

    const dbPropItems = (Array.isArray(properties) ? properties : [])
      .filter(p => p.image && p.image !== '/house/completed-house.jpg' && !p.image.includes('logo'))
      .map(p => ({
        id: `prop-${p.id}`,
        image: p.image,
        title: p.title
      }));

    const dbLandItems = (Array.isArray(land) ? land : [])
      .filter(l => l.image && l.image !== '/house/completed-house.jpg' && !l.image.includes('logo'))
      .map(l => ({
        id: `land-${l.id}`,
        image: l.image,
        title: l.title
      }));

    const dbProjItems = (Array.isArray(projects) ? projects : [])
      .filter(pr => (pr.cover_image && pr.cover_image !== '/house/completed-house.jpg' && !pr.cover_image.includes('logo')) || (pr.image && pr.image !== '/house/completed-house.jpg' && !pr.image.includes('logo')))
      .map(pr => ({
        id: `proj-${pr.id}`,
        image: pr.cover_image || pr.image,
        title: pr.name || pr.title
      }));

    return [...dbGalleryItems, ...dbPropItems, ...dbLandItems, ...dbProjItems];
  }, [gallery, properties, land, projects]);

  // Split into Row 1 and Row 2 for dual opposite autoscroll
  const { row1Items, row2Items } = useMemo(() => {
    if (sourceItems.length === 0) return { row1Items: [], row2Items: [] };
    if (sourceItems.length <= 4) {
      return { row1Items: sourceItems, row2Items: sourceItems };
    }
    const r1 = sourceItems.filter((_, idx) => idx % 2 === 0);
    const r2 = sourceItems.filter((_, idx) => idx % 2 !== 0);
    return {
      row1Items: r1.length > 0 ? r1 : sourceItems,
      row2Items: r2.length > 0 ? r2 : sourceItems
    };
  }, [sourceItems]);

  // Pin section for smooth Y-axis scroll engagement on desktop (both with and without items)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    if (!section || !pinContainer) return;

    let mm = gsap.matchMedia();

    // Desktop only (>= 769px): Pinned on Y-axis
    mm.add('(min-width: 769px)', () => {
      ScrollTrigger.create({
        trigger: section,
        pin: pinContainer,
        start: 'top top',
        end: '+=2200', // Pinned for smooth Y-axis engagement on desktop
        pinSpacing: true,
        refreshPriority: 8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    });

    // Mobile view (< 769px): No pin section, scrolls naturally!

    requestAnimationFrame(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });

    return () => {
      mm.revert();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
  }, [sourceItems.length]);

  // Lock background main site scrolling and Lenis momentum scroll when Lightbox is open
  useEffect(() => {
    if (selectedPhoto) {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.stop();
      }
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const preventScroll = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      window.addEventListener('wheel', preventScroll, { passive: false });
      window.addEventListener('touchmove', preventScroll, { passive: false });

      return () => {
        if (typeof window !== 'undefined' && window.lenis) {
          window.lenis.start();
        }
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
      };
    }
  }, [selectedPhoto]);

  return (
    <section ref={sectionRef} id="gallery" className="relative z-10 w-full bg-transparent text-white overflow-hidden scroll-mt-16 sm:scroll-mt-20">
      {/* Scroll Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center items-center py-10 sm:py-20 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

        {/* Section Header: Consistent top spacing */}
        <div className="max-w-4xl mx-auto px-4 mb-3 sm:mb-6 relative z-10 w-full text-center shrink-0">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            EVERY HOME HAS A <span className="text-gold-gradient">STORY</span>
          </h2>
          <div className="w-14 sm:w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-1.5 shadow-sm shadow-amber-500/50" />
          <p className="text-zinc-400 text-[11px] sm:text-xs mt-1.5 font-medium max-w-lg mx-auto">
            Explore our completed homes, plot developments, and construction progress.
          </p>
        </div>

        {/* Content Area - Increased height image containers, minimal gap */}
        <div className="w-full relative z-10 flex flex-col justify-center space-y-2 sm:space-y-3">
          {sourceItems.length === 0 ? (
            loading ? (
              <div className="flex justify-center items-center gap-3 py-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="w-[240px] sm:w-[310px] h-[130px] sm:h-[160px] rounded-xl bg-zinc-900/60 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full max-w-xl mx-auto py-10 px-6 rounded-3xl bg-[#18181b]/90 border border-zinc-800 text-center backdrop-blur-md shadow-2xl my-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider mb-1.5">
                  No Gallery Photos Uploaded Yet
                </h3>
                <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto">
                  Photos uploaded in the Admin Portal (or added to properties and projects) will automatically showcase here in this 3D gallery.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-2 sm:space-y-3 w-full overflow-hidden">
              {/* TRACK 1: 7-Card/5-Card 3D Landscape Coverflow sliding Left (stops 2s in center) */}
              <div className="w-full">
                <CoverflowTrack
                  items={row1Items}
                  direction="left"
                  onSelectImage={(img) => setSelectedPhoto(img)}
                />
              </div>

              {/* TRACK 2: 7-Card/5-Card 3D Landscape Coverflow sliding Right (opposite direction, stops 2s in center) */}
              {row2Items.length > 0 && (
                <div className="w-full">
                  <CoverflowTrack
                    items={row2Items}
                    direction="right"
                    onSelectImage={(img) => setSelectedPhoto(img)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN SQUARE/RECTANGLE LIGHTBOX MODAL (Locked scroll, opaque backdrop, cannot scroll background) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-fadeIn cursor-pointer select-none overscroll-none"
          onClick={() => setSelectedPhoto(null)}
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="relative max-w-[90vw] max-h-[85vh] w-auto h-auto p-1.5 sm:p-2 bg-[#121216] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] flex items-center justify-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button floating top right of container */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-zinc-900 border border-amber-500/50 text-white hover:text-amber-400 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xl"
              title="Close Image"
            >
              <X size={16} />
            </button>

            {/* Tight Square / Rectangle Image View */}
            <img
              src={selectedPhoto.image}
              alt={selectedPhoto.title || 'Full View'}
              className="max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl select-none"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
