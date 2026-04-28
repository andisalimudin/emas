'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminInvestmentLedgerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/investment-ledger/partners', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = (items || []).filter((it) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return String(it?.name || '').toLowerCase().includes(s) || String(it?.email || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Ledger Pelaburan Partner</h1>
        <Button variant="outline" onClick={load}>Muat Semula</Button>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 flex gap-3 items-center">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email..." />
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Partner</th>
              <th className="px-6 py-4">Baki Pelaburan (RM)</th>
              <th className="px-6 py-4">Gram Diluluskan (g)</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">Memuatkan...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">Tiada data.</td>
              </tr>
            ) : (
              filtered.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{it.name || '-'}</div>
                      <div className="text-xs">{it.email || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">RM {Number(it.wallet?.investmentTotal || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono text-white">{Number(it.wallet?.investmentGramsTotal || 0).toFixed(4)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button asChild>
                      <Link href={`/admin/investment-ledger/${it.id}`}>Lihat Ledger</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
