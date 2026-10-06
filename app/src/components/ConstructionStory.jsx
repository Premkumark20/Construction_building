import React, { useEffect, useRef, useState } from 'react';
import { Phone, MessageCircle, Home, ShieldCheck, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData';
import { handlePhoneCall, getWhatsAppUrl } from '../utils/phoneUtils.js';

gsap.registerPlugin(ScrollTrigger);

const ConstructionStory = () => {
  const containerRef = useRef(null);
  const pinDesktopRef = useRef(null);
  const canvasDesktopRef = useRef(null);

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const { settings } = useSiteData();

  const totalFrameCount = 121;
  const [showContent, setShowContent] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const [hasFramesAvailable, setHasFramesAvailable] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);

  const currentFrameRef = useRef(1);
  const loadedImagesMapRef = useRef({});

  // Detect mobile & prefers-reduced-motion
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth <= 768;
      setIsMobile(mobileCheck);
      if (!mobileCheck) {
        renderFrame(currentFrameRef.current);
      }
    };
    handleResize();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-load Desktop Construction Frames (from Blob Storage CDN or local fallback)
  useEffect(() => {
    let isCancelled = false;

    loadedImagesMapRef.current = {};
    setIsPreloading(true);

    const base = import.meta.env.BASE_URL || '/';
    const isGhPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const endpoint = isGhPages ? `${base.replace(/\/$/, '')}/api/media/frame-urls.json` : `${base.replace(/\/$/, '')}/api/media/frame-urls`;

    fetch(endpoint)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isCancelled) return;
        const urls = (data && Array.isArray(data.frameUrls) && data.frameUrls.length > 0)
          ? data.frameUrls
          : Array.from({ length: totalFrameCount }, (_, i) => `${base.replace(/\/$/, '')}/frames/desktop/frame_${String(i + 1).padStart(4, '0')}.webp`);

        const probe = new Image();
        probe.src = urls[0];

        probe.onload = () => {
          if (isCancelled) return;
          loadedImagesMapRef.current[1] = probe;
          setHasFramesAvailable(true);
          setIsPreloading(false);
          renderFrame(1);

          // Preload remaining frames in background
          urls.slice(1).forEach((url, idx) => {
            const frameIndex = idx + 2;
            const img = new Image();
            img.src = url;
            img.onload = () => {
              if (isCancelled) return;
              loadedImagesMapRef.current[frameIndex] = img;
              if (currentFrameRef.current === frameIndex) {
                renderFrame(frameIndex);
              }
            };
          });
        };

        probe.onerror = () => {
          if (isCancelled) return;
          setHasFramesAvailable(false);
          setIsPreloading(false);
          setShowContent(true);
        };
      })
      .catch(() => {
        if (isCancelled) return;
        setHasFramesAvailable(false);
        setIsPreloading(false);
        setShowContent(true);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Nearest loaded image helper
  const getClosestLoadedImage = (targetIndex) => {
    if (loadedImagesMapRef.current[targetIndex]) {
      return loadedImagesMapRef.current[targetIndex];
    }
    for (let i = targetIndex - 1; i >= 1; i--) {
      if (loadedImagesMapRef.current[i]) return loadedImagesMapRef.current[i];
    }
    for (let i = targetIndex + 1; i <= totalFrameCount; i++) {
      if (loadedImagesMapRef.current[i]) return loadedImagesMapRef.current[i];
    }
    return null;
  };

  // High-DPI Canvas Rendering Engine for Desktop Stage
  const renderFrame = (frameIndex) => {
    const canvas = canvasDesktopRef.current;
    if (!canvas) return;

    const img = getClosestLoadedImage(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = rect.width / rect.height;
    let renderW, renderH, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderW = rect.width;
      renderH = rect.width / imgRatio;
      offsetX = 0;
      offsetY = (rect.height - renderH) / 2;
    } else {
      renderH = rect.height;
      renderW = rect.height * imgRatio;
      if (renderW < rect.width) {
        renderW = rect.width;
        renderH = rect.width / imgRatio;
      }
      offsetX = (rect.width - renderW) / 2;
      offsetY = (rect.height - renderH) / 2;
    }

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    ctx.restore();
  };

  // GSAP ScrollTrigger Desktop Frame Scrubbing
  useEffect(() => {
    if (isMobile || prefersReducedMotion || !hasFramesAvailable) {
      setShowContent(true);
      setHidePrompt(true);
      return;
    }

    const pinDesktop = pinDesktopRef.current;
    const container = containerRef.current;
    if (!container || !pinDesktop) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 769px)', () => {
      const trigger = ScrollTrigger.create({
        trigger: container,
        pin: pinDesktop,
        start: 'top top',
        end: '+=4500',
        scrub: 1.2,
        anticipatePin: 1,
        pinSpacing: true,
        refreshPriority: 10,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Phase 1: Construction Scrubbing (0.0 -> 0.70)
          if (progress <= 0.70) {
            const scrubProg = progress / 0.70;
            const frameIndex = Math.min(
              totalFrameCount,
              Math.max(1, Math.floor(scrubProg * (totalFrameCount - 1)) + 1)
            );
            currentFrameRef.current = frameIndex;
            renderFrame(frameIndex);
            setShowContent(false);
            setHidePrompt(progress >= 0.10);
          } else {
            // Phase 2: Finished House -> Reveal Hero Content (0.70 -> 1.0)
            currentFrameRef.current = totalFrameCount;
            renderFrame(totalFrameCount);
            setShowContent(true);
            setHidePrompt(true);
          }
        },
      });

      return () => {
        trigger.kill();
      };
    });

    requestAnimationFrame(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });

    return () => {
      mm.revert();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
  }, [isMobile, prefersReducedMotion, hasFramesAvailable]);

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative z-10 w-full bg-transparent text-white overflow-hidden"
    >
      {/* 1. MOBILE VIEW: Display ONLY static last frame image of video (No video playing) */}
      <div className="relative md:hidden w-full h-[100dvh] min-h-[560px] max-h-[850px] overflow-hidden flex flex-col justify-end p-4 sm:p-5 pt-16 pb-20 z-10 bg-transparent">
        {/* Static Last Frame Image as Background */}
        <img
          src="/frames/mobile/frame_last.webp"
          alt="SK Builders Completed Project"
          className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none filter brightness-105 contrast-105"
          onError={(e) => {
            e.currentTarget.src = '/frames/desktop/frame_0121.webp';
          }}
        />

        {/* Subtle Dark Gradient Overlay for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-10 pointer-events-none w-[90%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 pointer-events-none" />

        {/* Hero Overlay Content Container */}
        <div className="relative z-20 w-full max-w-[340px] sm:max-w-md mr-auto flex flex-col justify-end text-left items-start">
          {/* Top Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-300 mb-2 bg-black/75 border border-amber-500/40 px-3 py-1 rounded-full w-fit backdrop-blur-md shadow-lg">
            <span>✨ {settings.hero_tagline || 'BUILDING QUALITY HOMES.'}</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-[1.2] mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            Helping You <span className="text-gold-gradient">Buy, Sell &</span><br />
            <span className="text-gold-gradient">Build</span> with <span className="text-gold-gradient">Absolute</span><br />
            <span className="text-gold-gradient">Confidence</span>
          </h1>

          {/* Golden Underline Accent */}
          <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full mb-2.5 shadow-md shadow-amber-500/50"></div>

          {/* Subtitle */}
          <p className="text-[11.5px] sm:text-xs text-zinc-100 font-semibold leading-relaxed mb-3.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            {settings.hero_subtitle ||
              'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation.'}
          </p>

          {/* 3 Feature Pillars */}
          <div className="grid grid-cols-3 gap-1.5 w-full mb-4">
            <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md border border-amber-500/30 rounded-xl p-1.5 shadow-lg">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-sm">
                <ShieldCheck size={13} />
              </div>
              <div className="text-[8px] sm:text-[8.5px] font-black text-zinc-100 leading-tight">
                Trust & <br /> Transparency
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md border border-amber-500/30 rounded-xl p-1.5 shadow-lg">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-sm">
                <Home size={13} />
              </div>
              <div className="text-[8px] sm:text-[8.5px] font-black text-zinc-100 leading-tight">
                Quality <br /> Construction
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md border border-amber-500/30 rounded-xl p-1.5 shadow-lg">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/25 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-sm">
                <Users size={13} />
              </div>
              <div className="text-[8px] sm:text-[8.5px] font-black text-zinc-100 leading-tight">
                Personalized <br /> Service
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href={settings.phone ? `tel:+91${settings.phone.replace(/[^0-9]/g, '')}` : '#contact'}
              onClick={(e) => handlePhoneCall(e, settings.phone)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all active:scale-95 border border-amber-300/40"
            >
              <Phone size={14} /> Call Now
            </a>

            {settings.whatsapp_number && (
              <a
                href={getWhatsAppUrl(settings.whatsapp_number, 'Hi, I want to know more about properties/construction.')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/85 hover:bg-black/95 text-amber-400 border border-amber-500/40 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xl backdrop-blur-md transition-all active:scale-95"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. DESKTOP VIEW: Scroll to Display Construction Video in Frames on Canvas (No video playing) */}
      <div
        ref={pinDesktopRef}
        className="hidden md:flex w-full h-screen min-h-[600px] overflow-hidden items-center justify-start relative bg-transparent px-6 sm:px-12 lg:px-20 z-10"
      >
        {/* Dark Obsidian Preloader Spinner */}
        {isPreloading && (
          <div className="absolute inset-0 z-40 bg-[#09090b] flex flex-col items-center justify-center text-white p-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-amber-500/30"></div>
            <p className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Loading Construction Story...
            </p>
          </div>
        )}

        {/* Canvas for Desktop Frame Scrubbing */}
        <canvas
          ref={canvasDesktopRef}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 transition-opacity duration-500"
        />

        {/* Soft Dark Fade Gradient on Left Side */}
        <div
          className={`absolute inset-y-0 left-0 w-full sm:w-2/3 md:w-[55%] bg-gradient-to-r from-[#09090b]/85 via-[#09090b]/40 to-transparent pointer-events-none z-10 transition-opacity duration-700 ${
            showContent || prefersReducedMotion ? 'opacity-100' : 'opacity-80'
          }`}
        />

        {/* Hero Content Overlay on Desktop */}
        <div
          className={`relative max-w-xl text-white z-20 flex flex-col justify-center pt-16 pb-6 transition-all duration-700 transform ${
            showContent || prefersReducedMotion
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[9.5px] sm:text-[11px] font-black uppercase tracking-widest text-amber-400 mb-2 sm:mb-3 bg-amber-500/10 border border-amber-500/30 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full w-fit backdrop-blur-md">
            <span>✨ {settings.hero_tagline || 'BUILDING QUALITY HOMES.'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2.5 sm:mb-4">
            Helping You <span className="text-gold-gradient">Buy, Sell & Build</span><br />
            with <span className="text-gold-gradient">Absolute Confidence</span>
          </h1>

          <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full mb-2.5 sm:mb-4 shadow-sm shadow-amber-500/50"></div>

          <p className="text-[11.5px] sm:text-sm text-zinc-300 font-medium leading-relaxed mb-4 sm:mb-6">
            {settings.hero_subtitle ||
              'We build and sell individual homes, offer residential plots, contract construction, and provide expert property consultation.'}
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-8">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <ShieldCheck size={16} />
              </div>
              <div className="text-[9.5px] sm:text-xs font-extrabold text-zinc-200 leading-tight">
                Trust & <br /> Transparency
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <Home size={16} />
              </div>
              <div className="text-[9.5px] sm:text-xs font-extrabold text-zinc-200 leading-tight">
                Quality <br /> Construction
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <Users size={16} />
              </div>
              <div className="text-[9.5px] sm:text-xs font-extrabold text-zinc-200 leading-tight">
                Personalized <br /> Service
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <a
              href={settings.phone ? `tel:+91${settings.phone.replace(/[^0-9]/g, '')}` : '#contact'}
              onClick={(e) => handlePhoneCall(e, settings.phone)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 border border-amber-300/40"
            >
              <Phone size={14} /> Call Now
            </a>

            {settings.whatsapp_number && (
              <a
                href={getWhatsAppUrl(settings.whatsapp_number, 'Hi, I want to know more about properties/construction.')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-extrabold px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Scroll Prompt */}
        {!hidePrompt && !showContent && !prefersReducedMotion && hasFramesAvailable && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center justify-center text-white">
            <span className="text-[11px] sm:text-xs uppercase font-black tracking-widest mb-2 text-amber-300 bg-[#09090b]/90 border border-amber-500/40 backdrop-blur-xl px-5 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2">
              ✨ Scroll Down to See Land Become Your Dream Home
            </span>
            <div className="w-5 h-8 border-2 border-amber-400/80 rounded-full flex justify-center pt-1.5 bg-black/70 backdrop-blur-md shadow-lg">
              <div className="w-1.5 h-2.5 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ConstructionStory;
