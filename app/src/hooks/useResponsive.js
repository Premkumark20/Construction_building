import { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [state, setState] = useState(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Basic low power detection (hardwareConcurrency < 4 or mobile device)
    const isLowPower =
      typeof navigator !== 'undefined' &&
      ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || isMobile);

    return {
      width,
      isMobile,
      isTablet,
      isDesktop,
      isLowPower,
      prefersReducedMotion,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isLowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || isMobile;

      setState({
        width,
        isMobile,
        isTablet,
        isDesktop,
        isLowPower,
        prefersReducedMotion,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
};
