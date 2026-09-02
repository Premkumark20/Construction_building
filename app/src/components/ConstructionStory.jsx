import React, { useEffect, useRef, useState } from 'react';
import { Phone, MessageCircle, Home, ShieldCheck, Video, Users } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSiteData } from '../hooks/useSiteData';
import { handlePhoneCall, getWhatsAppUrl } from '../utils/phoneUtils.js';

gsap.registerPlugin(ScrollTrigger);

const ConstructionStory = () => {
  const containerRef = useRef(null);
  const pinDesktopRef = useRef(null);
  const pinMobileRef = useRef(null);
  const canvasDesktopRef = useRef(null);
  const canvasMobileRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [frameVersion, setFrameVersion] = useState(Date.now());

  const { settings } = useSiteData();

  const totalFrameCount = isMobile ? 61 : 121;
  const frameFolder = isMobile ? 'mobile' : 'desktop';

  const [isPreloading, setIsPreloading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [hidePrompt, setHidePrompt] = useState(false);
  const [hasFramesAvailable, setHasFramesAvailable] = useState(true);
  
  const currentFrameRef = useRef(1);
  const loadedImagesMapRef = useRef({});

  // Check viewport device type & accessibility settings
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth <= 768;
      setIsMobile(mobileCheck);
      renderFrame(currentFrameRef.current);
    };
    handleResize();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to Primary Video Updates for Auto-Loading Frames
  useEffect(() => {
    const handleVideoUpdate = () => {
      setFrameVersion(Date.now());
    };
    window.addEventListener('sk_primary_video_updated', handleVideoUpdate);
    return () => {
      window.removeEventListener('sk_primary_video_updated', handleVideoUpdate);
    };
  }, []);

  // Adaptive Frame Preloading with Cache-Buster for Instant Primary Video Switching
  useEffect(() => {
    let successCount = 0;
    let finishedCount = 0;
    loadedImagesMapRef.current = {};
    setIsPreloading(true);

    const safetyTimeout = setTimeout(() => {
      setIsPreloading(false);
    }, 400);

    for (let i = 1; i <= totalFrameCount; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(4, '0');
      img.src = `./frames/${frameFolder}/frame_${frameNum}.webp?v=${frameVersion}`;

      img.onload = () => {
        successCount++;
        finishedCount++;
        loadedImagesMapRef.current[i] = img;
        setHasFramesAvailable(true);

        if (successCount === 1) {
          renderFrame(1);
          setIsPreloading(false);
          clearTimeout(safetyTimeout);
        }
        if (finishedCount >= (isMobile ? 3 : 5)) {
          setIsPreloading(false);
          clearTimeout(safetyTimeout);
        }

        // Re-render canvas if user is currently at this frame
        if (currentFrameRef.current === i) {
          renderFrame(i);
        }
      };

      img.onerror = () => {
        finishedCount++;
        if (finishedCount === totalFrameCount && successCount === 0) {
          setHasFramesAvailable(false);
          setShowContent(true);
          setIsPreloading(false);
          clearTimeout(safetyTimeout);
        }
      };
    }

    return () => clearTimeout(safetyTimeout);
  }, [isMobile, totalFrameCount, frameFolder, frameVersion]);

  // Find nearest loaded frame for ultra-smooth scrubbing fallback
  const getClosestLoadedImage = (targetIndex) => {
    if (loadedImagesMapRef.current[targetIndex]) {
      return loadedImagesMapRef.current[targetIndex];
    }
    // Search backward
    for (let i = targetIndex - 1; i >= 1; i--) {
      if (loadedImagesMapRef.current[i]) return loadedImagesMapRef.current[i];
    }
    // Search forward
    for (let i = targetIndex + 1; i <= totalFrameCount; i++) {
      if (loadedImagesMapRef.current[i]) return loadedImagesMapRef.current[i];
    }
    return null;
  };

  // High-DPI Canvas Rendering Engine for Both Desktop & Mobile Stage
  const renderFrame = (frameIndex) => {
    const img = getClosestLoadedImage(frameIndex);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 1. Render Mobile Canvas (Uncropped Fit in Card)
    const mobileCanvas = canvasMobileRef.current;
    if (mobileCanvas) {
      const mCtx = mobileCanvas.getContext('2d');
      if (mCtx) {
        const mRect = mobileCanvas.getBoundingClientRect();
        if (mobileCanvas.width !== mRect.width * dpr || mobileCanvas.height !== mRect.height * dpr) {
          mobileCanvas.width = mRect.width * dpr;
          mobileCanvas.height = mRect.height * dpr;
        }
        mCtx.save();
        mCtx.scale(dpr, dpr);
        mCtx.imageSmoothingEnabled = true;
        mCtx.imageSmoothingQuality = 'high';
        mCtx.clearRect(0, 0, mRect.width, mRect.height);
        mCtx.drawImage(img, 0, 0, mRect.width, mRect.height);
        mCtx.restore();
      }
    }

    // 2. Render Desktop Canvas (Fullscreen High Definition)
    const desktopCanvas = canvasDesktopRef.current;
    if (desktopCanvas) {
      const dCtx = desktopCanvas.getContext('2d');
      if (dCtx) {
        const dRect = desktopCanvas.getBoundingClientRect();
        if (desktopCanvas.width !== dRect.width * dpr || desktopCanvas.height !== dRect.height * dpr) {
          desktopCanvas.width = dRect.width * dpr;
          desktopCanvas.height = dRect.height * dpr;
        }
        dCtx.save();
        dCtx.scale(dpr, dpr);
        dCtx.imageSmoothingEnabled = true;
        dCtx.imageSmoothingQuality = 'high';

        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = dRect.width / dRect.height;
        let renderW, renderH, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
          renderW = dRect.width;
          renderH = dRect.width / imgRatio;
          offsetX = 0;
          offsetY = (dRect.height - renderH) / 2;
        } else {
          renderH = dRect.height;
          renderW = dRect.height * imgRatio;
          if (renderW < dRect.width) {
            renderW = dRect.width;
            renderH = dRect.width / imgRatio;
          }
          offsetX = (dRect.width - renderW) / 2;
          offsetY = (dRect.height - renderH) / 2;
        }

        dCtx.clearRect(0, 0, dRect.width, dRect.height);
        dCtx.drawImage(img, offsetX, offsetY, renderW, renderH);
        dCtx.restore();
      }
    }
  };

  // GSAP ScrollTrigger Responsive Engine
  useEffect(() => {
    if (prefersReducedMotion) {
      setShowContent(true);
      setHidePrompt(true);
      return;
    }

    const pinDesktop = pinDesktopRef.current;
    const pinMobile = pinMobileRef.current;
    const container = containerRef.current;
    if (!container) return;

    const mm = gsap.matchMedia();

    // 1. DESKTOP: Locked Pinning -> Scrub Construction -> Stay & Retrieve Contents -> Transition to About Us
    mm.add('(min-width: 769px)', () => {
      if (!pinDesktop) return;

      const trigger = ScrollTrigger.create({
        trigger: container,
        pin: pinDesktop,
        start: 'top top',
        end: '+=5800',
        scrub: 1.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Phase 1: Construction Scrubbing (0.0 -> 0.68)
          if (progress <= 0.68) {
            const scrubProg = progress / 0.68;
            const frameIndex = Math.min(
              totalFrameCount,
              Math.max(1, Math.floor(scrubProg * (totalFrameCount - 1)) + 1)
            );
            currentFrameRef.current = frameIndex;
            renderFrame(frameIndex);
            setShowContent(false);
            setHidePrompt(progress >= 0.10);
          } else {
            // Phase 2: Construction Completed -> Stay Pinned & Retrieve Hero Contents (0.68 -> 1.0)
            currentFrameRef.current = totalFrameCount;
            renderFrame(totalFrameCount);
            setShowContent(true);
            setHidePrompt(true);
          }
        },
      });

      return () => trigger.kill();
    });

    // 2. MOBILE: Pin Top Card -> Scrub Construction -> Retrieve Content -> Smoothly Move to Next Section
    mm.add('(max-width: 768px)', () => {
      if (!pinMobile) return;

      const trigger = ScrollTrigger.create({
        trigger: container,
        pin: pinMobile,
        start: 'top top',
        end: '+=900',
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Phase 1: Construction Scrubbing in Top Card (0.0 -> 0.70)
          if (progress <= 0.70) {
            const scrubProg = progress / 0.70;
            const frameIndex = Math.min(
              totalFrameCount,
              Math.max(1, Math.floor(scrubProg * (totalFrameCount - 1)) + 1)
            );
            currentFrameRef.current = frameIndex;
            renderFrame(frameIndex);
            setShowContent(false);
          } else {
            // Phase 2: Completed House -> Retrieve Content -> Stay Brief Moment -> Smooth Move to Next Section (0.70 -> 1.0)
            currentFrameRef.current = totalFrameCount;
            renderFrame(totalFrameCount);
            setShowContent(true);
          }
        },
      });

      return () => trigger.kill();
    });

    return () => mm.revert();
  }, [totalFrameCount, prefersReducedMotion]);

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative z-10 w-full bg-transparent text-white overflow-hidden"
    >
      {/* 1. MOBILE VIEW: Pinned Stage (Top House Card + Stacked Content Below) */}
      <div
        ref={pinMobileRef}
        className="flex md:hidden w-full h-auto min-h-0 flex-col justify-start pt-16 pb-4 px-4 relative z-10 bg-transparent"
      >
        {/* Top House Frame Card */}
        <div className="w-full max-w-sm mx-auto aspect-[16/10] rounded-2xl overflow-hidden border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)] relative bg-black/85 backdrop-blur-md mb-3 shrink-0">
          <canvas
            ref={canvasMobileRef}
            className="w-full h-full object-cover block select-none pointer-events-none"
          />
          <div className="absolute top-2 left-2 bg-[#09090b]/90 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1">
            ✨ Interactive Construction Story
          </div>
        </div>

        {/* Hero Content Stacked Below - Positioned right below top card with zero huge gap */}
        <div
          className={`w-full max-w-sm mx-auto text-left flex flex-col mt-1 transition-all duration-500 transform ${
            showContent || prefersReducedMotion
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <div className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-widest text-amber-400 mb-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full w-fit backdrop-blur-md">
            <span>✨ {settings.hero_tagline || 'BUILDING QUALITY HOMES.'}</span>
          </div>

          <h1 className="text-xl font-black text-white leading-tight mb-1.5">
            Helping You <span className="text-gold-gradient">Buy, Sell & Build</span><br />
            with <span className="text-gold-gradient">Absolute Confidence</span>
          </h1>

          <div className="w-10 h-0.5 bg-gradient-to-r from-amber-500 to-amber-300 rounded-full mb-2 shadow-sm shadow-amber-500/50"></div>

          <p className="text-[11px] text-zinc-300 font-medium leading-relaxed mb-3">
            {settings.hero_subtitle ||
              'We build and sell individual homes, offer residential plots, contract construction, and provide expert property consultation.'}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <ShieldCheck size={13} />
              </div>
              <div className="text-[8.5px] font-extrabold text-zinc-200 leading-tight">
                Trust & <br /> Transparency
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <Home size={13} />
              </div>
              <div className="text-[8.5px] font-extrabold text-zinc-200 leading-tight">
                Quality <br /> Construction
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-amber-500/30">
                <Users size={13} />
              </div>
              <div className="text-[8.5px] font-extrabold text-zinc-200 leading-tight">
                Personalized <br /> Service
              </div>
            </div>
          </div>

          {/* Dynamic Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href={settings.phone ? `tel:+91${settings.phone.replace(/[^0-9]/g, '')}` : '#contact'}
              onClick={(e) => handlePhoneCall(e, settings.phone)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-4 py-2 rounded-lg text-[10.5px] flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 border border-amber-300/40"
            >
              <Phone size={12} /> Call Now
            </a>

            <a
              href={getWhatsAppUrl(settings.whatsapp_number || settings.phone, "Hi, I want to know more about properties/construction.")}
              target={settings.whatsapp_number || settings.phone ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-extrabold px-4 py-2 rounded-lg text-[10.5px] flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              <MessageCircle size={12} /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* 2. DESKTOP VIEW: Cinematic Pinned Fullscreen Interactive Storytelling */}
      <div
        ref={pinDesktopRef}
        className="hidden md:flex w-full h-screen overflow-hidden items-center justify-center relative bg-transparent"
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

        {/* Fallback View when No Video / Frames Exist */}
        {!hasFramesAvailable && !isPreloading && (
          <div className="absolute inset-0 z-30 bg-[#09090b] flex flex-col items-center justify-center text-white p-6 text-center border border-amber-500/20">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
              <Video size={34} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-white mb-2">No Video Found</h3>
            <p className="text-xs text-zinc-400 max-w-md font-medium">
              Upload a construction video in the Admin Portal to automatically generate interactive storytelling frame animations.
            </p>
          </div>
        )}

        {/* Fullscreen Canvas Frame Animation */}
        <canvas
          ref={canvasDesktopRef}
          className="w-full h-full object-cover select-none pointer-events-none absolute inset-0 block z-0"
        />

        {/* Soft Dark Fade Gradient on Left Side */}
        <div
          className={`absolute inset-y-0 left-0 w-full sm:w-2/3 md:w-[55%] bg-gradient-to-r from-[#09090b]/85 via-[#09090b]/40 to-transparent pointer-events-none z-10 transition-opacity duration-700 ${
            showContent || prefersReducedMotion ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hero Content Overlay on Desktop */}
        <div
          className={`absolute top-20 sm:top-24 bottom-6 sm:bottom-10 left-4 sm:left-6 right-4 sm:right-6 md:left-14 max-w-xl text-white z-20 flex flex-col justify-center transition-all duration-700 transform ${
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

            <a
              href={getWhatsAppUrl(settings.whatsapp_number || settings.phone, "Hi, I want to know more about properties/construction.")}
              target={settings.whatsapp_number || settings.phone ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 font-extrabold px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
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
