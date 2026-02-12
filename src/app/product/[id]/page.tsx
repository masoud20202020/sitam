import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ProductClientPage from './ProductClientPage';
import { getProductByIdAction } from '@/actions/products';
import { getSiteSettings } from '@/app/actions/settings';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ProductBreadcrumb } from '@/components/ProductBreadcrumb';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, settings] = await Promise.all([
    getProductByIdAction(id),
    getSiteSettings()
  ]);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images && product.images.length > 0 ? product.images.map(img => img.startsWith('http') ? img : `https://sitam.ir${img}`) : [product.image || '/placeholder.svg'],
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Sitam'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: (product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.basePrice) * 10,
      availability: (product.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      priceValidUntil: product.specialSaleEndTime 
        ? new Date(product.specialSaleEndTime).toISOString().split('T')[0] 
        : undefined,
      itemCondition: 'https://schema.org/NewCondition',
    },
    aggregateRating: (product.reviews || 0) > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: '5',
      worstRating: '1'
    } : undefined
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <ProductBreadcrumb 
          productName={product.name} 
          categoryName={product.category || ''} 
        />

        <ProductClientPage product={{ ...product, description: product.description || '', features: product.features ?? [], rating: product.rating ?? 0, reviews: product.reviews ?? 0, images: product.images ?? (product.image ? [product.image] : []) }} settings={settings} />
      </main>

      <Footer />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = await getProductByIdAction(id);
  
  const title = item?.seoTitle || item?.name || 'محصول';
  const description = item?.seoDescription || item?.description || 'مشخصات و قیمت محصول';
  const image = item?.images?.[0] || item?.image;
  const keywords = item?.seoKeywords || [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
    },
    keywords: keywords.join(', '),
  };
}
