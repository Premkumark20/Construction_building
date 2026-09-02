import React from 'react';

const AnimatedSectionDivider = () => {
  return (
    <div className="relative w-full overflow-hidden py-3 z-20 pointer-events-none perspective-800">
      {/* 1. Base Ultra-Fine Gold Gradient Horizon Line */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.3)]" />

      {/* 2. Sweeping Laser Photon Energy Beam */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[2px] overflow-hidden">
        <div className="w-1/4 h-full bg-gradient-to-r from-transparent via-amber-300 to-transparent blur-[1px] shadow-[0_0_16px_rgba(252,211,77,0.9)] animate-laser-sweep" />
      </div>

      {/* 3. Ambient Diffused Center Flare */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-6 bg-amber-500/20 rounded-full blur-xl animate-ambient-pulse" />

      {/* 4. Center 3D Rotating Gold Octahedron / Diamond Prism */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 preserve-3d">
        {/* Outer Ring */}
        <div className="w-5 h-5 rounded-md rotate-45 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.8)] bg-[#09090b]/90 flex items-center justify-center animate-prism-3d">
          {/* Inner Core Solid Gold Diamond */}
          <div className="w-2 h-2 rotate-45 bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_8px_rgba(252,211,77,1)]" />
        </div>
      </div>
    </div>
  );
};

export default AnimatedSectionDivider;
