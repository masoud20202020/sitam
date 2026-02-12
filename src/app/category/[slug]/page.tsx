import React, { Suspense } from 'react';
import { ShopContent } from '../../shop/ShopContent';
import { getProducts } from '@/data/products';
import { getCategories } from '@/data/categories';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const { slug } = params;
  const initialProducts = getProducts();
  const initialCategories = getCategories();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopContent initialCategorySlug={slug} initialProducts={initialProducts} initialCategories={initialCategories} />
    </Suspense>
  );
}
