'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function normalizeCategoryLabel(product: any) {
  const byRel = typeof product?.categoryRel?.name === 'string' ? product.categoryRel.name.trim() : '';
  if (byRel) return byRel;
  const byText = typeof product?.category === 'string' ? product.category.trim() : '';
  if (byText) return byText;
  return 'Lain-lain';
}

export default function PublicProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (!productId) return;
    load(productId);
  }, [productId]);

  const load = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI(`/products/${id}`);
      setProduct(data || null);
      const urls =
        Array.isArray(data?.images) && data.images.length > 0
          ? data.images.map((i: any) => i?.url).filter((u: any) => typeof u === 'string' && u)
          : data?.imageUrl
            ? [data.imageUrl]
            : [];
      setActiveImage((urls[0] as string) || '');
    } catch (e: any) {
      setProduct(null);
      setError(e?.message || 'Gagal memuatkan produk');
    } finally {
      setLoading(false);
    }
  };

  const images = useMemo(() => {
    const urls =
      Array.isArray(product?.images) && product.images.length > 0
        ? product.images.map((i: any) => i?.url).filter((u: any) => typeof u === 'string' && u)
        : product?.imageUrl
          ? [product.imageUrl]
          : [];
    return (urls.length > 0 ? urls : [getPlaceholderImage(String(product?.name || 'Produk'))]).slice(0, 5);
  }, [product]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Memuatkan...</div>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-10 space-y-4">
          <Link href="/products" className="text-gold-400 hover:text-gold-300">
            ← Kembali ke Produk
          </Link>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">
            {error || 'Produk tidak ditemui'}
          </div>
        </div>
      </div>
    );
  }

  const src = activeImage || product.imageUrl || getPlaceholderImage(product.name);
  const hidePrice = Boolean(product?.hidePrice) || Number(product?.price || 0) <= 0;
  const categoryLabel = normalizeCategoryLabel(product);

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
            <Link href="/products" className="text-gray-300 hover:text-white transition-colors">
              Semua Produk
            </Link>
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
        <Link href="/products" className="text-gold-400 hover:text-gold-300">
          ← Kembali ke Produk
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="relative aspect-square bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
              <Image
                src={src}
                alt={product.name || 'Produk'}
                fill
                unoptimized={isUploadsSrc(src)}
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-gray-100">
                {categoryLabel}
              </div>
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-gold-400">
                {product.purity || '-'} Ketulenan
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((u: string) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setActiveImage(u)}
                    className={`relative aspect-square rounded-xl overflow-hidden border ${
                      u === src ? 'border-gold-500' : 'border-white/10 hover:border-gold-500/40'
                    }`}
                  >
                    <Image src={u} alt="Gambar produk" fill unoptimized={isUploadsSrc(u)} className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
              <p className="text-gray-400">{Number(product.weight || 0)}g</p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Harga</div>
                <div className="font-mono text-gold-500 text-xl font-semibold">
                  {hidePrice ? 'Harga Tersembunyi' : formatMoneyMYR(product.price)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-400">Stok</div>
                <div className="text-white">{Number(product.stock || 0)}</div>
              </div>
            </div>

            {product.description && (
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                <div className="text-lg font-semibold mb-2">Penerangan</div>
                <div className="text-gray-300 whitespace-pre-wrap">{product.description}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/login"
                className="w-full text-center py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Log Masuk untuk Beli
              </Link>
              <Link
                href="/register"
                className="w-full text-center py-3 bg-white/5 hover:bg-gold-500 hover:text-black border border-white/10 hover:border-gold-500 rounded-lg transition-all duration-300 font-semibold"
              >
                Daftar Ahli
              </Link>
            </div>

            <div className="text-xs text-gray-500">
              Nota: Pembelian & pembayaran dibuat selepas log masuk.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
