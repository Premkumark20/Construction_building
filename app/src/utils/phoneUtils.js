// Phone and WhatsApp Handler Utility
export const getCleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
};

export const handlePhoneCall = (e, phone) => {
  const clean = getCleanPhone(phone);
  if (!clean) return;

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`+91${clean}`).then(() => {
        alert(`Contact Phone Number:\n+91 ${clean}\n\n(Copied to clipboard!)`);
      }).catch(() => {
        alert(`Contact Phone Number: +91 ${clean}`);
      });
    } else {
      alert(`Contact Phone Number: +91 ${clean}`);
    }
  }
};

export const getWhatsAppUrl = (phone, text = "Hi, I'm interested in your construction and property services.") => {
  const clean = getCleanPhone(phone);
  if (!clean) return '#contact';
  const numWithCountry = clean.length === 10 ? `91${clean}` : clean;
  return `https://api.whatsapp.com/send/?phone=${numWithCountry}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
};
