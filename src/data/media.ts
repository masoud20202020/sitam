
const MEDIA_STORAGE_KEY = 'sitam_media_library';

export interface MediaItem {
  id: string;
  url: string;
  filename: string; // just the name e.g. "image-123.jpg"
  alt: string;
  title: string;
  size: number;
  width: number;
  height: number;
  createdAt: number;
}

export function getMediaLibrary(): MediaItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(MEDIA_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addMediaItem(item: MediaItem) {
  const items = getMediaLibrary();
  items.unshift(item); // Add to top
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
}

export function updateMediaItem(id: string, updates: Partial<MediaItem>) {
  const items = getMediaLibrary();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(items));
  }
}

export function deleteMediaItem(id: string) {
  const items = getMediaLibrary();
  const filtered = items.filter(i => i.id !== id);
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(filtered));
}

export function deleteMediaItems(ids: string[]) {
  const items = getMediaLibrary();
  const filtered = items.filter(i => !ids.includes(i.id));
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(filtered));
}
