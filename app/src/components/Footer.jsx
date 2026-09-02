import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle, Lock } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData.js';
import { handlePhoneCall } from '../utils/phoneUtils.js';

const Footer = () => {
  const { settings } = useSiteData();

  return (
    <footer className="relative z-30 bg-[#070709]/95 backdrop-blur-2xl text-zinc-300 w-full overflow-hidden border-t border-amber-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 divide-y md:divide-y-0 lg:divide-x divide-white/10">
          {/* Column 1: Logo & Info */}
          <div className="space-y-4 lg:pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#121216] rounded-xl flex items-center justify-center border border-amber-500/40 overflow-hidden shadow-lg group hover:border-amber-400 transition-colors">
                <img src={settings.logo_url || '/logo/sk-builders-logo.png'} alt={`${settings.company_name || 'Company'} Logo`} className="w-8 h-8 object-contain" />
              </div>
              <div>
                <span className="block text-base font-black text-white leading-none uppercase tracking-tight">
                  {settings.company_name || ''}
                </span>
                <span className="block text-[9px] font-bold text-amber-400 tracking-wider uppercase mt-0.5">
                  {settings.company_subtitle || ''}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              We build quality homes, sell residential plots and provide expert property consultation.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={settings.facebook_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/10 transition-all shadow-sm"
                aria-label="Facebook"
              >
                <Facebook size={15} />
              </a>
              <a
                href={settings.instagram_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/10 transition-all shadow-sm"
                aria-label="Instagram"
              >
                <Instagram size={15} />
              </a>
              <a
                href={settings.whatsapp_number ? `https://wa.me/91${settings.whatsapp_number}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-green-400 hover:border-green-400/50 hover:bg-green-500/10 transition-all shadow-sm"
                aria-label="WhatsApp"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3 pt-6 md:pt-0 lg:px-6">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li><a href="#hero" className="hover:text-amber-300 transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-amber-300 transition-colors">About Us</a></li>
              <li><a href="#gallery" className="hover:text-amber-300 transition-colors">Gallery</a></li>
              <li><a href="#services" className="hover:text-amber-300 transition-colors">Our Services</a></li>
              <li><a href="#properties" className="hover:text-amber-300 transition-colors">Properties</a></li>
              <li><a href="#projects" className="hover:text-amber-300 transition-colors">Projects</a></li>
              <li><a href="#contact" className="hover:text-amber-300 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Column 3: Our Services */}
          <div className="space-y-3 pt-6 md:pt-0 lg:px-6">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Our Services</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li><a href="#properties" className="hover:text-amber-300 transition-colors">✓ Houses for Sale</a></li>
              <li><a href="#properties" className="hover:text-amber-300 transition-colors">✓ Lands for Sale</a></li>
              <li><a href="#services" className="hover:text-amber-300 transition-colors">✓ Contract House Construction</a></li>
              <li><a href="#services" className="hover:text-amber-300 transition-colors">✓ Property Consultant</a></li>
              <li><a href="#services" className="hover:text-amber-300 transition-colors">✓ Documentation Support</a></li>
              <li><a href="#services" className="hover:text-amber-300 transition-colors">✓ Construction Consultation</a></li>
            </ul>
          </div>

          {/* Column 4: Areas We Serve */}
          <div className="space-y-3 pt-6 md:pt-0 lg:px-6">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Areas We Serve</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              {(settings?.service_areas
                ? settings.service_areas.split(/[,•|;/]/).map(s => s.trim()).filter(Boolean)
                : (settings?.location ? settings.location.split(/[,•|;/]/).map(s => s.trim()).filter(Boolean) : [])
              ).map((area, idx) => (
                <li key={idx}><span className="hover:text-amber-300 transition-colors">✓ {area}</span></li>
              ))}
            </ul>
          </div>

          {/* Column 5: Contact Us */}
          <div className="space-y-3 pt-6 md:pt-0 lg:pl-6">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-medium">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-amber-400 shrink-0" />
                {settings.phone ? (
                  <a href={`tel:+91${settings.phone.replace(/[^0-9]/g, '')}`} onClick={(e) => handlePhoneCall(e, settings.phone)} className="hover:text-white">+91 {settings.phone}</a>
                ) : (
                  <a href="#contact" className="hover:text-white">Contact Us</a>
                )}
              </li>
              {settings.email && (
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-amber-400 shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{settings.location || settings.service_areas || ''}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Gold Copyright Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-black py-4 px-4 text-[11px] font-extrabold shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <div>
            © 2026 {settings.company_name || ''} {settings.company_subtitle || ''}. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:underline">Terms & Conditions</a>
            <span>|</span>
            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-black/20 hover:bg-black text-amber-300 hover:text-amber-400 px-3 py-1 rounded-full transition-colors"
              title="Admin Portal (Opens in new tab with auto logout on tab close)"
            >
              <Lock size={12} /> Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
