'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductById } from '@/data/products';

export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
  variantId?: string;
  hasGiftWrap?: boolean;
  giftWrapPrice?: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string | number, variantId?: string, hasGiftWrap?: boolean) => void;
  updateQuantity: (id: string | number, quantity: number, variantId?: string, hasGiftWrap?: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isInitialized: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedCart = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart);
        const sanitizedItems = parsedItems.map((item: CartItem) => ({
          ...item,
          price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
        }));
        setTimeout(() => {
          setItems(sanitizedItems);
        }, 0);
      } catch (e) {
        console.error('Failed to parse cart data', e);
      }
    }
    setTimeout(() => {
      setIsInitialized(true);
    }, 0);
  }, []);

  // Save cart to localStorage whenever it changes, but only after initialization
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const addToCart = (newItem: CartItem) => {
    setIsCartOpen(true);
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => 
        item.id === newItem.id && 
        item.variantId === newItem.variantId &&
        !!item.hasGiftWrap === !!newItem.hasGiftWrap
      );

      const product = getProductById(newItem.id);
      const stock = typeof product?.stock === 'number' ? product.stock : Infinity;
      // Note: Ideally we should check variant stock here too, but for now global stock or assumed infinity is okay
      
      if (existingItemIndex > -1) {
        const existingItem = prevItems[existingItemIndex];
        const mergedQty = existingItem.quantity + newItem.quantity;
        const nextQty = Math.min(mergedQty, stock);
        
        const newItems = [...prevItems];
        newItems[existingItemIndex] = { ...existingItem, quantity: nextQty };
        return newItems;
      }
      
      const initialQty = Math.min(newItem.quantity, stock);
      return [...prevItems, { ...newItem, quantity: initialQty }];
    });
  };

  const removeFromCart = (id: string | number, variantId?: string, hasGiftWrap?: boolean) => {
    setItems((prevItems) => prevItems.filter((item) => !(
      item.id === id && 
      item.variantId === variantId && 
      !!item.hasGiftWrap === !!hasGiftWrap
    )));
  };

  const updateQuantity = (id: string | number, quantity: number, variantId?: string, hasGiftWrap?: boolean) => {
    if (quantity < 1) return;
    const product = getProductById(id);
    const stock = typeof product?.stock === 'number' ? product.stock : Infinity;
    const nextQty = Math.min(quantity, stock);
    
    setItems((prevItems) =>
      prevItems.map((item) => 
        (item.id === id && item.variantId === variantId && !!item.hasGiftWrap === !!hasGiftWrap) 
          ? { ...item, quantity: nextQty } 
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => {
    const price = (typeof item.price === 'number' && !isNaN(item.price)) ? item.price : 0;
    const giftPrice = (item.hasGiftWrap && typeof item.giftWrapPrice === 'number') ? item.giftWrapPrice : 0;
    return acc + (price + giftPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, isCartOpen, openCart, closeCart, toggleCart, isInitialized }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
