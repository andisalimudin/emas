'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

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

function normalizeCategoryLabel(product: any) {
  const byRel = typeof product?.categoryRel?.name === 'string' ? product.categoryRel.name.trim() : '';
  if (byRel) return byRel;
  const byText = typeof product?.category === 'string' ? product.category.trim() : '';
  if (byText) return byText;
  return 'Lain-lain';
}

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function PublicProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([fetchAPI('/products'), fetchAPI('/categories')]);
      setProducts((Array.isArray(productsData) ? productsData : []).filter((p: any) => p?.isActive));
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const hasUncategorized = useMemo(() => {
    return (products || []).some((p) => !p?.categoryId && !(typeof p?.category === 'string' && p.category.trim()));
  }, [products]);

  const categoryChips = useMemo(() => {
    const list = (categories || []).map((c: any) => ({
      id: String(c?.id || ''),
      label: String(c?.name || ''),
    })).filter((c) => c.id && c.label);
    const base = [{ id: '', label: 'Semua' }, ...list];
    if (hasUncategorized) base.push({ id: '__uncategorized__', label: 'Lain-lain' });
    return base;
  }, [categories, hasUncategorized]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (products || []).filter((p: any) => {
      const nameOk = !q || String(p?.name || '').toLowerCase().includes(q);
      if (!nameOk) return false;
      if (!activeCategoryId) return true;
      if (activeCategoryId === '__uncategorized__') {
        const hasCategoryId = typeof p?.categoryId === 'string' && p.categoryId.trim().length > 0;
        const hasCategoryText = typeof p?.category === 'string' && p.category.trim().length > 0;
        return !hasCategoryId && !hasCategoryText;
      }
      return String(p?.categoryId || '') === activeCategoryId;
    });
  }, [products, searchQuery, activeCategoryId]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tighter">
            <span className="bg-gradient-to-r from-gold-400 via-yellow-200 to-gold-500 bg-clip-text text-transparent">
              AmyEmpire
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
              Log Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 font-semibold bg-gradient-to-r from-gold-600 to-gold-400 text-black rounded-full"
            >
              Daftar
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold">Semua Produk</h1>
          <p className="text-gray-400 max-w-2xl">
            Lihat koleksi emas baru & preloved premium. Daftar sebagai ahli untuk dapatkan harga eksklusif dan buat pembelian.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
            {categoryChips.map((c) => (
              <button
                key={c.id || 'all'}
                type="button"
                onClick={() => setActiveCategoryId(c.id)}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  activeCategoryId === c.id
                    ? 'bg-gold-500 text-black border-gold-500'
                    : 'bg-white/5 text-gray-200 border-white/10 hover:border-gold-500/40 hover:bg-gold-500/10'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Sedang memuatkan produk...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Tiada produk ditemui.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product: any, i: number) => {
              const src = product.imageUrl || getPlaceholderImage(product.name);
              const categoryLabel = normalizeCategoryLabel(product);
              const hidePrice = Boolean(product?.hidePrice) || Number(product?.price || 0) <= 0;

              return (
                <motion.div
                  key={product.id || i}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all duration-300"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="aspect-square relative bg-zinc-800">
                      <Image
                        src={src}
                        alt={product.name || 'Produk'}
                        fill
                        unoptimized={isUploadsSrc(src)}
                        className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-gray-100">
                        {categoryLabel}
                      </div>
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-gold-400">
                        {product.purity || '-'} Ketulenan
                      </div>
                    </div>
                  </Link>

                  <div className="p-8 space-y-4 relative z-10 bg-gradient-to-t from-black via-zinc-900/50 to-transparent -mt-20 pt-24">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-2xl font-bold text-white group-hover:text-gold-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex justify-between items-center text-sm text-gray-400 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold-500" />
                        {Number(product.weight || 0)}g
                      </div>
                      <div className="font-mono text-gold-500">
                        {hidePrice ? 'Harga Tersembunyi' : formatMoneyMYR(product.price)}
                      </div>
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      className="block w-full text-center py-3 mt-4 bg-white/5 hover:bg-gold-500 hover:text-black border border-white/10 hover:border-gold-500 rounded-lg transition-all duration-300 font-medium"
                    >
                      Lihat Butiran
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

