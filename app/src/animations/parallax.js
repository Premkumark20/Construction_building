import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const initParallaxEffects = () => {
  if (typeof window === 'undefined' || window.innerWidth < 1024) return;

  const parallaxImages = document.querySelectorAll('.parallax-img');
  parallaxImages.forEach((img) => {
    gsap.to(img, {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: img.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
};
