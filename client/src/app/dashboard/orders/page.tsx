'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText } from 'lucide-react';

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusLabel(orderStatus: string, paymentStatus?: string) {
  const os = String(orderStatus || '').toUpperCase();
  const ps = String(paymentStatus || '').toUpperCase();
  if (os === 'PAID' || ps === 'APPROVED') return { text: 'Dibayar', cls: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (os === 'PAYMENT_REJECTED' || ps === 'REJECTED')
    return { text: 'Ditolak', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (os === 'PAYMENT_SUBMITTED' || ps === 'PENDING')
    return { text: 'Menunggu Semakan', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  return { text: 'Belum Bayar', cls: 'bg-zinc-500/10 text-gray-300 border-white/10' };
}

function shippingLabel(shippingStatus?: string) {
  const ss = String(shippingStatus || 'PENDING').toUpperCase();
  if (ss === 'DELIVERED') return { text: 'Dihantar', cls: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (ss === 'SHIPPED') return { text: 'Dalam Penghantaran', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  return { text: 'Menunggu', cls: 'bg-zinc-500/10 text-gray-300 border-white/10' };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const data = await fetchAPI('/orders/my', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuatkan pesanan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Sedang memuatkan pesanan...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Pesanan Saya</h1>
        <Link href="/dashboard/cart">
          <Button variant="outline">Ke Troli</Button>
        </Link>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-10 text-center space-y-3">
          <div className="inline-flex p-4 rounded-full bg-black border border-white/10 text-gray-400">
            <FileText size={28} />
          </div>
          <div className="text-white font-semibold">Tiada pesanan lagi</div>
          <div className="text-sm text-gray-400">Buat pembelian pertama anda melalui Troli.</div>
          <Link href="/dashboard/products">
            <Button className="mt-2">Lihat Produk</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const badge = statusLabel(o?.status, o?.payment?.status);
            const ship = shippingLabel(o?.shippingStatus);
            return (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className="block bg-zinc-900 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">Pesanan #{String(o.id).slice(0, 8).toUpperCase()}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(o.createdAt).toLocaleString('ms-MY')} • {Array.isArray(o.items) ? o.items.length : 0} item
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Penghantaran: <span className="text-gray-200">{ship.text}</span>
                      {o?.trackingNumber ? (
                        <>
                          {' '}
                          • Tracking: <span className="text-gray-200">{String(o.trackingNumber)}</span>
                        </>
                      ) : null}
                    </div>
                    <div className="text-gold-500 font-mono mt-2">{formatMoneyMYR(o.totalAmount)}</div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${badge.cls}`}>{badge.text}</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${ship.cls}`}>{ship.text}</span>
                    <ChevronRight size={18} className="text-gray-500" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
