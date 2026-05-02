'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Image from 'next/image';
import { ShoppingCart, Search, Filter, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const getPlaceholderImage = (text: string) => {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="#D4AF37" stroke-width="2" stroke-opacity="0.3"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-weight="bold" font-size="24" fill="#D4AF37" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(svg) : Buffer.from(svg).toString('base64')}`;
};

const isUploadsSrc = (src: unknown) => typeof src === 'string' && src.includes('/uploads/');

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [lockingPrice, setLockingPrice] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchAPI('/products');
      setProducts(data.filter((p: any) => p.isActive));
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await fetchAPI('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      await fetchAPI('/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      // Show success toast (todo)
      alert('Ditambah ke troli!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Gagal menambah ke troli');
    } finally {
      setAddingToCart(null);
    }
  };

  const lockPrice = async (product: any) => {
    if (!confirm(`Kunci harga untuk ${product.name} pada RM ${product.price.toLocaleString()} dengan 1 Token?`)) return;

    setLockingPrice(product.id);
    try {
      // 1. Deduct token
      await fetchAPI('/wallet/deduct', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tokens: 1, description: `Kunci Harga untuk ${product.name}` }),
      });

      // 2. Redirect to checkout with locked price (Simulated for now by adding to cart and redirecting)
      await addToCart(product.id);
      router.push('/dashboard/cart');
      
      alert(`Harga dikunci! Anda mempunyai ${product.lockDuration || 15} minit untuk membuat pembayaran.`);
    } catch (err) {
      console.error('Failed to lock price:', err);
      alert('Gagal mengunci harga. Sila semak baki dompet anda.');
    } finally {
      setLockingPrice(null);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter((product) => {
    if (!activeCategoryId) return true;
    if (activeCategoryId === '__uncategorized__') {
      const hasCategoryId = typeof product?.categoryId === 'string' && product.categoryId.trim().length > 0;
      const hasCategoryText = typeof product?.category === 'string' && product.category.trim().length > 0;
      return !hasCategoryId && !hasCategoryText;
    }
    return String(product?.categoryId || '') === activeCategoryId;
  });

  const hasUncategorized = products.some((p) => {
    const hasCategoryId = typeof p?.categoryId === 'string' && p.categoryId.trim().length > 0;
    const hasCategoryText = typeof p?.category === 'string' && p.category.trim().length > 0;
    return !hasCategoryId && !hasCategoryText;
  });

  const categoryChips = [{ id: '', label: 'Semua' }].concat(
    (categories || [])
      .map((c: any) => ({ id: String(c?.id || ''), label: String(c?.name || '') }))
      .filter((c) => c.id && c.label),
  ).concat(hasUncategorized ? [{ id: '__uncategorized__', label: 'Lain-lain' }] : []);

  const getCategoryLabel = (product: any) => {
    const byRel = typeof product?.categoryRel?.name === 'string' ? product.categoryRel.name.trim() : '';
    if (byRel) return byRel;
    const byText = typeof product?.category === 'string' ? product.category.trim() : '';
    if (byText) return byText;
    return 'Lain-lain';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Lihat Produk</h1>
        
        <div className="flex gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={18} />
            Tapis
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
        {categoryChips.map((c) => (
          <button
            key={c.id || 'all'}
            type="button"
            onClick={() => setActiveCategoryId(c.id)}
            disabled={categoriesLoading && c.id !== ''}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              activeCategoryId === c.id
                ? 'bg-gold-500 text-black border-gold-500'
                : 'bg-white/5 text-gray-200 border-white/10 hover:border-gold-500/40 hover:bg-gold-500/10'
            } ${categoriesLoading && c.id !== '' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Sedang memuatkan produk...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Tiada produk ditemui.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden group hover:border-gold-500/30 transition-all duration-300">
              <Link href={`/dashboard/products/${product.id}`} className="block">
                <div className="aspect-square relative bg-zinc-800 cursor-pointer">
                  {(() => {
                    const src = product.imageUrl || getPlaceholderImage(product.name);
                    return (
                  <Image 
                    src={src} 
                    alt={product.name} 
                    fill 
                    unoptimized={isUploadsSrc(src)}
                    className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                    );
                  })()}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-gold-400 border border-white/10">
                    {product.purity}
                  </div>
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-gray-100 border border-white/10">
                    {getCategoryLabel(product)}
                  </div>
                </div>
              </Link>
              
              <div className="p-4 space-y-3">
                <Link href={`/dashboard/products/${product.id}`} className="block">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.weight}g</p>
                  </div>
                </Link>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                  <div className="font-mono text-gold-500 font-bold">
                    RM {product.price.toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => lockPrice(product)}
                      disabled={lockingPrice === product.id}
                      className="h-8 w-8 p-0 rounded-full border-gold-500/50 text-gold-500 hover:bg-gold-500/10 hover:text-gold-400"
                      title="Kunci Harga (1 Token)"
                    >
                      <Lock size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => addToCart(product.id)}
                      disabled={addingToCart === product.id}
                      className="h-8 w-8 p-0 rounded-full"
                      title="Tambah ke Troli"
                    >
                      <ShoppingCart size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
