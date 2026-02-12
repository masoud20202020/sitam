import React, { Suspense } from 'react';
import { ShopContent } from './ShopContent';
import { getProductsAction } from '@/actions/products';
import { getCategoriesAction } from '@/actions/categories';

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getProductsAction(),
    getCategoriesAction()
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopContent 
        initialProducts={products} 
        initialCategories={categories}
      />
    </Suspense>
  );
}
