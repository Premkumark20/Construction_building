import React, { useState, useEffect } from 'react';
import { Star, Send, CheckCircle, MessageSquare, X, Sparkles, MapPin, Phone, ShieldCheck, MessageCircle } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData.js';

const FeedbackPage = () => {
  const { settings } = useSiteData();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [hoverRating, setHoverRating] = useState(0);

  const [formData, setFormData] = useState({
    client_name: '',
    phone: '',
    location: '',
    service: 'Contract Construction',
    rating: 5,
    message: ''
  });

  const ratingDescriptions = {
    5: 'Outstanding — Exceeded all expectations!',
    4: 'Very Good — High quality & professional.',
    3: 'Good — Satisfactory experience.',
    2: 'Fair — Needs some improvements.',
    1: 'Poor — Unsatisfactory.'
  };

  const handleCloseTab = () => {
    window.close();
  };

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    document.title = `Client Feedback & Reviews - ${settings?.company_name || 'SK Builders'}`;
  }, [settings?.company_name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name.trim() || !formData.message.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in your name and feedback message.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: 'Thank you for your valuable feedback! Your review has been submitted successfully.'
        });
        setFormData({
          client_name: '',
          phone: '',
          location: '',
          service: 'House Construction',
          rating: 5,
          message: ''
        });
        fetchFeedbacks();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to submit feedback. Please try again.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return '5.0';
    const total = feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0);
    return (total / feedbacks.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-amber-500 selection:text-black font-sans relative overflow-x-hidden">
      {/* Ambient Gold Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-b border-amber-500/20 py-2.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img
                src={settings?.logo_url || '/logo/sk-builders-logo.png'}
                alt={`${settings?.company_name || 'SK Builders'} Logo`}
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white leading-tight">
                {settings?.company_name || 'SK BUILDERS'}
              </h1>
              <p className="text-[8.5px] sm:text-[9.5px] font-bold text-amber-400 tracking-wider uppercase">
                {settings?.company_subtitle || '& PROPERTY CONSULTANT'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseTab}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 text-xs font-bold border border-zinc-700/80 hover:border-red-500/40 transition-all cursor-pointer group shadow-sm active:scale-95"
            title="Close this feedback tab"
          >
            <X size={14} className="group-hover:scale-110 transition-transform text-red-400" />
            <span>Close Tab</span>
          </button>
        </div>
      </header>

      {/* Main Container - Expansive max-w-6xl Width */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-7 relative z-10 space-y-6">
        {/* Title Section */}
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10.5px] font-extrabold uppercase tracking-widest">
            <Sparkles size={11} /> Client Feedback & Reviews
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Share Your Experience with SK Builders
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            Your feedback helps us continuously improve our construction quality and property consultation services.
          </p>
        </div>

        {/* SECTION 1: FEEDBACK SUBMISSION CARD */}
        <div className="bg-gradient-to-br from-[#141418]/95 via-[#121216]/90 to-[#0c0c0e]/95 p-4 sm:p-6 rounded-2xl border border-amber-500/30 shadow-xl backdrop-blur-xl relative overflow-hidden">
          <div className="specular-glare pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="border-b border-white/10 pb-2.5 flex items-center justify-between gap-3">
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-400" /> Share Your Review
              </h3>
              <span className="text-[9.5px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck size={11} /> Verified Feedback
              </span>
            </div>

            {statusMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/20 border border-red-500/40 text-red-300'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                ) : (
                  <ShieldCheck size={15} className="text-red-400 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Star Rating Interactive Selector */}
              <div className="bg-[#09090b]/80 px-4 py-2 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider">
                    Rating:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={20}
                          className={`transition-colors ${
                            (hoverRating || formData.rating) >= star
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                              : 'text-zinc-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-black text-amber-300 ml-1">
                    {formData.rating}/5
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 italic">
                  {ratingDescriptions[hoverRating || formData.rating]}
                </span>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold text-zinc-400 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar / Senthil & Family"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-zinc-400 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-zinc-400 mb-1">
                    Service Utilized
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Contract Construction">Contract Construction</option>
                    <option value="Individual House Purchase">Individual House Purchase (Company Built)</option>
                    <option value="Residential Land Purchase">Residential Land / Plot Purchase</option>
                    <option value="Property Consultation">Property Consultation & Valuation</option>
                    <option value="Documentation Support">Legal & Documentation Support</option>
                    <option value="General Feedback">General Client Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-zinc-400 mb-1">
                    Location / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Poonamallee, Mangadu, Kundrathur"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-zinc-400 mb-1">
                  Your Review & Feedback Message *
                </label>
                <textarea
                  rows="2"
                  placeholder="Share details about your experience, construction quality, project delivery, or property purchase..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-md shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} /> <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 2: CLIENT FEEDBACKS DISPLAY - ONE BY ONE ROW */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Client Reviews ({feedbacks.length})
              </h3>
            </div>

            <div className="flex items-center gap-2 bg-[#18181b] px-3 py-1 rounded-xl border border-zinc-800 shrink-0 text-xs">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={14} fill="currentColor" />
                <span className="font-black text-white">{calculateAverageRating()}</span>
              </div>
              <span className="text-[10.5px] text-zinc-400 font-bold border-l border-zinc-700 pl-2">
                Average Rating
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="bg-[#18181b]/70 p-4 rounded-xl border border-zinc-800 animate-pulse space-y-2">
                  <div className="w-36 h-4 bg-zinc-800 rounded" />
                  <div className="w-full h-8 bg-zinc-800/40 rounded" />
                </div>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="bg-[#18181b]/90 border border-zinc-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2">
              <MessageSquare size={22} className="text-amber-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">No Feedbacks Yet</h4>
              <p className="text-[11px] text-zinc-400">Be the first to share your experience with SK Builders!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((item) => (
                <div
                  key={item.id}
                  className="bg-gradient-to-br from-[#141418] to-[#0e0e12] hover:from-[#18181e] hover:to-[#121218] p-4 sm:p-5 rounded-2xl border border-zinc-800 hover:border-amber-500/40 transition-all space-y-2.5 shadow-md"
                >
                  {/* Top Row: Client Info, Location, Service Tag, Stars & Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm sm:text-base text-white">
                        {item.client_name}
                      </span>
                      {item.location && (
                        <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1">
                          <MapPin size={10} className="text-amber-400" />
                          {item.location}
                        </span>
                      )}
                      {item.service && (
                        <span className="text-[10px] font-extrabold text-amber-400/90 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {item.service}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                      {/* 5-Star Display */}
                      <div className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < (item.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
                          />
                        ))}
                        <span className="text-[11px] font-black text-amber-300 ml-1">
                          {item.rating || 5}/5
                        </span>
                      </div>

                      {/* Date Submitted */}
                      <div className="text-[10px] font-mono text-zinc-400 bg-[#09090b] px-2.5 py-1 rounded-lg border border-zinc-800">
                        {item.created_at
                          ? new Date(item.created_at.includes('T') ? item.created_at : item.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'Recently'}
                      </div>
                    </div>
                  </div>

                  {/* Review Message Text - Full Width Row Box */}
                  <div className="bg-[#09090b]/70 px-3.5 py-2.5 rounded-xl border border-white/5 text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed italic">
                    {item.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FeedbackPage;
