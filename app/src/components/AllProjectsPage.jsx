import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronLeft, Search, HardHat, Home, X } from 'lucide-react';
import Navbar from './Navbar.jsx';
import MouseInteractiveBg from './MouseInteractiveBg.jsx';
import { useSiteData } from '../hooks/useSiteData.jsx';

const AllProjectsPage = () => {
  const navigate = useNavigate();
  const { projects, loading } = useSiteData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Projects');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const safeProjects = (Array.isArray(projects) ? projects : []).filter(p => p.published !== 0);

  const filteredProjects = safeProjects.filter((item) => {
    const matchesStatus = statusFilter === 'All Projects' || item.status === statusFilter;
    const name = (item.name || item.title || '').toLowerCase();
    const loc = (item.location || item.area || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || loc.includes(query);

    return matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (item) => {
    navigate('/project-details', { state: { item } });
  };

  const filterTabs = ['All Projects', 'Completed', 'Under Construction', 'Sold Out'];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <MouseInteractiveBg />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-28 relative z-10 space-y-8">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <button
            onClick={() => navigate('/#projects', { state: { scrollTo: 'projects', immediate: true } })}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black text-white px-4 py-2 rounded-full font-bold text-xs transition-all w-fit cursor-pointer"
          >
            <ChevronLeft size={16} /> Back to Projects Showcase
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-full">
              CONSTRUCTION PROJECTS CATALOG
            </span>
          </div>
        </div>

        {/* Page Title & Search / Filter Controls */}
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              All Construction <span className="text-gold-gradient">Projects</span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium">
              Explore completed individual villa projects and ongoing contract construction site milestones across Poonamallee & Kundrathur.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#121216] p-4 sm:p-5 rounded-3xl border border-white/15 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search project name or location..."
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

            {/* Filter Tabs */}
            <div className="flex bg-[#18181c] p-1 rounded-2xl border border-white/10 overflow-x-auto w-full md:w-auto justify-start md:justify-end">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-12 text-center text-zinc-400 space-y-3">
            <HardHat size={48} className="mx-auto text-amber-400/60" />
            <h3 className="text-lg font-bold text-white">No Projects Found</h3>
            <p className="text-xs max-w-sm mx-auto">No construction project records match your search query or filter selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProjects.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => handleOpenDetail(item)}
                className="gold-specular-card bg-[#121216] rounded-2xl overflow-hidden border border-white/10 shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 relative"
              >
                <div className="specular-glare" />

                <div className="relative z-10">
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black border-b border-white/10 flex items-center justify-center">
                    {(item.cover_image && item.cover_image !== '/house/completed-house.jpg' && !item.cover_image.includes('logo')) || (item.image && item.image !== '/house/completed-house.jpg' && !item.image.includes('logo')) ? (
                      <img
                        src={item.cover_image || item.image}
                        alt={item.name || item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1c1c20] to-[#0a0a0c] flex items-center justify-center text-amber-400">
                        <Home size={42} className="text-amber-400/80" />
                      </div>
                    )}
                    <div
                      className={`absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-md ${
                        item.status === 'Completed'
                          ? 'bg-green-500/90 text-white'
                          : item.status === 'Under Construction'
                            ? 'bg-amber-500/90 text-black'
                            : 'bg-purple-900/90 text-white'
                      }`}
                    >
                      {item.status}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-extrabold text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                      {item.name || item.title}
                    </h3>
                    <p className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
                      <MapPin size={12} className="text-amber-400" /> {item.location || item.area || ''}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 pt-0 flex items-center justify-between relative z-10">
                  <span className="text-xs font-mono text-amber-400 font-semibold">{item.project_type || 'Individual House'}</span>
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
            ))}
          </div>
        )}

      </main>

    </div>
  );
};

export default AllProjectsPage;
