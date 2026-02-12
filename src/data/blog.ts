export type BlogPost = {
  id: string | number;
  title: string;
  excerpt: string;
  content?: string; // HTML content
  author: string;
  date: string;
  category: string;
  image?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  published?: boolean;
  relatedProductIds?: number[];
};

const STORAGE_KEY = 'blog_posts_v3';

export const seedPosts: BlogPost[] = [
  { 
    id: 1, 
    title: 'بررسی تخصصی ساعت هوشمند شیائومی', 
    excerpt: 'در این مقاله به بررسی ویژگی‌ها و قابلیت‌های ساعت هوشمند شیائومی می‌پردازیم...', 
    content: '<p>ساعت‌های هوشمند شیائومی با قیمت مناسب و امکانات فراوان، انتخابی عالی برای کاربران هستند. این ساعت‌ها دارای عمر باتری طولانی، نمایشگر باکیفیت و قابلیت‌های پایش سلامت هستند.</p><p>اگر به دنبال خرید یک ساعت هوشمند اقتصادی و کارآمد هستید، این مدل را از دست ندهید.</p>',
    author: 'امیر رضایی', 
    date: '۱۴۰۳/۰۲/۱۵', 
    category: 'تکنولوژی', 
    image: '/placeholder.svg',
    slug: 'xiaomi-smartwatch-review',
    published: true,
    relatedProductIds: [3] // Xiaomi Watch
  },
  { 
    id: 2, 
    title: 'چرا کفش‌های نایک بهترین انتخاب برای دویدن هستند؟', 
    excerpt: 'تکنولوژی‌های به کار رفته در کفش‌های نایک که تجربه دویدن شما را متحول می‌کنند...', 
    content: '<p>کفش‌های ورزشی نایک با بهره‌گیری از تکنولوژی‌های روز دنیا، ضربه‌گیری عالی و راحتی بی‌نظیری را فراهم می‌کنند. طراحی ارگونومیک و مواد اولیه باکیفیت، این کفش‌ها را به انتخابی ایده‌آل برای ورزشکاران حرفه‌ای و آماتور تبدیل کرده است.</p>',
    author: 'سارا احمدی', 
    date: '۱۴۰۳/۰۲/۱۸', 
    category: 'مد و پوشاک', 
    image: '/placeholder.svg',
    slug: 'why-nike-shoes-are-best-for-running',
    published: true,
    relatedProductIds: [2] // Nike Shoes
  },
  { 
    id: 3, 
    title: 'راهنمای ست کردن تی‌شرت‌های تابستانی', 
    excerpt: 'چگونه با تی‌شرت‌های ساده، استایلی شیک و جذاب داشته باشیم...', 
    content: '<p>تی‌شرت‌های نخی یکی از اجزای اصلی کمد لباس تابستانی هستند. با ترکیب رنگ‌های مناسب و انتخاب سایز درست، می‌توانید استایل‌های کژوال و جذابی خلق کنید. در این مقاله چند ایده برای ست کردن تی‌شرت با شلوار جین و کتان را بررسی می‌کنیم.</p>',
    author: 'مهسا کریمی', 
    date: '۱۴۰۳/۰۲/۲۰', 
    category: 'سبک زندگی', 
    image: '/placeholder.svg',
    slug: 'summer-tshirt-styling-guide',
    published: true,
    relatedProductIds: [5] // LC Waikiki T-shirt
  },
  { 
    id: 4, 
    title: 'نکات طلایی برای مراقبت از پوست در فصل پاییز', 
    excerpt: 'پاییز فصل تغییرات است و پوست شما نیاز به مراقبت‌های ویژه‌ای دارد. در این مقاله به بررسی روتین‌های پوستی مناسب این فصل می‌پردازیم...', 
    content: '<p>با شروع فصل پاییز و کاهش رطوبت هوا، خشکی پوست یکی از مشکلات رایج است. استفاده از مرطوب‌کننده‌های قوی و شوینده‌های ملایم می‌تواند به حفظ سلامت پوست شما کمک کند.</p>',
    author: 'دکتر پوستچی', 
    date: '۱۴۰۳/۰۷/۱۰', 
    category: 'زیبایی و سلامت', 
    image: '/placeholder.svg',
    slug: 'autumn-skincare-tips',
    published: true,
    relatedProductIds: [] 
  }
];

export function getBlogPosts(): BlogPost[] {
  if (typeof window === 'undefined') return seedPosts;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
    return seedPosts;
  }
  try {
    const parsed: BlogPost[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedPosts;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
    return seedPosts;
  }
}

export function saveBlogPosts(list: BlogPost[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getLatestBlogPosts(limit = 3): BlogPost[] {
  const posts = getBlogPosts();
  return posts
    .filter(p => p.published !== false)
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id)) // Assuming newer IDs are larger/newer
    .slice(0, Math.max(1, limit));
}

export function getBlogPostById(id: string | number): BlogPost | undefined {
  return getBlogPosts().find(p => String(p.id) === String(id));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getBlogPosts().find(p => p.slug === slug);
}

export function addBlogPost(post: BlogPost) {
  const posts = getBlogPosts();
  posts.unshift(post);
  saveBlogPosts(posts);
}

export function updateBlogPost(post: BlogPost) {
  const posts = getBlogPosts();
  const index = posts.findIndex(p => String(p.id) === String(post.id));
  if (index !== -1) {
    posts[index] = post;
    saveBlogPosts(posts);
  }
}

export function deleteBlogPost(id: string | number) {
  const posts = getBlogPosts();
  const newPosts = posts.filter(p => String(p.id) !== String(id));
  saveBlogPosts(newPosts);
}
