'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Star, Heart, Share2, Truck, ShieldCheck, RefreshCw, ZoomIn } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Image from 'next/image';
import { getProductReviewsAction, addReviewAction, voteHelpfulAction, ReviewItem } from '@/actions/reviews';
import { getProducts, ProductItem, formatPriceToman, ProductOption, ProductVariant } from '@/data/products';
import { RelatedProducts } from '@/components/RelatedProducts';
import { SiteSettings } from '@/data/settings';
import CountdownTimer from '@/components/CountdownTimer';
import Link from 'next/link';

type Product = {
  id: string | number;
  name: string;
  basePrice: number;
  discountPrice?: number;
  description: string;
  shortDescription?: string;
  features: string[];
  rating: number;
  reviews: number;
  images: string[];
  category?: string;
  brand?: string;
  options?: ProductOption[];
  variants?: ProductVariant[];
  stock?: number;
  imageAlt?: string;
  specialSaleEndTime?: number;
  seoKeywords?: string[];
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  volume?: number;
  isGiftWrapAvailable?: boolean;
};

export default function ProductClientPage({ product, settings }: { product: Product, settings: SiteSettings }) {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);
  const [quantity, setQuantity] = useState(1);
  
  // Refresh product data from localStorage on mount to ensure latest updates are shown
  useEffect(() => {
    const allProducts = getProducts();
    const latest = allProducts.find(p => String(p.id) === String(product.id));
    if (latest) {
      setTimeout(() => {
        setCurrentProduct(prev => ({
          ...prev,
          ...latest,
          description: latest.description !== undefined ? latest.description : prev.description,
          shortDescription: latest.shortDescription !== undefined ? latest.shortDescription : prev.shortDescription,
          features: latest.features || prev.features,
          images: latest.images || prev.images,
          rating: latest.rating || prev.rating,
          reviews: latest.reviews || prev.reviews
        }));
      }, 0);
    }
  }, [product.id]);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  // Variant Selection State
  const [selectedOptions, setSelectedOptions] = useState<{[key: string]: string}>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [giftWrappingCost, setGiftWrappingCost] = useState(0);
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);

  // Load settings
  useEffect(() => {
    setTimeout(() => {
      setGiftWrappingCost(settings.giftWrappingCost || 0);
    }, 0);
  }, [settings]);
  
  // Initialize options
  useEffect(() => {
    if (currentProduct.options && currentProduct.options.length > 0) {
      const initialOptions: {[key: string]: string} = {};
      currentProduct.options.forEach(opt => {
        initialOptions[opt.name] = opt.values[0];
      });
      setTimeout(() => {
        setSelectedOptions(initialOptions);
      }, 0);
    }
  }, [currentProduct.options]);

  // Find matching variant
  useEffect(() => {
    if (currentProduct.variants && Object.keys(selectedOptions).length > 0) {
      const variant = currentProduct.variants.find(v => 
        Object.entries(selectedOptions).every(([key, val]) => v.selection[key] === val)
      );
      setTimeout(() => {
        setCurrentVariant(variant || null);
      }, 0);
    } else {
      setTimeout(() => {
        setCurrentVariant(null);
      }, 0);
    }
  }, [selectedOptions, currentProduct.variants]);

  // Save to History
  useEffect(() => {
    try {
      const historyKey = 'viewed_history';
      const raw = localStorage.getItem(historyKey);
      let history: { id: string | number; category: string; timestamp: number }[] = raw ? JSON.parse(raw) : [];
      
      // Remove if exists (to move to top)
      history = history.filter(h => String(h.id) !== String(currentProduct.id));
      
      // Add to top
      history.unshift({
        id: currentProduct.id,
        category: currentProduct.category || '',
        timestamp: Date.now()
      });
      
      // Keep last 20
      if (history.length > 20) history = history.slice(0, 20);
      
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [currentProduct.id, currentProduct.category]);

  // Derived Price and Stock
  const hasDiscount = !currentVariant && currentProduct.discountPrice && currentProduct.discountPrice > 0 && currentProduct.discountPrice < currentProduct.basePrice;
  const finalPrice = currentVariant ? currentVariant.price : (hasDiscount ? currentProduct.discountPrice! : currentProduct.basePrice);
  const strikethroughPrice = hasDiscount ? formatPriceToman(currentProduct.basePrice) : null;
  
  const currentStock = currentVariant ? currentVariant.stock : (currentProduct.stock ?? 0);
  const isOutOfStock = currentStock <= 0;

  // Image Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [initialNow, setInitialNow] = useState<number>(0);
  useEffect(() => {
    setTimeout(() => {
      setInitialNow(Date.now());
    }, 0);
  }, []);

  // Reviews State
  const [comments, setComments] = useState<ReviewItem[]>([]);
  const [reviewForm, setReviewForm] = useState<{ author: string; rating: number; content: string; ratingQuality: number; ratingValue: number; ratingPackaging: number }>({
    author: '',
    rating: 5,
    content: '',
    ratingQuality: 5,
    ratingValue: 5,
    ratingPackaging: 5,
  });
  const [submitted, setSubmitted] = useState(false);
  const [sortKey, setSortKey] = useState<'newest' | 'helpful'>('helpful');

  // Tabs State
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert('این محصول موجود نیست.');
      return;
    }

    addToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      price: finalPrice,
      quantity: quantity,
      image: currentProduct.images[activeImageIndex] || currentProduct.images[0],
      color: selectedOptions['رنگ'],
      size: selectedOptions['سایز'],
      variantId: currentVariant?.variantId,
      hasGiftWrap: isGiftWrapped,
      giftWrapPrice: giftWrappingCost,
    });
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  useEffect(() => {
    (async () => {
      const res = await getProductReviewsAction(String(currentProduct.id));
      if (res.success && res.data) {
        setComments(res.data);
      }
    })();
  }, [currentProduct.id]);

  const approvedComments = useMemo(() => comments.filter(c => c.status === 'approved'), [comments]);
  const avgRating = useMemo(() => {
    if (approvedComments.length === 0) return 0;
    const sum = approvedComments.reduce((acc, c) => acc + (typeof c.rating === 'number' ? c.rating : 0), 0);
    return Math.round((sum / approvedComments.length) * 10) / 10;
  }, [approvedComments]);
  const reviewsCount = approvedComments.length;
  const getHelpfulScoreLocal = (c: ReviewItem) => (c.helpfulUp ?? 0) - (c.helpfulDown ?? 0);
  const getCreatedAtMs = (d: ReviewItem['createdAt']) => (typeof d === 'string' ? Date.parse(d) : d.getTime());

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.author.trim() || !reviewForm.content.trim()) return;
    (async () => {
      const res = await addReviewAction({
        productId: String(currentProduct.id),
        author: reviewForm.author.trim(),
        rating: reviewForm.rating,
        ratingQuality: reviewForm.ratingQuality,
        ratingValue: reviewForm.ratingValue,
        ratingPackaging: reviewForm.ratingPackaging,
        content: reviewForm.content.trim(),
        status: 'pending',
      });
      if (res.success) {
        const list = await getProductReviewsAction(String(currentProduct.id));
        if (list.success && list.data) setComments(list.data);
        setReviewForm({ author: '', rating: 5, content: '', ratingQuality: 5, ratingValue: 5, ratingPackaging: 5 });
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      }
    })();
  };

  return (
    <div className="space-y-12">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Gallery Section with Zoom */}
          <div className="w-full md:w-1/2 space-y-4">
            <div 
              className="aspect-square bg-gray-100 rounded-lg relative overflow-hidden cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={currentProduct.images[activeImageIndex] || '/placeholder.svg'}
                alt={currentProduct.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover object-center transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                style={isZoomed ? {
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                } : undefined}
              />
              {!isZoomed && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    بزرگنمایی
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {currentProduct.images.map((src, idx) => (
                <button 
                  key={idx} 
                  className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-[#db2777] opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <Image
                    src={src || '/placeholder.svg'}
                    alt={`${currentProduct.name} - تصویر ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 10vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentProduct.name}</h1>
              {currentProduct.brand && (
                <div className="text-sm text-gray-500 mb-2">
                  برند: <Link href={`/shop?brand=${currentProduct.brand}`} className="text-[#db2777] hover:underline">{currentProduct.brand}</Link>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-gray-700 mr-1 font-medium">{avgRating || currentProduct.rating}</span>
                </div>
                <Link href="#reviews" onClick={(e) => { e.preventDefault(); setActiveTab('reviews'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#db2777] cursor-pointer">
                  ({reviewsCount || currentProduct.reviews} دیدگاه)
                </Link>
                <span className="text-gray-300">|</span>
                <span className={isOutOfStock ? "text-red-500" : "text-[#db2777]"}>
                  {isOutOfStock ? 'ناموجود' : `موجود در انبار: ${currentStock} عدد`}
                </span>
              </div>
            </div>

            <div className="border-t border-b py-6 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-[#db2777]">
                  {currentVariant 
                    ? formatPriceToman(currentVariant.price + (isGiftWrapped ? giftWrappingCost : 0))
                    : formatPriceToman((currentProduct.discountPrice || currentProduct.basePrice) + (isGiftWrapped ? giftWrappingCost : 0))
                  }
                </span>
                {strikethroughPrice && (
                  <span className="text-lg text-gray-400 line-through">{strikethroughPrice}</span>
                )}
              </div>

              {/* Gift Wrapping Checkbox */}
              {currentProduct.isGiftWrapAvailable && (
                <div className="mt-4 flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                  <input
                    type="checkbox"
                    id="gift-wrap"
                    checked={isGiftWrapped}
                    onChange={(e) => setIsGiftWrapped(e.target.checked)}
                    className="w-5 h-5 text-[#db2777] border-gray-300 rounded focus:ring-[#db2777] cursor-pointer"
                  />
                  <label htmlFor="gift-wrap" className="text-gray-700 cursor-pointer select-none flex items-center gap-1">
                    <span>بسته‌بندی کادویی</span>
                    <span className="text-[#db2777] font-bold">(+{formatPriceToman(giftWrappingCost)})</span>
                  </label>
                </div>
              )}
              
              {currentProduct.specialSaleEndTime && initialNow > 0 && currentProduct.specialSaleEndTime > initialNow && (
                <div className="py-2">
                  <CountdownTimer targetDate={currentProduct.specialSaleEndTime} />
                </div>
              )}

              <p className="text-gray-600 leading-relaxed line-clamp-3">
                {currentProduct.shortDescription || currentProduct.description}
              </p>
            </div>

            {/* Dynamic Attributes / Options */}
            {currentProduct.options && currentProduct.options.length > 0 && (
              <div className="space-y-4">
                {currentProduct.options.map((option) => (
                  <div key={option.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {option.name}: <span className="text-gray-900">{selectedOptions[option.name]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val) => (
                        <button 
                          key={val} 
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                          className={`
                            px-4 py-2 rounded-md border text-sm transition-all
                            ${selectedOptions[option.name] === val 
                              ? 'border-[#db2777] bg-[#db2777]/10 text-[#db2777] font-medium ring-1 ring-[#db2777]' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}
                          `}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center border rounded-md h-12">
                <button onClick={decrementQuantity} className="px-4 h-full text-gray-600 hover:bg-gray-100 text-xl disabled:opacity-50" disabled={isOutOfStock}>-</button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button onClick={incrementQuantity} className="px-4 h-full text-gray-600 hover:bg-gray-100 text-xl disabled:opacity-50" disabled={isOutOfStock}>+</button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 text-white h-12 px-6 rounded-md font-bold transition-all shadow-lg
                  ${isOutOfStock 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#db2777] hover:bg-[#be185d] shadow-[#db2777]/30'}
                `}
              >
                {isOutOfStock ? 'ناموجود' : 'افزودن به سبد خرید'}
              </button>
              <button 
                className={`w-12 h-12 flex items-center justify-center border rounded-md transition-colors ${isInWishlist(currentProduct.id) ? 'text-red-500 border-red-500' : 'text-gray-400 hover:text-red-500 hover:border-red-500'}`}
                onClick={() => {
                  const productItem: ProductItem = {
                    id: currentProduct.id,
                    name: currentProduct.name,
                    basePrice: currentProduct.basePrice,
                    discountPrice: currentProduct.discountPrice,
                    image: currentProduct.images[0], // Use first image as main image
                    category: currentProduct.category || '',
                    description: currentProduct.description,
                    features: currentProduct.features,
                    rating: currentProduct.rating,
                    reviews: currentProduct.reviews,
                    stock: currentProduct.stock,
                    brand: currentProduct.brand
                  };
                  toggleWishlist(productItem);
                }}
                title={isInWishlist(currentProduct.id) ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی"}
              >
                <Heart className={`w-6 h-6 ${isInWishlist(currentProduct.id) ? 'fill-current' : ''}`} />
              </button>
              <button className="w-12 h-12 flex items-center justify-center border rounded-md text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500 pt-4 border-t">
              <div className="flex flex-col items-center gap-2">
                <Truck className="w-6 h-6 text-[#db2777]" />
                <span>ارسال سریع</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#db2777]" />
                <span>ضمانت اصالت</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#db2777]" />
                <span>۷ روز بازگشت</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section (Description, Specs, Reviews) */}
      <div id="tabs" className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          <button 
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'desc' ? 'text-[#83b735]' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('desc')}
          >
            توضیحات
            {activeTab === 'desc' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#83b735]"></span>}
          </button>
          <button 
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'specs' ? 'text-[#83b735]' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('specs')}
          >
            مشخصات فنی
            {activeTab === 'specs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#83b735]"></span>}
          </button>
          <button 
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'reviews' ? 'text-[#83b735]' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('reviews')}
          >
            نظرات کاربران ({reviewsCount || product.reviews})
            {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#83b735]"></span>}
          </button>
        </div>
        
        <div className="p-6 min-h-[300px]">
          {activeTab === 'desc' && (
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              <h3 className="text-xl font-bold mb-4">نقد و بررسی اجمالی</h3>
              <div dangerouslySetInnerHTML={{ __html: currentProduct.description }} />
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">مشخصات فنی</h3>
              <div className="grid grid-cols-1 gap-y-4">
                {currentProduct.weight && (
                  <div className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">وزن</span>
                    <span className="w-2/3 text-gray-800 p-2">{currentProduct.weight} گرم</span>
                  </div>
                )}
                {currentProduct.dimensions && (
                   <div className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">ابعاد (طول × عرض × ارتفاع)</span>
                    <span className="w-2/3 text-gray-800 p-2" dir="ltr">
                       {currentProduct.dimensions.length} x {currentProduct.dimensions.width} x {currentProduct.dimensions.height} cm
                    </span>
                  </div>
                )}
                {currentProduct.volume && (
                   <div className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">حجم</span>
                    <span className="w-2/3 text-gray-800 p-2">{currentProduct.volume} cm³</span>
                  </div>
                )}
                {currentProduct.features.map((feature, idx) => (
                  <div key={idx} className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">ویژگی {idx + 1}</span>
                    <span className="w-2/3 text-gray-800 p-2">{feature}</span>
                  </div>
                ))}
                {currentProduct.brand && (
                  <div className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">برند</span>
                    <span className="w-2/3 text-gray-800 p-2">{currentProduct.brand}</span>
                  </div>
                )}
                {currentProduct.category && (
                  <div className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">دسته‌بندی</span>
                    <span className="w-2/3 text-gray-800 p-2">{currentProduct.category}</span>
                  </div>
                )}
                {currentProduct.seoKeywords && currentProduct.seoKeywords.length > 0 && (
                  <div className="flex border-b pb-2 last:border-0">
                    <span className="w-1/3 text-gray-500 font-medium bg-gray-50 p-2 rounded-r-md">برچسب‌ها</span>
                    <div className="w-2/3 text-gray-800 p-2 flex flex-wrap gap-2">
                      {currentProduct.seoKeywords.map((keyword, idx) => (
                        <Link 
                          key={idx} 
                          href={`/shop?q=${encodeURIComponent(keyword)}`}
                          className="text-sm bg-gray-100 hover:bg-[#83b735] hover:text-white px-2 py-1 rounded-md transition-colors"
                        >
                          {keyword}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">نظرات کاربران</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">مرتب‌سازی:</span>
                    <select 
                      value={sortKey} 
                      onChange={(e) => setSortKey(e.target.value as 'newest' | 'helpful')}
                      className="border rounded-md text-sm p-1 focus:outline-none focus:ring-1 focus:ring-[#83b735]"
                    >
                      <option value="helpful">مفیدترین</option>
                      <option value="newest">جدیدترین</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {approvedComments.length === 0 && (
                    <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">هنوز نظری ثبت نشده است. اولین نفر باشید!</div>
                  )}
                  {approvedComments
                    .sort((a, b) => {
                      if (sortKey === 'helpful') return getHelpfulScoreLocal(b) - getHelpfulScoreLocal(a);
                      return getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt);
                    })
                    .map(c => (
                      <div key={c.id} className="border rounded-lg p-4 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-gray-900">{c.author}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString('fa-IR')}
                          </div>
                        </div>
                        <div className="flex items-center text-yellow-400 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < c.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mb-3 flex gap-4">
                          <span>کیفیت: {c.ratingQuality ?? c.rating}</span>
                          <span>ارزش خرید: {c.ratingValue ?? c.rating}</span>
                          <span>بسته‌بندی: {c.ratingPackaging ?? c.rating}</span>
                        </div>
                        <div className="text-gray-700 leading-relaxed mb-4">{c.content}</div>
                        
                        {c.reply && (
                          <div className="bg-[#f9fdf5] border border-[#e3f0d3] rounded-lg p-4 mb-4 text-sm relative">
                            <div className="font-bold text-[#83b735] mb-2 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#83b735]"></div>
                              پاسخ ادمین (حمیدشاپ)
                            </div>
                            <div className="text-gray-700 leading-relaxed">
                              {c.reply}
                            </div>
                            {c.replyAt && (
                              <div className="text-xs text-gray-400 mt-2 text-left">
                                {new Date(c.replyAt).toLocaleDateString('fa-IR')}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-sm border-t pt-3">
                          <span className="text-gray-500 text-xs">آیا این نظر مفید بود؟</span>
                          <button
                            className="flex items-center gap-1 hover:text-green-600 transition-colors"
                            onClick={async () => {
                              await voteHelpfulAction(c.id, true);
                              const list = await getProductReviewsAction(String(currentProduct.id));
                              if (list.success && list.data) setComments(list.data);
                            }}
                          >
                            <span className="text-xs border px-2 py-0.5 rounded bg-white">بله ({c.helpfulUp ?? 0})</span>
                          </button>
                          <button
                            className="flex items-center gap-1 hover:text-red-600 transition-colors"
                            onClick={async () => {
                              await voteHelpfulAction(c.id, false);
                              const list = await getProductReviewsAction(String(currentProduct.id));
                              if (list.success && list.data) setComments(list.data);
                            }}
                          >
                            <span className="text-xs border px-2 py-0.5 rounded bg-white">خیر ({c.helpfulDown ?? 0})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border p-6 h-fit sticky top-24">
                <h2 className="text-lg font-bold text-gray-800 mb-4">افزودن نظر جدید</h2>
                <form onSubmit={submitReview} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-700 font-medium">نام شما</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735]"
                      value={reviewForm.author}
                      onChange={e => setReviewForm({ ...reviewForm, author: e.target.value })}
                      required
                      placeholder="نام خود را وارد کنید"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-700">کیفیت</label>
                      <select
                        className="w-full border rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735]"
                        value={reviewForm.ratingQuality}
                        onChange={e => setReviewForm({ ...reviewForm, ratingQuality: Number(e.target.value), rating: Number(e.target.value) })}
                      >
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-700">ارزش</label>
                      <select
                        className="w-full border rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735]"
                        value={reviewForm.ratingValue}
                        onChange={e => setReviewForm({ ...reviewForm, ratingValue: Number(e.target.value) })}
                      >
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-700">بسته</label>
                      <select
                        className="w-full border rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735]"
                        value={reviewForm.ratingPackaging}
                        onChange={e => setReviewForm({ ...reviewForm, ratingPackaging: Number(e.target.value) })}
                      >
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-700 font-medium">متن نظر</label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735] resize-none"
                      rows={4}
                      value={reviewForm.content}
                      onChange={e => setReviewForm({ ...reviewForm, content: e.target.value })}
                      required
                      placeholder="نظر خود را بنویسید..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#83b735] text-white font-bold py-2 rounded-md hover:bg-[#6da025] transition-colors text-sm"
                    // keep client-side gating for now; can be replaced with server-side check
                  >
                    ارسال نظر
                  </button>

                  {submitted && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200 text-center">
                      نظر شما با موفقیت ثبت شد.
                    </div>
                  )}
                  
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products Section */}
      <RelatedProducts categoryId={product.category} currentProductId={product.id} />
    </div>
  );
}
