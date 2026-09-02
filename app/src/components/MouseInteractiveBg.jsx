import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MouseInteractiveBg = () => {
  const videoWrapperRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const spotlightInnerRef = useRef(null);
  const spotlightOuterRef = useRef(null);
  const [bgVideoSrc, setBgVideoSrc] = useState('/videos/Background.mp4');
  const [inHero, setInHero] = useState(false);

  // 1. Fetch active primary background video & listen for admin changes
  const loadBgVideo = async () => {
    try {
      const res = await fetch('/api/media/background-video');
      if (res.ok) {
        const data = await res.json();
        if (data.videoUrl) {
          setBgVideoSrc(data.videoUrl);
        }
      }
    } catch (e) {
      console.log("Using fallback background video:", e);
    }
  };

  useEffect(() => {
    loadBgVideo();

    const handleVideoUpdate = () => {
      loadBgVideo();
    };

    window.addEventListener('sk_primary_video_updated', handleVideoUpdate);
    window.addEventListener('sk_site_data_updated', handleVideoUpdate);
    return () => {
      window.removeEventListener('sk_primary_video_updated', handleVideoUpdate);
      window.removeEventListener('sk_site_data_updated', handleVideoUpdate);
    };
  }, []);

  // 2. Force video playback & configure muted autoplay for mobile and desktop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');

    const tryPlay = () => {
      video.muted = true;
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Autoplay restricted until user interaction
        });
      }
    };

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    tryPlay();

    // User gesture unlock for iOS Safari and mobile browsers
    const unlockVideo = () => {
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', unlockVideo, { passive: true, once: true });
    window.addEventListener('touchend', unlockVideo, { passive: true, once: true });
    window.addEventListener('click', unlockVideo, { passive: true, once: true });

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
      window.removeEventListener('touchstart', unlockVideo);
      window.removeEventListener('touchend', unlockVideo);
      window.removeEventListener('click', unlockVideo);
    };
  }, [bgVideoSrc]);

  // 2. Detect if scroll position is within Hero section (#home)
  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('home');
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        setInHero(rect.bottom > 120);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Scroll-linked 3D parallax on background video layer (Desktop only)
  useEffect(() => {
    const videoWrapper = videoWrapperRef.current;
    if (!videoWrapper) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) return;

    const ctx = gsap.context(() => {
      gsap.to(videoWrapper, {
        yPercent: 10,
        scale: 1.05,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // 4. Mouse 3D perspective tilt on background & cursor spotlight tracking
  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!inHero && videoWrapperRef.current) {
        const normX = (e.clientX / window.innerWidth - 0.5) * 2;
        const normY = (e.clientY / window.innerHeight - 0.5) * 2;

        gsap.to(videoWrapperRef.current, {
          rotateY: normX * 2,
          rotateX: -normY * 2,
          duration: 1.2,
          ease: 'power2.out',
          transformPerspective: 1200,
          force3D: true,
        });
      }

      // Fast responsive inner spotlight
      if (spotlightInnerRef.current) {
        gsap.to(spotlightInnerRef.current, {
          x: targetX,
          y: targetY,
          duration: 0.25,
          ease: 'power2.out',
          force3D: true,
        });
      }

      // Smooth lagging ambient outer glow
      if (spotlightOuterRef.current) {
        gsap.to(spotlightOuterRef.current, {
          x: targetX,
          y: targetY,
          duration: 0.85,
          ease: 'power3.out',
          force3D: true,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [inHero]);

  // 5. Interactive 3D Golden Particle Stardust Canvas (Desktop only for smooth mobile performance)
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) return; // Skip heavy particle physics loop on mobile to ensure 60fps smooth scrolling

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 35;
    const particles = [];
    let mouse = { x: -1000, y: -1000, radius: 140 };

    const handleCanvasMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleCanvasMouseMove);

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.8;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.density = Math.random() * 20 + 10;
        this.alpha = Math.random() * 0.4 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;

        // Mouse repulsion physics
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const directionX = (dx / distance) * force * this.density * 0.4;
          const directionY = (dy / distance) * force * this.density * 0.4;
          this.x -= directionX;
          this.y -= directionY;
        }
      }

      draw() {
        ctx.fillStyle = `rgba(245, 158, 11, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const connectParticles = () => {
      const maxDistance = 110;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const opacityValue = (1 - dist / maxDistance) * 0.12;
            ctx.strokeStyle = `rgba(212, 175, 55, ${opacityValue})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connectParticles();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
      {/* 1. HIGHLY VISIBLE & VIVID BACKGROUND VIDEO LAYER */}
      <div
        ref={videoWrapperRef}
        className="fixed inset-0 w-full h-full pointer-events-none will-change-transform z-0"
      >
        <video
          key={bgVideoSrc}
          ref={videoRef}
          src={bgVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          webkit-playsinline="true"
          preload="metadata"
          onCanPlay={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.play().catch(() => {});
          }}
          className="fixed inset-0 w-full h-full object-cover pointer-events-none opacity-95 filter brightness-105 contrast-105 z-0"
        />
      </div>

      {/* 2. FALLBACK LUXURY BACKGROUND IMAGE */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none opacity-70"
        style={{ backgroundImage: "url('/bg/luxury-background.png')" }}
      />

      {/* 3. LIGHT AMBIENT VIGNETTE FOR OPTIMAL TEXT CONTRAST WHILE KEEPING VIDEO 100% VISIBLE */}
      <div className="fixed inset-0 bg-black/25 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-blueprint-grid opacity-15 pointer-events-none z-0" />

      {/* 4. INTERACTIVE 3D FLOATING GOLD PARTICLE CANVAS (Desktop only) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none opacity-60 hidden sm:block"
      />

      {/* 5. MULTI-TIER CURSOR SPOTLIGHT TRACKER */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 ${
          inHero ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Core Spotlight */}
        <div
          ref={spotlightInnerRef}
          className="fixed top-0 left-0 w-[320px] h-[320px] bg-gradient-to-r from-amber-400/25 via-amber-500/15 to-transparent rounded-full blur-[70px] pointer-events-none -translate-x-1/2 -translate-y-1/2 will-change-transform"
        />

        {/* Diffused Ambient Halo */}
        <div
          ref={spotlightOuterRef}
          className="fixed top-0 left-0 w-[650px] h-[650px] bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-[130px] pointer-events-none -translate-x-1/2 -translate-y-1/2 will-change-transform"
        />
      </div>
    </div>
  );
};

export default MouseInteractiveBg;
