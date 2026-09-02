import React, { useState, useEffect, useRef } from 'react';
import { Phone, MessageCircle, MapPin, Send, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData.js';
import { handlePhoneCall, getWhatsAppUrl } from '../utils/phoneUtils.js';

gsap.registerPlugin(ScrollTrigger);

const ContactCTA = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const leftColumnRef = useRef(null);
  const rightFormRef = useRef(null);

  const { settings } = useSiteData();
  const [formData, setFormData] = useState({ name: '', phone: '', service: 'House Construction', message: '' });
  const [statusMsg, setStatusMsg] = useState('');

  // Section Pinning & Scroll-Scrubbed Animation Engine (Desktop only)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const leftColumn = leftColumnRef.current;
    const rightForm = rightFormRef.current;

    if (!section || !pinContainer || !leftColumn || !rightForm) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinned Entry Timeline
    mm.add('(min-width: 769px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: '+=2000',
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        leftColumn,
        { opacity: 0, x: -80, scale: 0.92 },
        { opacity: 1, x: 0, scale: 1, ease: 'power2.out' },
        0
      );

      tl.fromTo(
        rightForm,
        { opacity: 0, x: 80, scale: 0.92, rotateY: -10 },
        { opacity: 1, x: 0, scale: 1, rotateY: 0, ease: 'power2.out' },
        0.1
      );
    });

    // 2. MOBILE: Simple static view
    mm.add('(max-width: 768px)', () => {
      gsap.set([leftColumn, rightForm], { clearProps: 'all' });
    });

    return () => mm.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatusMsg('Thank you! Your enquiry has been received. We will call you back shortly.');
        setFormData({ name: '', phone: '', service: 'House Construction', message: '' });
      } else {
        setStatusMsg('Enquiry submitted successfully! We will contact you shortly.');
      }
    } catch (err) {
      setStatusMsg('Enquiry sent! We will contact you shortly.');
    }
  };

  return (
    <section ref={sectionRef} id="contact" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10 bg-blueprint-lines">
      {/* Stage Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex items-center justify-center py-10 sm:py-20 relative">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10 w-full perspective-1200">
          {/* Dynamic Dark Card Banner */}
          <div className="bg-gradient-to-br from-[#141418]/90 via-[#121216]/80 to-[#0c0c0e]/90 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden border border-amber-500/30 preserve-3d">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 items-center preserve-3d">
              
              {/* Left Story Column */}
              <div ref={leftColumnRef} className="lg:col-span-7 space-y-3.5 sm:space-y-6 preserve-3d">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white translate-z-30">
                  Have a Property in Mind?
                </h2>

                <p className="text-zinc-300 text-[11.5px] sm:text-sm leading-relaxed max-w-xl font-medium translate-z-20">
                  Whether you want to buy an individual house, purchase residential land, or start custom contract construction{settings?.service_areas ? ` in ${settings.service_areas.split(/[,•|;/]/).map(s => s.trim()).filter(Boolean).join(', ')}` : ''} — our engineering team is ready to guide you.
                </p>

                {/* Dynamic Clickable Contact Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10 translate-z-20">
                  <a
                    href={settings.phone ? `tel:+91${settings.phone.replace(/[^0-9]/g, '')}` : '#contact'}
                    onClick={(e) => handlePhoneCall(e, settings.phone)}
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#09090b]/80 hover:bg-[#121216] border border-white/10 hover:border-amber-500/40 transition-all duration-300 group shadow-md"
                  >
                    <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-lg sm:rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black border border-amber-500/30 shrink-0 transition-colors shadow-sm">
                      <Phone size={16} />
                    </div>
                    <div>
                      <div className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider">Call Us</div>
                      <div className="text-[11.5px] sm:text-xs font-black text-amber-400 group-hover:text-amber-300">
                        {settings.phone ? `+91 ${settings.phone}` : 'Contact Us'}
                      </div>
                    </div>
                  </a>

                  <a
                    href={getWhatsAppUrl(settings.whatsapp_number || settings.phone, "Hi, I'm interested in your property services.")}
                    target={settings.whatsapp_number || settings.phone ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#09090b]/80 hover:bg-[#121216] border border-white/10 hover:border-amber-500/40 transition-all duration-300 group shadow-md"
                  >
                    <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-lg sm:rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black border border-amber-500/30 shrink-0 transition-colors shadow-sm">
                      <MessageCircle size={16} />
                    </div>
                    <div>
                      <div className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider">WhatsApp</div>
                      <div className="text-[11.5px] sm:text-xs font-black text-amber-400 group-hover:text-amber-300">
                        {settings.whatsapp_number || settings.phone ? `+91 ${settings.whatsapp_number || settings.phone}` : 'Chat with Us'}
                      </div>
                    </div>
                  </a>

                  <a
                    href={
                      settings?.maps_url ||
                      (settings?.location
                        ? `https://www.google.com/maps?q=${encodeURIComponent(settings.location)}`
                        : (settings?.service_areas
                          ? `https://www.google.com/maps?q=${encodeURIComponent(settings.service_areas)}`
                          : 'https://www.google.com/maps'))
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#09090b]/80 hover:bg-[#121216] border border-white/10 hover:border-amber-500/40 transition-all duration-300 group shadow-md"
                  >
                    <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-lg sm:rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black border border-amber-500/30 shrink-0 transition-colors shadow-sm">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9.5px] text-zinc-400 font-bold uppercase tracking-wider">Location</div>
                      <div className="text-[10.5px] sm:text-xs font-black text-white leading-snug break-words">
                        {settings?.service_areas
                          ? settings.service_areas.split(/[,•|;/]/).map(s => s.trim()).filter(Boolean).join(' • ')
                          : settings?.location || ''}
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Right Contact Form Column - Vertical Rectangle Container */}
              <div ref={rightFormRef} className="lg:col-span-5 bg-[#09090b]/90 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-amber-500/30 shadow-2xl tilt-3d relative preserve-3d">
                <div className="specular-glare" />

                <div className="relative z-10 preserve-3d">
                  <h3 className="text-sm sm:text-base font-extrabold text-white mb-0.5 flex items-center gap-1.5 translate-z-20">
                    <Sparkles size={15} className="text-amber-400" /> Send Quick Inquiry
                  </h3>
                  <p className="text-[10.5px] text-zinc-400 mb-3 sm:mb-4 font-medium translate-z-20">Get itemized cost estimation within 24 hours.</p>

                  {statusMsg && (
                    <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs p-2.5 rounded-xl mb-3 text-center font-bold translate-z-20">
                      {statusMsg}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5 translate-z-20">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (10 Digits)"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="House Construction">House Construction</option>
                      <option value="House for Sale">Individual House Purchase</option>
                      <option value="Land for Sale">Residential Land Purchase</option>
                      <option value="Property Consultation">Property Consultation</option>
                    </select>
                    <textarea
                      placeholder="Requirements (Optional)"
                      rows="2"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#121216] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                    ></textarea>

                    <button
                      type="submit"
                      className="w-full magnetic-btn bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black py-2.5 sm:py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-300/40"
                    >
                      <Send size={13} /> Submit Request
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactCTA;
