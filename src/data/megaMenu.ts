export type MegaMenuLink = {
  id: string;
  title: string;
  href: string;
};

export type MegaMenuSubCategory = {
  id: string;
  title: string;
  links: MegaMenuLink[];
};

export type MegaMenuItem = {
  id: string;
  title: string;
  href: string;
  active: boolean;
  order: number;
  icon?: string | null;
  subCategories: MegaMenuSubCategory[];
};

const STORAGE_KEY = 'mega_menu_v1';

const seedMegaMenu: MegaMenuItem[] = [
  {
    id: '1',
    title: 'دیجیتال',
    href: '/category/digital',
    active: true,
    order: 1,
    subCategories: [
      {
        id: '1-1',
        title: 'موبایل و تبلت',
        links: [
          { id: '1-1-1', title: 'گوشی موبایل', href: '/shop?category=دیجیتال&q=mobile' },
          { id: '1-1-2', title: 'تبلت', href: '/shop?category=دیجیتال&q=tablet' },
          { id: '1-1-3', title: 'لوازم جانبی', href: '/shop?category=دیجیتال&q=accessories' },
        ]
      },
      {
        id: '1-2',
        title: 'لپ‌تاپ و کامپیوتر',
        links: [
          { id: '1-2-1', title: 'لپ‌تاپ', href: '/shop?category=دیجیتال&q=laptop' },
          { id: '1-2-2', title: 'قطعات کامپیوتر', href: '/shop?category=دیجیتال&q=parts' },
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'مد و پوشاک',
    href: '/category/fashion',
    active: true,
    order: 2,
    subCategories: [
      {
        id: '2-1',
        title: 'مردانه',
        links: [
          { id: '2-1-1', title: 'پیراهن', href: '/shop?category=مد و پوشاک&q=shirt' },
          { id: '2-1-2', title: 'شلوار', href: '/shop?category=مد و پوشاک&q=pants' },
        ]
      },
      {
        id: '2-2',
        title: 'زنانه',
        links: [
          { id: '2-2-1', title: 'مانتو', href: '/shop?category=مد و پوشاک&q=manto' },
          { id: '2-2-2', title: 'شال و روسری', href: '/shop?category=مد و پوشاک&q=scarf' },
        ]
      }
    ]
  }
];

export function getMegaMenu(): MegaMenuItem[] {
  if (typeof window === 'undefined') return seedMegaMenu;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMegaMenu));
    return seedMegaMenu;
  }
  try {
    const parsed: MegaMenuItem[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedMegaMenu;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMegaMenu));
    return seedMegaMenu;
  }
}

export function saveMegaMenu(list: MegaMenuItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function updateMegaMenu(items: MegaMenuItem[]) {
    saveMegaMenu(items);
    return items;
}
