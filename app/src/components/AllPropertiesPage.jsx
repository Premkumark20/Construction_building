import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Maximize, ChevronLeft, Search, Home, X } from 'lucide-react';
import Navbar from './Navbar.jsx';
import MouseInteractiveBg from './MouseInteractiveBg.jsx';
import { useSiteData } from '../hooks/useSiteData.jsx';

const getStatusBadgeStyle = (status) => {
  const s = (status || 'Available').toLowerCase();
  if (s.includes('under construction') || s.includes('construction')) {
    return 'bg-amber-500/90 text-black border border-amber-400/80 shadow-amber-500/30';
  }
  if (s.includes('sold')) {
    return 'bg-red-500/90 text-white border border-red-400/80 shadow-red-500/30';
  }
  if (s.includes('negotiation')) {
    return 'bg-blue-500/90 text-white border border-blue-400/80 shadow-blue-500/30';
  }
  return 'bg-emerald-600/90 text-white border border-emerald-400/80 shadow-emerald-500/30';
};

const AllPropertiesPage = () => {
  const navigate = useNavigate();
  const { properties, land, loading } = useSiteData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const safeProperties = (Array.isArray(properties) ? properties : []).filter(p => p.published !== 0);
  const safeLand = (Array.isArray(land) ? land : []).filter(l => l.published !== 0);

  const allCombinedItems = [
    ...safeProperties.map(p => ({ ...p, itemCategory: 'House' })),
    ...safeLand.map(l => ({ ...l, itemCategory: 'Land' }))
  ];

  const filteredItems = allCombinedItems.filter(item => {
    const matchesCategory =
      categoryFilter === 'All' ||
      (categoryFilter === 'Houses' && item.itemCategory === 'House') ||
      (categoryFilter === 'Lands' && item.itemCategory === 'Land');

    const itemStatus = item.status || 'Available';
    const matchesStatus =
      statusFilter === 'All' ||
      itemStatus.toLowerCase().includes(statusFilter.toLowerCase());

    const title = (item.title || '').toLowerCase();
    const loc = (item.location || item.area || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = title.includes(query) || loc.includes(query);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (item) => {
    const isLand = item.itemCategory === 'Land' || item.land_type || item.total_price;
    navigate('/property-details', { state: { item, type: isLand ? 'land' : 'property' } });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <MouseInteractiveBg />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10 space-y-8">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <button
            onClick={() => navigate('/#properties', { state: { scrollTo: 'properties', immediate: true } })}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-full font-bold text-xs transition-all w-fit cursor-pointer"
          >
            <ChevronLeft size={16} /> Back to Featured Properties
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full">
              PROPERTIES & LANDS CATALOG
            </span>
          </div>
        </div>

        {/* Page Title & Search / Filter Controls */}
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              All Properties & <span className="text-gold-gradient">Land Plots</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium">
              Browse our complete inventory of individual houses, villas, and DTCP approved residential land plots in Chennai.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#121216] p-4 sm:p-5 rounded-3xl border border-white/15 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search property title or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181c] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
              
              {/* Category Pills */}
              <div className="flex bg-[#18181c] p-1 rounded-2xl border border-white/10">
                {['All', 'Houses', 'Lands'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Pills */}
              <div className="flex bg-[#18181c] p-1 rounded-2xl border border-white/10">
                {['All', 'Available', 'Construction', 'Sold'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-zinc-800 text-amber-400 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

            </div>

          </div>
        </div>

        {/* Properties Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-12 text-center text-zinc-400 space-y-3">
            <Home size={48} className="mx-auto text-amber-400/60" />
            <h3 className="text-lg font-bold text-white">No Properties Found</h3>
            <p className="text-xs max-w-sm mx-auto">No listings match your search or filter criteria. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item, idx) => {
              const isLandItem = item.itemCategory === 'Land' || item.land_type || item.total_price;
              const priceVal = item.price || item.total_price || 'Price on Request';
              const typeLabel = item.type || item.land_type || (isLandItem ? 'Residential Plot' : 'Individual House');
              const sizeLabel = item.builtup_area || (item.plot_area ? `${item.plot_area} ${item.plot_area_unit || 'sq.ft'}` : 'N/A');

              return (
                <div
                  key={`${item.itemCategory}-${item.id}-${idx}`}
                  onClick={() => handleOpenDetail(item)}
                  className="gold-specular-card bg-[#121216] rounded-2xl overflow-hidden border border-white/10 shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 relative"
                >
                  <div className="specular-glare" />

                  <div className="relative z-10">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black border-b border-white/10 flex items-center justify-center">
                      {item.image && item.image !== '/house/completed-house.jpg' && !item.image.includes('logo') ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br from-[#1c1c20] to-[#0a0a0c] flex items-center justify-center ${isLandItem ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isLandItem ? <MapPin size={42} className="text-emerald-400/80" /> : <Home size={42} className="text-amber-400/80" />}
                        </div>
                      )}
                      <div className={`absolute top-2.5 left-2.5 backdrop-blur-md text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md ${getStatusBadgeStyle(item.status)}`}>
                        {item.status || 'Available'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-amber-400 font-black uppercase text-[10px] tracking-wider truncate max-w-[130px]">{typeLabel}</span>
                        <span className="flex items-center gap-1 text-zinc-400 font-semibold shrink-0 text-[10px]">
                          <MapPin size={11} className="text-amber-400" /> {item.location || item.area || ''}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>

                      {/* Specs Row */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-300 font-medium border-t border-white/10 pt-2">
                        {item.bedrooms && item.bedrooms !== 'N/A' && (
                          <div className="flex items-center gap-1">
                            <BedDouble size={13} className="text-amber-400" />
                            <span>{item.bedrooms} BHK</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Maximize size={13} className="text-amber-400" />
                          <span>{sizeLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-0 flex items-center justify-between relative z-10">
                    <div className="text-sm font-black text-amber-400">{priceVal}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item);
                      }}
                      className="bg-white/10 group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-amber-600 text-white group-hover:text-black text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

    </div>
  );
};

export default AllPropertiesPage;
