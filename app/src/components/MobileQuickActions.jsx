import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useSiteData } from '../hooks/useSiteData.js';
import { handlePhoneCall, getWhatsAppUrl, getCleanPhone } from '../utils/phoneUtils.js';

const MobileQuickActions = () => {
  const { settings } = useSiteData();
  const rawPhone = settings?.phone || '';
  const cleanPhone = getCleanPhone(rawPhone);
  const waNum = settings?.whatsapp_number || '';

  if (!cleanPhone && !waNum) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-2xl border-t border-amber-500/30 p-2.5 px-4 flex gap-3 shadow-2xl">
      {cleanPhone && (
        <a
          href={`tel:+91${cleanPhone}`}
          onClick={(e) => handlePhoneCall(e, rawPhone)}
          className={`flex-1 bg-[#121216] active:bg-[#18181c] text-amber-400 font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md border border-amber-500/40 active:scale-95 transition-all cursor-pointer ${!waNum ? 'w-full' : ''}`}
        >
          <Phone size={16} /> Call Now
        </a>
      )}
      {waNum && (
        <a
          href={getWhatsAppUrl(waNum, "Hi, I'm interested in your construction and property services.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-400 active:to-amber-500 text-black font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
      )}
    </div>
  );
};

export default MobileQuickActions;
