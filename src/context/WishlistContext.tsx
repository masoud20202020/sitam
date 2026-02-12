'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductItem } from '@/data/products';
import { getUser } from '@/data/account';

type WishlistContextType = {
  items: ProductItem[];
  addToWishlist: (product: ProductItem) => void;
  removeFromWishlist: (id: string | number) => void;
  isInWishlist: (id: string | number) => boolean;
  toggleWishlist: (product: ProductItem) => void;
  clearWishlist: () => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [userId, setUserId] = useState<string | number | null>(null);

  // Load wishlist based on current user
  const loadWishlist = () => {
    const user = getUser();
    setUserId(user ? user.id : null);
    
    if (user) {
      try {
        const saved = localStorage.getItem(`wishlist_${user.id}`);
        setItems(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error('Failed to parse wishlist data', e);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  };

  // Initial load and listen for user changes
  useEffect(() => {
    setTimeout(() => {
      loadWishlist();
    }, 0);

    const handleUserChange = () => loadWishlist();
    window.addEventListener('user-change', handleUserChange);
    
    return () => {
      window.removeEventListener('user-change', handleUserChange);
    };
  }, []);

  // Persist changes
  useEffect(() => {
    if (userId !== null && userId !== undefined) {
      localStorage.setItem(`wishlist_${userId}`, JSON.stringify(items));
    }
  }, [items, userId]);

  const addToWishlist = (product: ProductItem) => {
    if (!userId) {
      alert('لطفاً برای افزودن به علاقه‌مندی‌ها وارد حساب کاربری شوید.');
      return;
    }
    setItems((prev) => {
      if (prev.some((item) => String(item.id) === String(product.id))) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (id: string | number) => {
    setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const isInWishlist = (id: string | number) => {
    return items.some((item) => String(item.id) === String(id));
  };

  const toggleWishlist = (product: ProductItem) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        count: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
