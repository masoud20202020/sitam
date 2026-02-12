import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { PopularCategories } from '@/components/PopularCategories';
import { TrendingProducts } from '@/components/TrendingProducts';
import { MiddleBanner } from '@/components/MiddleBanner';
import { TrustFeatures } from '@/components/TrustFeatures';
import { BottomBanners } from '@/components/BottomBanners';
import dynamic from 'next/dynamic';
import { Footer } from '@/components/Footer';
import { LatestPosts } from '@/components/LatestPosts';
import { TopBrands } from '@/components/TopBrands';
import { SmartRecommendations } from '@/components/SmartRecommendations';
import { PromoBanners } from '@/components/PromoBanners';
import { FeaturedProducts } from '@/components/FeaturedProducts';
import { getProductsAction } from '@/actions/products';
import { getCategoriesAction } from '@/actions/categories';
import { getBrandsAction } from '@/actions/brands';
import { getLatestBlogPostsAction } from '@/actions/blog';
import { getBannersAction } from '@/actions/banners';
import type { Brand } from '@/data/brands';

const ProductList = dynamic(() => import('@/components/ProductList').then(m => m.ProductList), {
  ssr: true,
});

export default async function Home() {
  const [products, categories, brandsRes, posts, bannersRes] = await Promise.all([
    getProductsAction(),
    getCategoriesAction(),
    getBrandsAction(),
    getLatestBlogPostsAction(4),
    getBannersAction()
  ]);
  const banners = bannersRes.success && bannersRes.data ? bannersRes.data : [];
  const brands = brandsRes.success && brandsRes.data ? (brandsRes.data as Array<{
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    isActive?: boolean | null;
  }>) : [];
  const brandsMapped: Brand[] = brands.map((b) => ({
    id: String(b.id),
    name: b.name || '',
    slug: b.slug || String(b.id),
    logo: b.logo || undefined,
    description: b.description || undefined,
    seoTitle: b.seoTitle || undefined,
    seoDescription: b.seoDescription || undefined,
    isActive: b.isActive === null || b.isActive === undefined ? true : !!b.isActive,
  }));

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <Hero initialBanners={banners} />
      <ProductList limit={8} title="آخرین محصولات" sort="latest" showViewAll={true} variant="boxed" initialProducts={products} />
      <PromoBanners initialBanners={banners} />
      <PopularCategories initialCategories={categories} />
      <SmartRecommendations initialProducts={products} />
      <MiddleBanner initialBanners={banners} />
      <FeaturedProducts initialProducts={products} />
      <BottomBanners initialBanners={banners} />
      <TopBrands initialBrands={brandsMapped} />
      <TrendingProducts initialProducts={products} />
      <LatestPosts initialPosts={posts} />
      <TrustFeatures />
      <Footer />
    </main>
  );
}
