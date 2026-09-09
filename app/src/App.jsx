import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ConstructionStory from './components/ConstructionStory.jsx';
import WhyChooseUs from './components/WhyChooseUs.jsx';
import Gallery from './components/Gallery.jsx';
import Services from './components/Services.jsx';
import FeaturedProperties from './components/FeaturedProperties.jsx';
import Projects from './components/Projects.jsx';
import ContactCTA from './components/ContactCTA.jsx';
import Footer from './components/Footer.jsx';
import MobileQuickActions from './components/MobileQuickActions.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import FeedbackPage from './components/FeedbackPage.jsx';
import MouseInteractiveBg from './components/MouseInteractiveBg.jsx';
import AnimatedSectionDivider from './components/AnimatedSectionDivider.jsx';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScrollReveals } from './animations/reveal.js';

import { SiteDataProvider } from './hooks/useSiteData.jsx';

gsap.registerPlugin(ScrollTrigger);

const MainSite = () => {
  useEffect(() => {
    initScrollReveals();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    let lenisInstance = null;

    if (!isMobile) {
      // Initialize Lenis Smooth & Slow Momentum Scroll Engine for Desktop
      const lenis = new Lenis({
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.0,
        syncTouch: false,
      });
      lenisInstance = lenis;

      lenis.on('scroll', ScrollTrigger.update);

      const updateLenis = (time) => {
        lenis.raf(time * 1000);
      };

      gsap.ticker.add(updateLenis);
      gsap.ticker.lagSmoothing(0);
    }

    // Refresh ScrollTrigger calculations and handle hash restoration on page refresh
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();

      // If user refreshed on a section hash (e.g. #about, #services, #properties, #projects, #contact)
      const currentHash = window.location.hash;
      if (currentHash && currentHash.length > 1) {
        const targetEl = document.querySelector(currentHash);
        if (targetEl) {
          if (lenisInstance) {
            lenisInstance.scrollTo(targetEl, { offset: -60, duration: 1.2 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    }, 350);

    // Track active visible section and sync hash in URL so refresh always stays on same section
    const handleScrollHash = () => {
      const sectionIds = ['home', 'about', 'gallery', 'services', 'properties', 'projects', 'contact'];
      const scrollPosition = window.scrollY + 250;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const sec = document.getElementById(sectionIds[i]);
        if (sec) {
          const top = sec.offsetTop;
          if (scrollPosition >= top) {
            const expectedHash = `#${sectionIds[i]}`;
            if (window.location.hash !== expectedHash) {
              window.history.replaceState(null, '', expectedHash);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollHash, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScrollHash);
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    };
  }, []);

  return (
    <div className="font-sans text-white bg-transparent antialiased selection:bg-amber-500 selection:text-black pb-16 sm:pb-0 overflow-x-hidden w-full relative">
      <MouseInteractiveBg />
      <Navbar />
      <main className="w-full overflow-x-hidden relative z-10 bg-transparent">
        {/* 1. HOME — Hero Scrubbing */}
        <ConstructionStory />

        <AnimatedSectionDivider />

        {/* 2. ABOUT US — Why Choose Us & What Our Clients Say */}
        <WhyChooseUs />

        <AnimatedSectionDivider />

        {/* 3. GALLERY — Continuous Showcase Marquee */}
        <Gallery />

        <AnimatedSectionDivider />

        {/* 4. OUR SERVICES — What We Do */}
        <Services />

        <AnimatedSectionDivider />

        {/* 5. PROPERTIES — Featured Properties */}
        <FeaturedProperties />

        <AnimatedSectionDivider />

        {/* 6. PROJECTS — SEE HOW IT TAKES SHAPE */}
        <Projects />

        <AnimatedSectionDivider />

        {/* 7. CONTACT US — Have a Property in Mind */}
        <ContactCTA />
      </main>
      <Footer />
      <MobileQuickActions />
    </div>
  );
};

function App() {
  return (
    <SiteDataProvider>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </SiteDataProvider>
  );
}

export default App;

