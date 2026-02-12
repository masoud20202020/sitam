export type Category = { 
  id: string | number; 
  name: string; 
  slug?: string;
  description?: string;
  parentId?: string | number | null;
  icon?: string;
  isActive?: boolean;
  isPopular?: boolean;
  popularImage?: string;
};

const STORAGE_KEY = 'categories';

export const seedCategories: Category[] = [
  { id: 1, name: 'دیجیتال', slug: 'digital', description: 'محصولات الکترونیکی و دیجیتال', parentId: null, icon: '', isActive: true, isPopular: true },
  { id: 2, name: 'مد و پوشاک', slug: 'fashion', description: 'پوشاک، لباس و مد', parentId: null, icon: '', isActive: true, isPopular: true },
  { id: 3, name: 'کیف و کفش', slug: 'bags-shoes', description: 'انواع کیف‌ها و کفش‌ها', parentId: null, icon: '', isActive: true, isPopular: true },
  { id: 4, name: 'اکسسوری', slug: 'accessories', description: 'لوازم جانبی و اکسسوری', parentId: null, icon: '', isActive: true, isPopular: true },
  { id: 5, name: 'لوازم خانگی', slug: 'home-appliances', description: 'ملزومات و لوازم خانه', parentId: null, icon: '', isActive: true, isPopular: true },
];

export function getCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCategories));
    return seedCategories;
  }
  try {
    const parsed: Category[] = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(c => ({ 
          id: c.id, 
          name: c.name, 
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'), // Fallback for existing data
          description: c.description,
          parentId: c.parentId,
          icon: c.icon,
          isActive: c.isActive !== undefined ? c.isActive : true,
          isPopular: c.isPopular,
          popularImage: c.popularImage
        }))
      : seedCategories;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCategories));
    return seedCategories;
  }
}

export function saveCategories(list: Category[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addCategory(name: string, description?: string, parentId?: string | number | null, slug?: string, icon?: string, isActive: boolean = true, isPopular: boolean = false, popularImage?: string) {
  const list = getCategories();
  const exists = list.some(c => c.name.trim() === name.trim() && c.parentId == parentId);
  if (exists) return;
  const newItem: Category = { 
    id: Date.now(), 
    name: name.trim(), 
    slug: slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
    description: description?.trim(),
    parentId: parentId || null,
    icon: icon,
    isActive: isActive,
    isPopular: isPopular,
    popularImage: popularImage
  };
  list.push(newItem);
  saveCategories(list);
}

export function deleteCategory(id: string | number) {
  const list = getCategories().filter(c => String(c.id) !== String(id));
  saveCategories(list);
}

export function updateCategory(id: string | number, patch: Partial<Category>) {
  const list = getCategories();
  const idx = list.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  saveCategories(list);
  return list[idx];
}

export function getCategoryById(id: string | number): Category | undefined {
  return getCategories().find(c => String(c.id) === String(id));
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find(c => c.slug === slug || c.slug === decodeURIComponent(slug));
}

export function getActiveCategories(): Category[] {
  return getCategories().filter(c => c.isActive !== false);
}

export function getPopularCategories(): Category[] {
  return getCategories().filter(c => c.isActive !== false && c.isPopular === true);
}
