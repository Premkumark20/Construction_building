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
import MouseInteractiveBg from './components/MouseInteractiveBg.jsx';
import AnimatedSectionDivider from './components/AnimatedSectionDivider.jsx';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScrollReveals } from './animations/reveal.js';

gsap.registerPlugin(ScrollTrigger);

const MainSite = () => {
  useEffect(() => {
    initScrollReveals();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      return;
    }

    // Initialize Lenis Smooth & Slow Momentum Scroll Engine for Desktop
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.0,
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    const handleRefresh = () => {
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    };

    window.addEventListener('sk_site_data_updated', handleRefresh);
    window.addEventListener('load', handleRefresh);

    return () => {
      gsap.ticker.remove(updateLenis);
      window.removeEventListener('sk_site_data_updated', handleRefresh);
      window.removeEventListener('load', handleRefresh);
      lenis.destroy();
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
    <Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
