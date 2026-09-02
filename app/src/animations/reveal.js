import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initScrollReveals = () => {
  // Refresh ScrollTrigger positions cleanly after DOM load
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 250);

  // 1. Smooth Reveal Elements on Scroll for standalone unpinned elements
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (isMobile) {
    elements.forEach((el) => {
      gsap.set(el, { opacity: 1, y: 0, clearProps: 'all' });
    });
  } else {
    elements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  }

  // 2. SUBTLE & ELEGANT 3D MOUSE TILT & SPECULAR GLARE TRACKING (Gentle, non-intrusive)
  const attach3DTilt = () => {
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const tiltElements = document.querySelectorAll('.tilt-3d');

    tiltElements.forEach((card) => {
      if (card.dataset.tiltInitialized) return;
      card.dataset.tiltInitialized = 'true';

      const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Set CSS custom properties for radial specular glare
        const percentX = (mouseX / rect.width) * 100;
        const percentY = (mouseY / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${percentX}%`);
        card.style.setProperty('--mouse-y', `${percentY}%`);

        // Center-relative offsets for subtle 3D rotation (Reduced intensity)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const deltaX = (mouseX - centerX) / centerX; // -1 to 1
        const deltaY = (mouseY - centerY) / centerY; // -1 to 1

        gsap.to(card, {
          rotateY: deltaX * 2.5, // Subtle 2.5 deg max
          rotateX: -deltaY * 2.5,
          scale: 1.008, // Very subtle lift
          transformPerspective: 1200,
          ease: 'power1.out',
          duration: 0.3,
        });

        // Subtle 3D pop on inner badges
        const innerElevated = card.querySelectorAll('.translate-z-20, .translate-z-30, .translate-z-40');
        if (innerElevated.length > 0) {
          gsap.to(innerElevated, {
            z: 8,
            x: deltaX * 1.5,
            y: deltaY * 1.5,
            duration: 0.3,
            ease: 'power1.out',
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          ease: 'power3.out',
          duration: 0.5,
        });

        const innerElevated = card.querySelectorAll('.translate-z-20, .translate-z-30, .translate-z-40');
        if (innerElevated.length > 0) {
          gsap.to(innerElevated, {
            z: 0,
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'power3.out',
          });
        }
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });

    // 3. SUBTLE MAGNETIC BUTTON ATTRACTION
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach((btn) => {
      if (btn.dataset.magneticInitialized) return;
      btn.dataset.magneticInitialized = 'true';

      const handleBtnMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.05,
          y: y * 0.05,
          duration: 0.2,
          ease: 'power1.out',
        });
      };

      const handleBtnLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: 'elastic.out(1, 0.5)',
        });
      };

      btn.addEventListener('mousemove', handleBtnMove);
      btn.addEventListener('mouseleave', handleBtnLeave);
    });
  };

  attach3DTilt();

  // Re-run attachment periodically on dynamic data loads
  setTimeout(attach3DTilt, 600);
  setTimeout(attach3DTilt, 1500);
};
