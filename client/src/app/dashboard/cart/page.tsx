'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Trash, Minus, Plus, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await fetchAPI('/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    setUpdating(itemId);
    try {
      if (newQuantity <= 0) {
        await fetchAPI(`/cart/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        await fetchAPI(`/cart/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ quantity: newQuantity }),
        });
      }
      await loadCart();
    } catch (err) {
      console.error('Failed to update cart:', err);
    } finally {
      setUpdating(null);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await fetchAPI(`/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      await loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdating(null);
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total: number, item: any) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Sedang memuatkan troli...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="bg-zinc-900 p-6 rounded-full border border-white/10 text-gray-500">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white">Troli anda kosong</h2>
        <p className="text-gray-400 max-w-sm">Nampaknya anda belum menambah sebarang emas ke dalam koleksi anda.</p>
        <Link href="/dashboard/products">
          <Button className="mt-4">Lihat Produk</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Troli Belanja</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: any) => (
            <div key={item.id} className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex gap-4 items-center">
              <div className="w-24 h-24 bg-zinc-800 rounded-lg relative overflow-hidden flex-shrink-0">
                {/* Image Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-gold-500/20 font-bold">
                   {item.product.imageUrl ? (
                      <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
                   ) : (
                      <span className="text-xs text-center p-2">{item.product.name}</span>
                   )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{item.product.name}</h3>
                <p className="text-sm text-gray-400">{item.product.weight}g • {item.product.purity}</p>
                <p className="text-gold-500 font-mono mt-1">RM {item.product.price.toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={updating === item.id}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={updating === item.id}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  disabled={updating === item.id}
                  className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash size={12} /> Buang
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 h-fit space-y-6">
          <h3 className="text-lg font-bold text-white">Ringkasan Pesanan</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subjumlah</span>
              <span>RM {calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Penghantaran</span>
              <span>Dikira semasa pembayaran</span>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-white text-lg">
              <span>Jumlah</span>
              <span>RM {calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <Link href="/dashboard/checkout" className="block w-full">
            <Button className="w-full flex items-center justify-center gap-2 py-6 text-lg">
              Teruskan ke Pembayaran <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ShoppingBag({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  );
}
