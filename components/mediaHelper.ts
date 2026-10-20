export const SESSION_CB = Date.now();

const FALLBACK_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23f8fafc'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='bold' fill='%2394a3b8'>Sin Imagen</text></svg>";

export const getProxiedUrl = (url: string) => {
  if (!url || typeof url !== 'string' || url.trim() === '') return FALLBACK_IMAGE;
  if (url.includes('drive.google.com/uc?') || url.includes('drive.google.com/file/d/')) {
    const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}=s500`;
    }
  }
  if ((url.startsWith('http://') || url.includes('catalogo.grupodass.com.ar')) && !url.startsWith('http://localhost') && !url.includes('/api/media-proxy')) {
    return `/api/media-proxy?url=${encodeURIComponent(url)}&cb=${SESSION_CB}`;
  }
  return url;
};

// Lightweight on-demand preloader for hovered product galleries
const preloadedUrls = new Set<string>();
const queuedUrls = new Set<string>();
const preloadingQueue: string[] = [];
let activePreloads = 0;
const CONCURRENT_LIMIT = 2;

const processQueue = () => {
  while (activePreloads < CONCURRENT_LIMIT && preloadingQueue.length > 0) {
    const url = preloadingQueue.shift();
    if (!url) continue;
    queuedUrls.delete(url);

    if (!preloadedUrls.has(url)) {
      preloadedUrls.add(url);
      activePreloads++;
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = img.onerror = () => {
        activePreloads--;
        setTimeout(processQueue, 100);
      };
      img.src = url;
    }
  }
};

export const preloadImages = (urls: string[]) => {
  for (const rawUrl of urls) {
    if (!rawUrl || rawUrl.startsWith('data:')) continue;
    const url = getProxiedUrl(rawUrl);
    if (!preloadedUrls.has(url) && !queuedUrls.has(url)) {
      queuedUrls.add(url);
      preloadingQueue.push(url);
    }
  }
  processQueue();
};
