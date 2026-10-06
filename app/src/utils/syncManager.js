// Cross-tab, Cross-window, and Cross-device real-time sync manager

export const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('sk_site_sync_channel')
  : null;

export const triggerDataSync = (detail = {}) => {
  const timestamp = Date.now().toString();
  try {
    localStorage.setItem('sk_site_data_updated', timestamp);
    localStorage.setItem('data_updated', timestamp);
    localStorage.setItem('sk_primary_video_updated', timestamp);
    localStorage.setItem('primary_video_updated', timestamp);
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sk_site_data_updated', { detail }));
    window.dispatchEvent(new CustomEvent('data_updated', { detail }));
    window.dispatchEvent(new CustomEvent('sk_primary_video_updated', { detail }));
    window.dispatchEvent(new CustomEvent('primary_video_updated', { detail }));
  }

  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'DATA_UPDATED', timestamp, ...detail });
    } catch (e) {}
  }
};
