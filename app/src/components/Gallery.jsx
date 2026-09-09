import React, { useEffect, useRef } from 'react';
import { MapPin, Home, HardHat, Award } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';

gsap.registerPlugin(ScrollTrigger);

const iconForCategory = (cat) => {
  if (cat === 'Completed Houses') return <Home size={14} className="text-amber-400" />;
  if (cat === 'Construction Work') return <HardHat size={14} className="text-amber-400" />;
  if (cat === 'Plot Layouts') return <MapPin size={14} className="text-amber-400" />;
  return <Award size={14} className="text-amber-400" />;
};

const Gallery = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);

  const { settings, gallery, properties, land, projects, loading } = useSiteData();

  // Unified Gallery Items compiled dynamically from database tables
  const dbGalleryItems = Array.isArray(gallery) ? gallery : [];
  const dbPropItems = (Array.isArray(properties) ? properties : [])
    .filter(p => p.image && p.image !== '/house/completed-house.jpg' && !p.image.includes('logo'))
    .map(p => ({
      id: `prop-${p.id}`,
      image: p.image,
      title: p.title,
      category: 'Completed Houses',
      location: p.location || p.area || ''
    }));
  const dbLandItems = (Array.isArray(land) ? land : [])
    .filter(l => l.image && l.image !== '/house/completed-house.jpg' && !l.image.includes('logo'))
    .map(l => ({
      id: `land-${l.id}`,
      image: l.image,
      title: l.title,
      category: 'Plot Layouts',
      location: l.location || l.area || ''
    }));
  const dbProjItems = (Array.isArray(projects) ? projects : [])
    .filter(pr => ((pr.cover_image && pr.cover_image !== '/house/completed-house.jpg' && !pr.cover_image.includes('logo')) || (pr.image && pr.image !== '/house/completed-house.jpg' && !pr.image.includes('logo'))))
    .map(pr => ({
      id: `proj-${pr.id}`,
      image: pr.cover_image || pr.image,
      title: pr.name || pr.title,
      category: 'Construction Work',
      location: pr.location || pr.area || ''
    }));

  const allItemsCombined = [...dbGalleryItems, ...dbPropItems, ...dbLandItems, ...dbProjItems];
  const sourceItems = allItemsCombined;

  // Split into Row 1 and Row 2
  let row1Items = sourceItems.filter((_, idx) => idx % 2 === 0);
  let row2Items = sourceItems.filter((_, idx) => idx % 2 !== 0);

  // When total images is 11 (or odd count >= 6), balance the rows so both rows have 6 images and auto-scroll together!
  if (sourceItems.length >= 6) {
    if (row1Items.length > row2Items.length) {
      const extraItem = row1Items[row1Items.length - 1];
      if (!row2Items.some(item => item.id === extraItem.id)) {
        row2Items = [...row2Items, extraItem];
      }
    } else if (row2Items.length > row1Items.length) {
      const extraItem = row2Items[row2Items.length - 1];
      if (!row1Items.some(item => item.id === extraItem.id)) {
        row1Items = [...row1Items, extraItem];
      }
    }
  }

  const finalRow1 = row1Items.length > 0 ? row1Items : sourceItems;
  const finalRow2 = row2Items.length > 0 ? row2Items : sourceItems;

  const isRow1Scroll = finalRow1.length > 5;
  const isRow2Scroll = finalRow2.length > 5;

  // Repeat sufficiently (at least 6 full sets) so there is NEVER an empty ending before or after
  const repeatCount1 = Math.max(6, Math.ceil(36 / (finalRow1.length || 1)));
  const repeatCount2 = Math.max(6, Math.ceil(36 / (finalRow2.length || 1)));

  const loopRow1 = isRow1Scroll ? Array.from({ length: repeatCount1 }, () => finalRow1).flat() : finalRow1;
  const loopRow2 = isRow2Scroll ? Array.from({ length: repeatCount2 }, () => finalRow2).flat() : finalRow2;

  // GSAP Pinning and Step-by-Step Continuous Loop (2s Hold at Center, No Ends Before or After)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const header = headerRef.current;
    const row1 = row1Ref.current;
    const row2 = row2Ref.current;
    if (!section) return;

    let ctx;

    const buildAnimation = () => {
      if (ctx) ctx.revert();

      ctx = gsap.context(() => {
        // 1. Heading ScrollTrigger Reveal
        if (header) {
          gsap.fromTo(
            header,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: header,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // 2. Desktop Pinning: Pin gallery section when it reaches top top
        const mm = gsap.matchMedia();

        mm.add('(min-width: 769px)', () => {
          if (!pinContainer) return;
          const st = ScrollTrigger.create({
            trigger: section,
            pin: pinContainer,
            start: 'top top',
            end: '+=2200',
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });

          return () => st.kill();
        });

        // 3. Step-by-Step Continuous Horizontal Animation (Hold 2s at Center, Infinite Edge-to-Edge Buffer)
        const isDesktop = window.innerWidth >= 640;
        const cardW = isDesktop ? 260 : 160;
        const gapW = isDesktop ? 24 : 16;
        const stepW = cardW + gapW;
        const screenCenterX = window.innerWidth / 2;

        // --- ROW 1: Slides Left, holds 2.0s at each center card ---
        if (isRow1Scroll && row1 && finalRow1.length > 0) {
          const N1 = finalRow1.length;
          // Center on Card M1 (start of Set 2) so 2 full sets extend to the left (no blank space before)
          const M1 = 2 * N1;
          const startX1 = screenCenterX - (M1 * stepW + cardW / 2);
          gsap.set(row1, { x: startX1 });

          const tl1 = gsap.timeline({ repeat: -1 });

          for (let i = 0; i < N1; i++) {
            // Hold for 2.0 seconds at the centered card
            tl1.to({}, { duration: 2.0 });
            // Slide smoothly to the next card in 0.7s
            tl1.to(row1, {
              x: startX1 - (i + 1) * stepW,
              duration: 0.7,
              ease: 'power2.inOut',
            });
          }
          // Seamless reset: Card M1 + N1 is identical to Card M1 in image and screen position
          tl1.set(row1, { x: startX1 });
        }

        // --- ROW 2: Slides Right, holds 2.0s at each center card ---
        if (isRow2Scroll && row2 && finalRow2.length > 0) {
          const N2 = finalRow2.length;
          // Center on Card M2 (start of Set 3) so 3 full sets extend to the left and 3 to the right
          const M2 = 3 * N2;
          const startX2 = screenCenterX - (M2 * stepW + cardW / 2);
          gsap.set(row2, { x: startX2 });

          const tl2 = gsap.timeline({ repeat: -1 });

          for (let i = 0; i < N2; i++) {
            // Hold for 2.0 seconds at the centered card
            tl2.to({}, { duration: 2.0 });
            // Slide smoothly to the right in 0.7s
            tl2.to(row2, {
              x: startX2 + (i + 1) * stepW,
              duration: 0.7,
              ease: 'power2.inOut',
            });
          }
          // Seamless reset: Card M2 - N2 is identical to Card M2
          tl2.set(row2, { x: startX2 });
        }
      }, section);
    };

    buildAnimation();

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildAnimation();
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      if (ctx) ctx.revert();
    };
  }, []);

  // Dynamic Center Zoom & Automatic Neighbor Spacing Expansion
  // When an image reaches center, it zooms up and AUTOMATICALLY pushes left and right neighbors away for ample breathing space!
  useEffect(() => {
    let animId;
    const content = contentRef.current;
    if (!content) return;

    const updateCenterZoomAndSpacing = () => {
      const rect = content.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // Only calculate when Gallery is on-screen
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        const screenCenterX = window.innerWidth / 2;
        const isDesktop = window.innerWidth >= 640;
        const cardWidth = isDesktop ? 260 : 160;
        const zoomRange = (cardWidth + 24) * 0.85; // Proximity threshold around center
        const pushDistance = isDesktop ? 36 : 22; // Extra space created on left & right of zoomed image

        const rows = [row1Ref.current, row2Ref.current];

        rows.forEach((row) => {
          if (!row) return;
          const cards = row.querySelectorAll('.gallery-center-card');
          if (!cards || cards.length === 0) return;

          // 1. Identify the card closest to screen center in this row
          let closestIdx = -1;
          let minCenterDist = Infinity;

          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const cardRect = card.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const dist = Math.abs(screenCenterX - cardCenterX);
            if (dist < minCenterDist) {
              minCenterDist = dist;
              closestIdx = i;
            }
          }

          // 2. Compute zoom factor & dynamic push separation
          let factor = 0;
          if (minCenterDist < zoomRange) {
            factor = Math.cos((minCenterDist / zoomRange) * (Math.PI / 2));
          }

          // Smooth quadratic push: maximum separation when held at center, dissolves during fast card slide
          const pushAmount = pushDistance * Math.pow(factor, 2);

          // 3. Apply zoom to center card and automatically push left/right neighbors away
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];

            if (i === closestIdx && factor > 0.01) {
              // Zoomed center card: stays dead center (pushX = 0), scales up, illuminates with amber border & glow
              const scale = 1 + factor * 0.18;
              card.style.transform = `scale(${scale.toFixed(3)})`;
              card.style.zIndex = factor > 0.15 ? '30' : '1';
              card.style.borderColor = `rgba(245, 158, 11, ${(0.25 + factor * 0.75).toFixed(2)})`;
              card.style.boxShadow = `0 14px 38px rgba(245, 158, 11, ${(factor * 0.45).toFixed(2)})`;
            } else {
              // Neighboring cards: automatically pushed away ONLY around the zoomed card
              let pushX = 0;
              if (pushAmount > 0.5) {
                if (i < closestIdx) {
                  pushX = -pushAmount; // Push left cards to the left
                } else if (i > closestIdx) {
                  pushX = pushAmount;  // Push right cards to the right
                }
              }

              if (pushX !== 0) {
                card.style.transform = `translate3d(${pushX.toFixed(1)}px, 0, 0) scale(1)`;
              } else if (card.style.transform && card.style.transform !== 'scale(1)') {
                card.style.transform = 'scale(1)';
              }

              card.style.zIndex = '1';
              card.style.borderColor = 'rgba(245, 158, 11, 0.2)';
              card.style.boxShadow = '';
            }
          }
        });
      }

      animId = requestAnimationFrame(updateCenterZoomAndSpacing);
    };

    animId = requestAnimationFrame(updateCenterZoomAndSpacing);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [sourceItems.length]);

  return (
    <section ref={sectionRef} id="gallery" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Pinned Stage Container with balanced vertical/horizontal spaces */}
      <div
        ref={pinContainerRef}
        className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen flex flex-col justify-center items-center py-4 sm:py-6 relative overflow-hidden"
      >
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none"></div>

        {/* Section Heading with balanced margins */}
        <div ref={headerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 sm:mb-5 relative z-10 w-full text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            EVERY HOME HAS A <span className="text-gold-gradient">STORY</span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-2 shadow-sm shadow-amber-500/50"></div>
          <p className="text-zinc-400 text-[11px] sm:text-xs mt-2 font-medium">
            Explore our completed homes, plot developments, and construction progress.
          </p>
        </div>

        {/* Dual X-Axis Showcase Tracks (Continuous loop with no ends before or after, 2s hold at center) */}
        <div ref={contentRef} className="w-full relative z-10">
          {sourceItems.length === 0 ? (
            loading ? (
              <div className="space-y-4 select-none w-full overflow-hidden py-4">
                <div className="flex gap-4 sm:gap-6 overflow-hidden">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] rounded-2xl sm:rounded-3xl bg-zinc-900/60 border border-white/5 animate-pulse shrink-0" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto py-12 px-6 rounded-3xl bg-[#18181b]/90 border border-zinc-800 text-center backdrop-blur-md shadow-2xl my-2 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
                  <Award size={32} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">No Gallery Photos Added Yet</h3>
                <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                  No photo entries found in database. Upload gallery images in the Admin Portal to automatically showcase your work here.
                </p>
              </div>
            )
          ) : (
          <div className="space-y-5 sm:space-y-8 select-none w-full overflow-hidden">
            
            {/* ROW 1: Continuous loop sliding left */}
            <div className="w-full overflow-hidden py-4 sm:py-6">
              <div
                ref={row1Ref}
                className={`flex gap-4 sm:gap-6 ${isRow1Scroll ? 'w-max will-change-transform' : 'justify-center items-center max-w-7xl mx-auto px-4'}`}
              >
                {loopRow1.map((item, index) => (
                  <div
                    key={`row1-${item.id}-${index}`}
                    className="gallery-center-card w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#09090b] border border-amber-500/20 shadow-xl relative will-change-transform transition-[border-color,box-shadow] duration-200 pointer-events-none select-none"
                  >
                    <img
                      src={item.image}
                      alt="Gallery Photo"
                      className="w-full h-full object-cover pointer-events-none select-none"
                      loading="lazy"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2: Continuous loop sliding right (only if sourceItems has > 1 item) */}
            {finalRow2.length > 0 && (
              <div className="w-full overflow-hidden py-4 sm:py-6">
                <div
                  ref={row2Ref}
                  className={`flex gap-4 sm:gap-6 ${isRow2Scroll ? 'w-max will-change-transform' : 'justify-center items-center max-w-7xl mx-auto px-4'}`}
                >
                  {loopRow2.map((item, index) => (
                    <div
                      key={`row2-${item.id}-${index}`}
                      className="gallery-center-card w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#09090b] border border-amber-500/20 shadow-xl relative will-change-transform transition-[border-color,box-shadow] duration-200 pointer-events-none select-none"
                    >
                      <img
                        src={item.image}
                        alt="Gallery Photo"
                        className="w-full h-full object-cover pointer-events-none select-none"
                        loading="lazy"
                        draggable="false"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
