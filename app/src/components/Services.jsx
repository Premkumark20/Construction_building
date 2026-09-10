import React, { useState, useEffect, useRef } from 'react';
import { Home, MapPin, HardHat, Users, FileText, Compass, ArrowRight, X } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData.js';
import AnimatedCounter from './AnimatedCounter.jsx';

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

// Hook: fires once when element enters viewport
function useInView(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return visible;
}

const Services = () => {
  const sectionRef   = useRef(null);
  const headerRef    = useRef(null);
  const cardsRef     = useRef(null);
  const statsRef     = useRef(null);

  const [activeServiceModal, setActiveServiceModal] = useState(null);
  const { services } = useSiteData();

  const headerVisible = useInView(headerRef, 0.2);
  const cardsVisible  = useInView(cardsRef,  0.1);
  const statsVisible  = useInView(statsRef,  0.15);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = activeServiceModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeServiceModal]);

  const safeServices = (Array.isArray(services) && services.length >= 6)
    ? services
    : defaultServices;

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10 py-16 sm:py-24"
    >
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-amber-500/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-8 sm:gap-12">

        {/* ── Section Heading ── */}
        <div
          ref={headerRef}
          className="text-center max-w-3xl mx-auto transition-all duration-700 ease-out"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(-28px)',
          }}
        >
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            What We Do
          </h2>
          <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 mx-auto rounded-full mt-2 sm:mt-3 shadow-sm shadow-amber-500/50" />
          <p className="text-zinc-400 text-[11px] sm:text-sm mt-2 sm:mt-3 font-medium">
            End-to-end real estate solutions designed for individual home buyers, plot investors and land owners.
          </p>
        </div>

        {/* ── Service Cards Grid ── */}
        <div
          ref={cardsRef}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4"
        >
          {safeServices.map((srv, idx) => {
            const icon = iconMap[srv.icon_name] || iconMap.Home;
            return (
              <div
                key={srv.id || idx}
                onClick={() => setActiveServiceModal(srv)}
                className="gold-specular-card rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-lg cursor-pointer flex flex-col justify-between group tilt-3d relative min-h-[160px] sm:min-h-[220px] transition-all duration-500 ease-out"
                style={{
                  opacity: cardsVisible ? 1 : 0,
                  transform: cardsVisible
                    ? 'translateY(0) scale(1)'
                    : 'translateY(40px) scale(0.93)',
                  transitionDelay: cardsVisible ? `${idx * 70}ms` : '0ms',
                }}
              >
                <div className="specular-glare" />

                <div className="relative z-10">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2 sm:mb-3.5 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 transition-colors duration-300 shadow-md">
                    {React.cloneElement(icon, {
                      className: 'transition-colors duration-300 group-hover:text-black w-4 h-4 sm:w-5 sm:h-5'
                    })}
                  </div>
                  <h3 className="text-[11.5px] sm:text-sm font-extrabold text-white mb-1 leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
                    {srv.title}
                  </h3>
                  <p className="text-zinc-400 text-[9.5px] sm:text-[10.5px] leading-tight mb-2 font-medium line-clamp-2 sm:line-clamp-3">
                    {srv.description}
                  </p>
                </div>
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider group-hover:gap-2 transition-all">
                    Explore <ArrowRight size={10} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stats Strip ── */}
        <div
          ref={statsRef}
          className="w-full bg-[#121216]/90 backdrop-blur-2xl text-white border border-amber-500/40 rounded-xl sm:rounded-2xl p-3 sm:py-5 sm:px-6 shadow-2xl transition-all duration-700 ease-out"
          style={{
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-0 divide-y-0 lg:divide-x divide-white/10">
            {stats.map((st, i) => (
              <div
                key={i}
                className={`flex items-center justify-center gap-2 sm:gap-3.5 ${i !== 0 ? 'lg:px-6' : 'lg:pr-6'}`}
              >
                <div className="p-1.5 sm:p-2.5 bg-amber-500/15 border border-amber-500/35 rounded-lg sm:rounded-xl shrink-0 shadow-md">
                  {React.cloneElement(st.icon, {
                    className: 'text-amber-400 w-4 h-4 sm:w-5 sm:h-5'
                  })}
                </div>
                <div>
                  <div className="text-base sm:text-2xl lg:text-3xl font-black text-white leading-none tracking-tight">
                    <AnimatedCounter targetString={st.number} trigger={statsVisible} />
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

      {/* ── Service Detail Modal ── */}
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
