import React, { useState, useEffect, useRef } from 'react';
import { Home, MapPin, HardHat, Users, FileText, Compass, ArrowRight, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';
import AnimatedCounter from './AnimatedCounter.jsx';

gsap.registerPlugin(ScrollTrigger);

const iconMap = {
  Home: <Home size={24} className="text-amber-400" />,
  MapPin: <MapPin size={24} className="text-amber-400" />,
  HardHat: <HardHat size={24} className="text-amber-400" />,
  Users: <Users size={24} className="text-amber-400" />,
  FileText: <FileText size={24} className="text-amber-400" />,
  Compass: <Compass size={24} className="text-amber-400" />
};

const defaultServices = [
  { id: 1, title: 'Houses for Sale', icon_name: 'Home', description: 'Individual 2BHK/3BHK villa houses built with high engineering standards in Poonamallee & Kundrathur.' },
  { id: 2, title: 'Lands for Sale', icon_name: 'MapPin', description: 'DTCP/CMDA approved residential plot layouts ready for immediate house construction.' },
  { id: 3, title: 'Contract House Construction', icon_name: 'HardHat', description: 'Custom contract construction from 2D/3D architectural plan, foundation to final key handover.' },
  { id: 4, title: 'Property Consultant', icon_name: 'Users', description: 'Expert local guidance for plot selection, valuation, transparent pricing and property legal checks.' },
  { id: 5, title: 'Documentation Support', icon_name: 'FileText', description: 'Complete legal verification assistance including Patta, EC, Parent Deeds & municipal approvals.' },
  { id: 6, title: 'Construction Consultation', icon_name: 'Compass', description: 'Technical site inspection, structural estimation, material guidance and cost optimization.' }
];

const stats = [
  { icon: <Home size={20} className="text-amber-400" />, number: '40+', label: 'Homes Built' },
  { icon: <MapPin size={20} className="text-amber-400" />, number: '75+', label: 'Plots Sold' },
  { icon: <Users size={20} className="text-amber-400" />, number: '150+', label: 'Property Deals' },
  { icon: <Users size={20} className="text-amber-400" />, number: '100+', label: 'Happy Families' }
];

const Services = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const headerRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const statsStripRef = useRef(null);

  const [statsActive, setStatsActive] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState(null);
  const { services } = useSiteData();

  // Lock background scroll when service modal is open
  useEffect(() => {
    if (activeServiceModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeServiceModal]);

  const safeServices = (Array.isArray(services) && services.length >= 6)
    ? services
    : defaultServices;

  // Dynamic Counter Trigger via IntersectionObserver for Mobile & Desktop
  useEffect(() => {
    const statsEl = statsStripRef.current;
    if (!statsEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStatsActive(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(statsEl);
    return () => observer.disconnect();
  }, []);

  // Scroll-Scrubbed Animation Engine (Desktop only)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const header = headerRef.current;
    const cardsContainer = cardsContainerRef.current;
    const statsStrip = statsStripRef.current;

    if (!section || !pinContainer || !cardsContainer) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinned Section Timeline Engine with Smooth 2-Way Scrub (Up & Down)
    mm.add('(min-width: 769px)', () => {
      const cards = Array.from(cardsContainer.children);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: '+=2600',
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (self.progress >= 0.35) {
              setStatsActive(true);
            } else {
              setStatsActive(false);
            }
          },
        },
      });

      // 0. Header reveal
      if (header) {
        tl.fromTo(
          header,
          { opacity: 0, y: -25 },
          { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' },
          0
        );
      }

      // 1. STEP 1: Sequential 3D card flip & rise up
      tl.fromTo(
        cards,
        { opacity: 0, y: 55, rotateX: 20, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          stagger: 0.06,
          duration: 0.45,
          ease: 'power2.out',
        },
        0.08
      );

      // 2. STEP 2: NEXT, Stats Strip slides up, glows and illuminates
      if (statsStrip) {
        tl.fromTo(
          statsStrip,
          { opacity: 0, y: 35, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            ease: 'back.out(1.4)',
          },
          0.50
        );
      }
    });

    // 2. MOBILE: Simple static view
    mm.add('(max-width: 768px)', () => {
      if (header) gsap.set(header, { clearProps: 'all' });
      if (cardsContainer?.children) {
        gsap.set(Array.from(cardsContainer.children), { clearProps: 'all' });
      }
      if (statsStrip) gsap.set(statsStrip, { clearProps: 'all' });
    });

    return () => mm.revert();
  }, [safeServices.length]);

  return (
    <section ref={sectionRef} id="services" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex flex-col justify-center items-center py-8 sm:py-20 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col justify-center">
          {/* Section Heading */}
          <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-3 sm:mb-8">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              What We Do
            </h2>
            <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-1.5 sm:mt-2.5 shadow-sm shadow-amber-500/50"></div>
            <p className="text-zinc-400 text-[11px] sm:text-sm mt-1.5 sm:mt-2.5 font-medium">
              End-to-end real estate solutions designed for individual home buyers, plot investors and land owners.
            </p>
          </div>

          {/* 2 COLUMNS ON MOBILE / 6 COLUMNS ON DESKTOP: Vertical Rectangle Cards */}
          <div ref={cardsContainerRef} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 perspective-1200 mb-3.5 sm:mb-6">
            {safeServices.map((srv, idx) => {
              const icon = iconMap[srv.icon_name] || iconMap.Home;
              return (
                <div
                  key={srv.id || idx}
                  onClick={() => setActiveServiceModal(srv)}
                  className="gold-specular-card rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg transition-all duration-300 preserve-3d cursor-pointer flex flex-col justify-between group tilt-3d relative min-h-[160px] sm:min-h-[220px]"
                >
                  <div className="specular-glare" />

                  <div className="preserve-3d relative z-10">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 sm:mb-3.5 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 transition-colors duration-300 shadow-md translate-z-30">
                      {React.cloneElement(icon, {
                        className: 'transition-colors duration-300 group-hover:text-black w-4 h-4 sm:w-5 sm:h-5'
                      })}
                    </div>
                    <h3 className="text-[11.5px] sm:text-sm font-extrabold text-white mb-1 leading-snug group-hover:text-amber-300 transition-colors translate-z-20 line-clamp-2">
                      {srv.title}
                    </h3>
                    <p className="text-zinc-400 text-[9.5px] sm:text-[10.5px] leading-tight mb-2 font-medium line-clamp-2 sm:line-clamp-3">
                      {srv.description}
                    </p>
                  </div>
                  <div className="relative z-10 translate-z-20">
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider group-hover:gap-2 transition-all">
                      Explore <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full-Width Obsidian Gold Stats Strip with Dynamic Countable Animation */}
          <div
            ref={statsStripRef}
            className="w-full bg-[#121216]/90 sm:backdrop-blur-2xl text-white border border-amber-500/40 rounded-xl sm:rounded-2xl p-3 sm:py-5 sm:px-6 shadow-2xl relative z-10"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-0 divide-y-0 lg:divide-x divide-white/10">
              {stats.map((st, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center gap-2 sm:gap-3.5 ${
                    i !== 0 ? 'lg:px-6' : 'lg:pr-6'
                  }`}
                >
                  <div className="p-1.5 sm:p-2.5 bg-amber-500/15 border border-amber-500/35 rounded-lg sm:rounded-xl shrink-0 shadow-md">
                    {React.cloneElement(st.icon, {
                      className: 'text-amber-400 w-4 h-4 sm:w-5 sm:h-5'
                    })}
                  </div>
                  <div>
                    <div className="text-base sm:text-2xl lg:text-3xl font-black text-white leading-none tracking-tight">
                      <AnimatedCounter targetString={st.number} trigger={statsActive} />
                    </div>
                    <div className="text-[9.5px] sm:text-[11px] font-bold text-amber-300 mt-0.5 sm:mt-1 uppercase tracking-wider">
                      {st.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service Detail Modal Drawer */}
      {activeServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-[#121216] rounded-3xl p-8 shadow-2xl border border-amber-500/30 text-white animate-fadeIn">
            <button
              onClick={() => setActiveServiceModal(null)}
              className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-amber-500 hover:text-black rounded-full transition-all text-white"
            >
              <X size={20} />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-lg">
              {iconMap[activeServiceModal.icon_name] || iconMap.Home}
            </div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              SERVICE OVERVIEW
            </span>
            <h3 className="text-2xl font-black text-white mt-3">
              {activeServiceModal.title}
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium mt-3">
              {activeServiceModal.description}
            </p>
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <a
                href="#contact"
                onClick={() => setActiveServiceModal(null)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Inquire For This Service →
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
