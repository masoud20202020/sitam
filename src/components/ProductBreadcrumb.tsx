'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { getCategories, Category } from '@/data/categories';

interface ProductBreadcrumbProps {
  productName: string;
  categoryName: string;
}

export function ProductBreadcrumb({ productName, categoryName }: ProductBreadcrumbProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [breadcrumbPath, setBreadcrumbPath] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setCategories(getCategories());
      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (categories.length === 0 || !categoryName) return;

    const currentCategory = categories.find(c => c.name.trim() === categoryName.trim());
    
    if (currentCategory) {
      const path = [currentCategory];
      let parentId = currentCategory.parentId;

      // Prevent infinite loops with a max depth check
      let depth = 0;
      while (parentId && depth < 5) {
        const parent = categories.find(c => String(c.id) === String(parentId));
        if (parent) {
          path.unshift(parent);
          parentId = parent.parentId;
        } else {
          break;
        }
        depth++;
      }
      setTimeout(() => {
        setBreadcrumbPath(path);
      }, 0);
    }
  }, [categories, categoryName]);

  // If not mounted (server-side/initial render), show a basic skeleton or simple version
  if (!mounted) {
    return (
      <div className="flex items-center text-sm text-gray-500 mb-6 flex-wrap gap-2">
        <span>خانه</span>
        <span className="mx-2">/</span>
        <span>فروشگاه</span>
        <span className="mx-2">/</span>
        {categoryName && (
            <>
                <span>{categoryName}</span>
                <span className="mx-2">/</span>
            </>
        )}
        <span className="text-gray-900">{productName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm text-gray-500 mb-6 flex-wrap gap-2">
      <Link href="/" className="flex items-center hover:text-gray-900 transition-colors">
        <Home className="w-4 h-4" />
        <span className="sr-only">خانه</span>
      </Link>
      
      <ChevronLeft className="w-4 h-4 text-gray-400" />
      
      <Link href="/shop" className="hover:text-gray-900 transition-colors">
        فروشگاه
      </Link>

      {breadcrumbPath.length > 0 ? (
        breadcrumbPath.map((cat) => (
          <React.Fragment key={cat.id}>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <Link href={`/shop?category=${cat.slug || cat.id}`} className="hover:text-gray-900 transition-colors">
              {cat.name}
            </Link>
          </React.Fragment>
        ))
      ) : (
        categoryName && (
          <>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <Link href={`/shop?q=${categoryName}`} className="hover:text-gray-900 transition-colors">
              {categoryName}
            </Link>
          </>
        )
      )}

      <ChevronLeft className="w-4 h-4 text-gray-400" />
      <span className="text-gray-900 font-medium">{productName}</span>
    </div>
  );
}
