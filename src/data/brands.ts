
export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive?: boolean;
};

const STORAGE_KEY = 'brands_v1';

export const seedBrands: Brand[] = [
  { id: '1', name: 'سامسونگ', slug: 'samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png', isActive: true },
  { id: '2', name: 'شیائومی', slug: 'xiaomi', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/2048px-Xiaomi_logo_%282021-%29.svg.png', isActive: true },
  { id: '3', name: 'اپل', slug: 'apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png', isActive: true },
  { id: '4', name: 'نایک', slug: 'nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png', isActive: true },
  { id: '5', name: 'سونی', slug: 'sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sony_logo.svg/2560px-Sony_logo.svg.png', isActive: true },
  { id: '6', name: 'ال‌سی وایکیکی', slug: 'lc-waikiki', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/LC_Waikiki_logo.svg/2560px-LC_Waikiki_logo.svg.png', isActive: true },
];

export function getBrands(): Brand[] {
  if (typeof window === 'undefined') return seedBrands;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBrands));
    return seedBrands;
  }
  try {
    const parsed = JSON.parse(raw) as Brand[];
    // Ensure isActive field exists for old data
    return parsed.map((b) => ({ ...b, isActive: b.isActive !== undefined ? b.isActive : true }));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBrands));
    return seedBrands;
  }
}

export function getActiveBrands(): Brand[] {
  return getBrands().filter(b => b.isActive !== false);
}

export function saveBrands(list: Brand[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addBrand(brand: Omit<Brand, 'id'>) {
  const brands = getBrands();
  const newBrand = { ...brand, id: Date.now().toString(), isActive: brand.isActive !== undefined ? brand.isActive : true };
  brands.push(newBrand);
  saveBrands(brands);
  return newBrand;
}

export function updateBrand(id: string, updates: Partial<Brand>) {
  const brands = getBrands();
  const index = brands.findIndex(b => b.id === id);
  if (index === -1) return null;
  brands[index] = { ...brands[index], ...updates };
  saveBrands(brands);
  return brands[index];
}

export function deleteBrand(id: string) {
  const brands = getBrands();
  const filtered = brands.filter(b => b.id !== id);
  saveBrands(filtered);
}

export function getBrandBySlug(slug: string) {
  const brands = getBrands();
  return brands.find(b => b.slug === slug);
}
