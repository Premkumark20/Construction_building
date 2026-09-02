import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Quote } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reasons = [
  '15+ Years of Experience',
  'Quality Construction',
  'Transparent Pricing',
  'Timely Delivery',
  'Legal & Documentation Support',
  'Personalized Service',
  'Trusted by Many Families'
];

const testimonials = [
  {
    quote: "Professional approach, quality construction and on-time delivery. We are very happy with our new home in Poonamallee.",
    author: "Ramesh & Family, Poonamallee"
  },
  {
    quote: "Transparent dealings and smooth legal registration assistance for our plot in Mangadu. Highly recommended!",
    author: "Karthik Raja, Mangadu"
  },
  {
    quote: "Built our dream villa with top notch engineering standards and milestone updates. The engineering team made the process effortless.",
    author: "Suresh Kumar, Kundrathur"
  }
];

const WhyChooseUs = () => {
  const sectionRef = useRef(null);
  const pinContainerRef = useRef(null);
  const leftCardRef = useRef(null);
  const rightCardRef = useRef(null);
  const reasonsContainerRef = useRef(null);

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-change reviews every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Section Pinning & Scroll-Scrubbed Animation Engine (Desktop only)
  useEffect(() => {
    const section = sectionRef.current;
    const pinContainer = pinContainerRef.current;
    const leftCard = leftCardRef.current;
    const rightCard = rightCardRef.current;
    const reasonsContainer = reasonsContainerRef.current;

    if (!section || !pinContainer || !leftCard || !rightCard) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Pinning & Smooth Scroll-Scrubbed Stagger
    mm.add('(min-width: 769px)', () => {
      const reasonPills = reasonsContainer?.children ? Array.from(reasonsContainer.children) : [];

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: pinContainer,
          start: 'top top',
          end: '+=2400',
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Entry of both 3D cards
      tl.fromTo(
        leftCard,
        { x: -100, opacity: 0, rotateY: 20, scale: 0.9 },
        { x: 0, opacity: 1, rotateY: 0, scale: 1, ease: 'power2.out' },
        0
      );

      tl.fromTo(
        rightCard,
        { x: 100, opacity: 0, rotateY: -20, scale: 0.9 },
        { x: 0, opacity: 1, rotateY: 0, scale: 1, ease: 'power2.out' },
        0
      );

      // Sequential stagger of reason checkmark pills on scroll
      if (reasonPills.length > 0) {
        tl.fromTo(
          reasonPills,
          { opacity: 0, y: 25, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.08, ease: 'power2.out' },
          0.3
        );
      }
    });

    // 2. MOBILE: Simple static view
    mm.add('(max-width: 768px)', () => {
      gsap.set([leftCard, rightCard], { x: 0, y: 0, opacity: 1, scale: 1, rotateY: 0, clearProps: 'all' });
      if (reasonsContainer?.children) {
        gsap.set(Array.from(reasonsContainer.children), { opacity: 1, y: 0, scale: 1, clearProps: 'all' });
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative z-10 w-full bg-transparent text-white overflow-hidden border-t border-white/10">
      {/* Scroll Container (Pinned on desktop only) */}
      <div ref={pinContainerRef} className="w-full min-h-0 sm:min-h-screen h-auto sm:h-screen overflow-hidden flex items-center justify-center py-10 sm:py-20 relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-stretch perspective-1200">
            
            {/* Left Main Card: Why Choose Us? */}
            <div
              ref={leftCardRef}
              className="lg:col-span-7 gold-specular-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border border-white/15 shadow-2xl relative overflow-hidden group min-h-[220px] sm:min-h-[360px] flex flex-col justify-between tilt-3d"
            >
              {/* Dynamic Specular Glare Layer */}
              <div className="specular-glare" />

              {/* Background Architectural House Sketch Image Container */}
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none rounded-2xl sm:rounded-3xl">
                <img
                  src="/house/house-sketch.png"
                  alt="Architectural House Sketch Background"
                  className="w-full h-full object-cover object-center sm:object-right opacity-95 group-hover:scale-105 transition-transform duration-700 filter brightness-125 contrast-130"
                />
                {/* Subtle scrim for crystal-clear text contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-[#09090b]/55 to-[#09090b]/30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/70 via-transparent to-transparent"></div>
              </div>

              {/* Foreground Content Overlay */}
              <div className="relative z-10 max-w-lg preserve-3d">
                <h2 className="text-xl sm:text-3xl font-black text-white mb-3 sm:mb-6 tracking-tight translate-z-20">
                  Why Choose Us?
                </h2>

                <div ref={reasonsContainerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 translate-z-30">
                  {reasons.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 sm:gap-3 bg-[#09090b]/80 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/15 shadow-md hover:border-amber-500/40 hover:bg-[#121216]/80 transition-all duration-300"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} className="text-amber-400" />
                      </div>
                      <span className="text-[11px] sm:text-sm font-extrabold text-zinc-100 leading-tight">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Card: What Our Clients Say */}
            <div
              ref={rightCardRef}
              className="lg:col-span-5 gold-specular-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border border-white/15 shadow-2xl flex flex-col justify-between transition-all duration-300 tilt-3d relative min-h-[220px] sm:min-h-[360px]"
            >
              {/* Dynamic Specular Glare Layer */}
              <div className="specular-glare" />

              <div className="preserve-3d relative z-10">
                <h2 className="text-lg sm:text-3xl font-black text-white mb-2.5 sm:mb-6 translate-z-20">
                  What Our Clients Say
                </h2>

                <div className="bg-[#18181c]/85 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-white/10 shadow-inner relative mt-1 sm:mt-4 translate-z-30 group-hover:border-amber-500/30 transition-all">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2.5 sm:mb-4 shadow-md">
                    <Quote size={16} className="text-amber-400" />
                  </div>
                  <p className="text-zinc-200 text-xs sm:text-base italic leading-relaxed mb-2.5 sm:mb-4 font-medium min-h-[50px] sm:min-h-[72px] transition-all duration-500">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  <div className="font-extrabold text-[11px] sm:text-sm text-amber-400 transition-all duration-500">
                    – {testimonials[activeTestimonial].author}
                  </div>
                </div>
              </div>

              {/* Interactive Pagination Dots */}
              <div className="flex justify-center items-center gap-2 mt-4 sm:mt-8 relative z-10 translate-z-20">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`transition-all duration-300 rounded-full ${
                      activeTestimonial === i
                        ? 'w-6 h-2.5 bg-gradient-to-r from-amber-400 to-amber-600 shadow-md shadow-amber-500/30'
                        : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
