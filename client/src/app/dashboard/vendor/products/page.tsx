'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetchAPI } from '@/lib/api';

function getStatusBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'APPROVED') {
    return 'bg-green-500/10 text-green-500 border-green-500/20';
  }
  if (s === 'REJECTED') {
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  }
  return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
}

export default function VendorSubmissionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchAPI('/product-submissions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Produk Dihantar</h1>
        <Link href="/dashboard/vendor/products/new">
          <Button>Hantar Produk</Button>
        </Link>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">Berat</th>
              <th className="px-6 py-4">Harga</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Nota Admin</th>
              <th className="px-6 py-4">Tarikh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Memuatkan...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Tiada submission.</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{it.name}</td>
                  <td className="px-6 py-4">{it.weight}g</td>
                  <td className="px-6 py-4">RM {Number(it.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(it.status)}`}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{it.adminNote || '-'}</td>
                  <td className="px-6 py-4">{it.createdAt ? new Date(it.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

