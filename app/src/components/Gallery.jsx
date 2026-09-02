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
  const dbPropItems = (Array.isArray(properties) ? properties : []).map(p => ({
    id: `prop-${p.id}`,
    image: p.image || '/house/completed-house.jpg',
    title: p.title,
    category: 'Completed Houses',
    location: p.location || p.area || ''
  }));
  const dbLandItems = (Array.isArray(land) ? land : []).map(l => ({
    id: `land-${l.id}`,
    image: l.image || '/house/completed-house.jpg',
    title: l.title,
    category: 'Plot Layouts',
    location: l.location || l.area || ''
  }));
  const dbProjItems = (Array.isArray(projects) ? projects : []).map(pr => ({
    id: `proj-${pr.id}`,
    image: pr.cover_image || pr.image || '/house/completed-house.jpg',
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

  const isRow1Marquee = finalRow1.length >= 3;
  const isRow2Marquee = finalRow2.length >= 3;

  const loopRow1 = isRow1Marquee ? [...finalRow1, ...finalRow1, ...finalRow1] : finalRow1;
  const loopRow2 = isRow2Marquee ? [...finalRow2, ...finalRow2, ...finalRow2] : finalRow2;

  // Smooth GSAP Desktop Pinned Section with gradual reveal and silky unpin transition
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const header = headerRef.current;
    const content = contentRef.current;
    if (!section || !pinContainer) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinned showcase stage so visitors can view continuous infinite marquee
    mm.add('(min-width: 769px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: '+=2000',
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      if (header) {
        tl.fromTo(
          header,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' },
          0
        );
      }
      if (content) {
        tl.fromTo(
          content,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' },
          0.06
        );
      }

      return () => tl.kill();
    });

    // 2. MOBILE: Natural touch flow
    mm.add('(max-width: 768px)', () => {
      if (header) gsap.set(header, { clearProps: 'all' });
      if (content) gsap.set(content, { clearProps: 'all' });
    });

    return () => mm.revert();
  }, [sourceItems.length]);

  return (
    <section ref={sectionRef} id="gallery" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Stage Container (Pinned full-screen on desktop) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center gap-4 sm:gap-6 py-6 sm:py-12 relative">
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[170px] pointer-events-none"></div>

        {/* Section Heading with generous top and bottom margin */}
        <div ref={headerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2 sm:mb-4 relative z-10 w-full text-center">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            EVERY HOME HAS A <span className="text-gold-gradient">STORY</span>
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-2 shadow-sm shadow-amber-500/50"></div>
          <p className="text-zinc-400 text-[11px] sm:text-xs mt-2 font-medium">
            Explore our completed homes, plot developments, and construction progress.
          </p>
        </div>

        {/* DUAL X-AXIS SHOWCASE TRACKS (Continuous Horizontal Auto-Scroll if >=5, Static if <5) */}
        <div ref={contentRef} className="w-full relative z-10">
          {loading && sourceItems.length === 0 ? (
            <div className="space-y-4 w-full overflow-hidden px-4">
              <div className="flex gap-4 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={`sk1-${n}`} className="w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] shrink-0 rounded-2xl sm:rounded-3xl bg-[#18181b]/70 border border-white/5 animate-pulse" />
                ))}
              </div>
              <div className="flex gap-4 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={`sk2-${n}`} className="w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] shrink-0 rounded-2xl sm:rounded-3xl bg-[#18181b]/70 border border-white/5 animate-pulse" />
                ))}
              </div>
            </div>
          ) : sourceItems.length === 0 ? (
            <div className="max-w-xl mx-auto py-12 px-6 rounded-3xl bg-[#18181b]/90 border border-zinc-800 text-center backdrop-blur-md shadow-2xl my-2 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Award size={32} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">No Gallery Photos Added Yet</h3>
              <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto">
                No photo entries found in database. Upload gallery images in the Admin Portal to automatically showcase your work here.
              </p>
            </div>
          ) : (
          <div className="space-y-6 sm:space-y-8 select-none w-full overflow-hidden">
            
            {/* ROW 1 */}
            <div className="w-full overflow-hidden py-2">
              <div
                ref={row1Ref}
                className={`flex gap-4 sm:gap-6 ${isRow1Marquee ? 'w-max will-change-transform animate-marquee-left' : 'justify-center items-center max-w-7xl mx-auto px-4'}`}
              >
                {loopRow1.map((item, index) => (
                  <div
                    key={`row1-${item.id}-${index}`}
                    className="w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#09090b] border border-amber-500/20 hover:border-amber-500/60 shadow-xl transition-all duration-300 hover:-translate-y-1.5 group relative"
                  >
                    <img
                      src={item.image}
                      alt="Gallery Photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2 (only if sourceItems has > 1 item) */}
            {finalRow2.length > 0 && (
              <div className="w-full overflow-hidden py-2">
                <div
                  ref={row2Ref}
                  className={`flex gap-4 sm:gap-6 ${isRow2Marquee ? 'w-max will-change-transform animate-marquee-right' : 'justify-center items-center max-w-7xl mx-auto px-4'}`}
                >
                  {loopRow2.map((item, index) => (
                    <div
                      key={`row2-${item.id}-${index}`}
                      className="w-[160px] sm:w-[260px] h-[115px] sm:h-[175px] shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#09090b] border border-amber-500/20 hover:border-amber-500/60 shadow-xl transition-all duration-300 hover:-translate-y-1.5 group relative"
                    >
                      <img
                        src={item.image}
                        alt="Gallery Photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
