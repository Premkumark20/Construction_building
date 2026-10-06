import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Image, Wrench, Building, Briefcase, Star, Phone } from 'lucide-react';
import { useSiteData, resolveAssetUrl } from '../hooks/useSiteData.jsx';
import { handlePhoneCall } from '../utils/phoneUtils.js';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'services', label: 'Our Services' },
  { id: 'properties', label: 'Properties' },
  { id: 'projects', label: 'Projects' },
  { id: 'feedback', label: 'Feedback', href: '/feedback', isNewTab: true },
];

const mobileNavItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'about', label: 'About Us', icon: Users },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'properties', label: 'Properties', icon: Building },
  { id: 'projects', label: 'Projects', icon: Briefcase },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'feedback', label: 'Feedback', icon: Star, href: '/feedback', isNewTab: true },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const getRouteSection = () => {
    const path = location.pathname;
    if (path.includes('/property-details') || path.includes('/all-properties')) return 'properties';
    if (path.includes('/project-details') || path.includes('/all-projects')) return 'projects';
    if (path.includes('/feedback')) return 'feedback';
    return 'home';
  };

  const [activeSection, setActiveSection] = useState(getRouteSection);
  const { settings } = useSiteData();

  useEffect(() => {
    setActiveSection(getRouteSection());
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '') return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sectionIds = ['home', 'about', 'gallery', 'services', 'properties', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i]);
        if (section) {
          const top = section.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    if (location.pathname !== '/' && location.pathname !== '') {
      navigate(`/#${targetId}`, { state: { scrollTo: targetId } });
      return;
    }

    const el = document.getElementById(targetId);
    if (!el) return;

    const navbarHeight = 65;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + scrollTop - navbarHeight;

    if (window.lenis) {
      window.lenis.scrollTo(el, { offset: -navbarHeight, immediate: false });
    } else {
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }

    if (window.history.pushState) {
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  // Determine active index for mobile bottom navigation cutout animation
  const activeMobileIndex = Math.max(
    0,
    mobileNavItems.findIndex(item => item.id === activeSection)
  );

  return (
    <>
      {/* 1. TOP HEADER (Desktop full navbar & Mobile clean brand bar) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#09090b]/95 backdrop-blur-2xl border-b border-amber-500/30 py-2 sm:py-2.5 shadow-2xl shadow-black/90'
            : 'bg-[#09090b]/85 backdrop-blur-md py-3 border-b border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Dynamic Brand Logo */}
          <a
            href="#home"
            onClick={(e) => scrollToSection(e, 'home')}
            className="flex items-center gap-2.5 sm:gap-3 group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-white flex items-center justify-center shrink-0 shadow-lg group-hover:border-amber-400 group-hover:scale-105 transition-all duration-300">
              <img
                src={resolveAssetUrl(settings.logo_url || '/logo/sk-builders-logo.png')}
                alt={`${settings.company_name || 'Company'} Logo`}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="block text-xs sm:text-lg font-black tracking-tight text-white leading-none uppercase group-hover:text-amber-400 transition-colors">
                {settings.company_name || 'SK BUILDERS'}
              </span>
              <span className="block text-[8px] sm:text-[10px] font-bold text-amber-400 tracking-wider sm:tracking-widest uppercase mt-0.5">
                {settings.company_subtitle || '& PROPERTY CONSULTANT'}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              if (item.isNewTab) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1 relative text-zinc-300 hover:text-amber-400 transition-colors flex items-center gap-1 group"
                  >
                    <span>{item.label}</span>
                    <span className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 w-0 group-hover:w-full" />
                  </a>
                );
              }
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`py-1 relative transition-colors ${
                    isActive ? 'text-amber-400 font-extrabold' : 'text-zinc-300 hover:text-amber-400'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Top Right Quick Contact Action (Opens phone dialer on mobile view, scrolls to section on desktop) */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:+91${(settings?.phone || '').replace(/[^0-9]/g, '') || ''}`}
              onClick={(e) => {
                if (window.innerWidth >= 768) {
                  const contactSec = document.getElementById('contact');
                  if (contactSec) {
                    e.preventDefault();
                    contactSec.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full text-[11px] sm:text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all border border-amber-300/40 cursor-pointer"
            >
              <Phone size={13} className="text-black" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (8 SECTIONS, ICONS ONLY, CONTINUOUS CURVE & FLOATING CIRCLE WITH GAP) */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-50 select-none pb-safe">
        <div className="relative bg-[#09090b]/95 backdrop-blur-2xl border-t border-amber-500/40 shadow-[0_-10px_35px_rgba(0,0,0,0.95)] h-14">
          {/* Animated Curve Notch & Floating Active Circle Container */}
          <div
            className="absolute top-0 h-full transition-all duration-300 ease-out pointer-events-none z-20"
            style={{
              left: `${activeMobileIndex * (100 / mobileNavItems.length)}%`,
              width: `${100 / mobileNavItems.length}%`
            }}
          >
            {/* Continuous Compact SVG Curve Dip Notch (Strictly 52px wide, leaves adjacent icons completely untouched) */}
            <svg
              className="w-[52px] h-7 absolute -top-[1px] left-1/2 -translate-x-1/2 pointer-events-none"
              viewBox="0 0 52 28"
              fill="none"
            >
              {/* Dark fill strictly erases top border line behind active tab only */}
              <path d="M 0 0 C 9 0 14 26 26 26 C 38 26 43 0 52 0 L 52 28 L 0 28 Z" fill="#09090b" />
              {/* Continuous Amber Line following smooth curve notch with visible gap */}
              <path
                d="M 0 0 C 9 0 14 26 26 26 C 38 26 43 0 52 0"
                stroke="#f59e0b"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>

            {/* Floating Golden Active Circle: Floating at -top-7 for a distinct visible gap above curve */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-black font-black flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.9)] border-none transition-transform duration-300 scale-105">
              {(() => {
                const ActiveIcon = mobileNavItems[activeMobileIndex]?.icon || Home;
                return <ActiveIcon size={18} strokeWidth={2.5} className="text-black" />;
              })()}
            </div>
          </div>

          {/* Mobile Bottom Navigation Grid Items (Icons Only - All 8 Sections) */}
          <nav className="grid grid-cols-8 h-14 relative z-10 items-center">
            {mobileNavItems.map((item, index) => {
              const isActive = activeMobileIndex === index;
              const Icon = item.icon;

              if (item.isNewTab) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-full transition-all duration-300 relative group"
                    title={item.label}
                  >
                    <div className={`transition-all duration-300 ${isActive ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                      <Icon size={19} className="text-zinc-400 group-hover:text-amber-400" />
                    </div>
                  </a>
                );
              }

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className="flex items-center justify-center h-full transition-all duration-300 relative group"
                  title={item.label}
                >
                  <div className={`transition-all duration-300 ${isActive ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                    <Icon size={19} className="text-zinc-400 group-hover:text-amber-400" />
                  </div>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;
