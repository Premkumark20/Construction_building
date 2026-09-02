import React, { useState, useEffect } from 'react';
import { Phone, Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData.js';
import { handlePhoneCall } from '../utils/phoneUtils.js';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'services', label: 'Our Services' },
  { id: 'properties', label: 'Properties' },
  { id: 'projects', label: 'Projects' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSiteData();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sectionIds = ['home', 'about', 'gallery', 'services', 'properties', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 200; // Offset for navbar

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
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#09090b]/92 backdrop-blur-2xl border-b border-amber-500/30 py-2.5 shadow-2xl shadow-black/90'
          : 'bg-[#09090b]/80 backdrop-blur-md py-3.5 border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Dynamic Brand Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-900/30 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg group-hover:border-amber-400 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-300">
            <img
              src={settings.logo_url || '/logo/sk-builders-logo.png'}
              alt={`${settings.company_name || 'Company'} Logo`}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <span className="block text-xs sm:text-lg font-black tracking-tight text-white leading-none uppercase group-hover:text-amber-400 transition-colors">
              {settings.company_name || ''}
            </span>
            <span className="block text-[8px] sm:text-[10px] font-bold text-amber-400 tracking-wider sm:tracking-widest uppercase mt-0.5">
              {settings.company_subtitle || ''}
            </span>
          </div>
        </a>

        {/* Navigation Links with Active Indicator Line */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`py-1 relative transition-colors ${
                  isActive ? 'text-amber-400 font-extrabold' : 'text-zinc-300 hover:text-amber-400'
                }`}
              >
                {item.label}
                {/* Active Indicator Underline Line */}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.8)] ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Contact Us Button */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href="#contact"
            className={`magnetic-btn px-5 py-2 rounded-full text-xs flex items-center gap-2 transition-all border ${
              activeSection === 'contact'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.9)] scale-105 border-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20 active:scale-95 border-amber-300/40'
            }`}
          >
            <Phone size={14} className="text-black" />
            <span>Contact Us</span>
          </a>
        </div>

        {/* Mobile Hamburger Menu */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-zinc-300 hover:text-amber-400 focus:outline-none transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#09090b]/98 backdrop-blur-2xl border-b border-amber-500/20 px-6 pt-4 pb-6 space-y-4 shadow-2xl animate-fadeIn text-zinc-200">
          <nav className="flex flex-col gap-3 font-semibold text-xs sm:text-sm">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1.5 flex items-center justify-between border-b border-white/5 transition-colors ${
                    isActive ? 'text-amber-400 font-black' : 'text-zinc-300 hover:text-amber-400'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />}
                </a>
              );
            })}
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`py-1.5 flex items-center justify-between transition-colors ${
                activeSection === 'contact' ? 'text-amber-400 font-black' : 'text-zinc-300 hover:text-amber-400'
              }`}
            >
              <span>Contact Us</span>
              {activeSection === 'contact' && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />}
            </a>
          </nav>
          <div className="pt-2 border-t border-white/10">
            {settings.phone ? (
              <a
                href={`tel:+91${settings.phone.replace(/[^0-9]/g, '')}`}
                onClick={(e) => handlePhoneCall(e, settings.phone)}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold py-3 rounded-xl text-center text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Phone size={15} /> Call +91 {settings.phone}
              </a>
            ) : (
              <a
                href="#contact"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold py-3 rounded-xl text-center text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Phone size={15} /> Contact Support
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
