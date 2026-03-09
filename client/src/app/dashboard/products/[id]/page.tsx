'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Image from 'next/image';
import { ShoppingCart, Lock, ArrowLeft, Package, ShieldCheck, Scale, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getPlaceholderImage = (text: string) => {
  const svg = `
    <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="30" y="30" width="540" height="540" rx="30" fill="none" stroke="#D4AF37" stroke-width="3" stroke-opacity="0.3"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-weight="bold" font-size="36" fill="#D4AF37" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
    }
  }, [params.id]);

  const loadProduct = async (id: string) => {
    try {
      const data = await fetchAPI(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    setProcessing(true);
    try {
      await fetchAPI('/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      alert('Added to cart!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart');
    } finally {
      setProcessing(false);
    }
  };

  const lockPrice = async () => {
    if (!confirm(`Lock price for ${product.name} at RM ${product.price.toLocaleString()} for 1 Token?`)) return;

    setProcessing(true);
    try {
      // 1. Deduct token
      await fetchAPI('/wallet/deduct', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tokens: 1, description: `Price Lock for ${product.name}` }),
      });

      // 2. Redirect to checkout (Simulated by adding to cart)
      await fetchAPI('/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      
      router.push('/dashboard/cart');
      alert(`Price locked! You have ${product.lockDuration || 15} minutes to checkout.`);
    } catch (err) {
      console.error('Failed to lock price:', err);
      alert('Failed to lock price. Please check your wallet balance.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading product...</div>;
  if (!product) return <div className="text-center py-12 text-gray-500">Product not found.</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="text-gray-400 hover:text-white flex items-center gap-2 pl-0"
      >
        <ArrowLeft size={20} /> Back to Products
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="aspect-square relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/10">
          <Image 
            src={product.imageUrl || getPlaceholderImage(product.name)} 
            alt={product.name} 
            fill 
            className="object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-gray-400">
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-sm">
                <Scale size={14} /> {product.weight}g
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-sm">
                <ShieldCheck size={14} /> {product.purity}
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-sm">
                <Package size={14} /> Stock: {product.stock}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Price</span>
              <span className="text-3xl font-mono font-bold text-gold-500">
                RM {product.price.toLocaleString()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                variant="outline"
                size="lg"
                onClick={lockPrice}
                disabled={processing}
                className="border-gold-500/50 text-gold-500 hover:bg-gold-500/10 hover:text-gold-400 h-14"
              >
                <Lock className="mr-2" size={20} />
                Lock Price (1 Token)
              </Button>
              <Button 
                size="lg"
                onClick={addToCart}
                disabled={processing}
                className="bg-gold-500 hover:bg-gold-400 text-black font-bold h-14"
              >
                <ShoppingCart className="mr-2" size={20} />
                Add to Cart
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500">
              Price lock valid for {product.lockDuration || 15} minutes.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Info size={20} className="text-gold-500" />
              Description
            </h3>
            <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">
              {product.description || "No description available for this product."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
