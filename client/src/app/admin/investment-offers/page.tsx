'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';

export default function AdminInvestmentOffersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const baseCategory = 'B&I';
  const [gramsTotal, setGramsTotal] = useState('');
  const [marginPerGram, setMarginPerGram] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/investment-offers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const updateLocal = (id: string, patch: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gramsTotal) return;
    setCreating(true);
    try {
      await fetchAPI('/investment-offers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title,
          gramsTotal: Number(gramsTotal),
          marginPerGram: marginPerGram ? Number(marginPerGram) : 0,
          status,
        }),
      });
      setTitle('');
      setGramsTotal('');
      setMarginPerGram('');
      setStatus('ACTIVE');
      await load();
    } finally {
      setCreating(false);
    }
  };

  const save = async (it: any) => {
    setSavingId(it.id);
    try {
      await fetchAPI(`/investment-offers/${it.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: it.title,
          marginPerGram: Number(it.marginPerGram),
          status: it.status,
        }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Offer Pelaburan (Gram + Margin)</h1>
        <Button variant="outline" onClick={load}>Muat Semula</Button>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Tambah Offer Baharu</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Tajuk (optional)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Offer April" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Kategori Asas</label>
            <Input value={baseCategory} disabled />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Jumlah Gram</label>
            <Input type="number" step="0.0001" min="0" value={gramsTotal} onChange={(e) => setGramsTotal(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Margin / g (RM)</label>
            <Input type="number" step="0.01" min="0" value={marginPerGram} onChange={(e) => setMarginPerGram(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <Button type="submit" disabled={creating || !gramsTotal}>
            {creating ? 'Menambah...' : 'Tambah'}
          </Button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Tajuk</th>
              <th className="px-6 py-4">Kategori Asas</th>
              <th className="px-6 py-4">Gram (Baki/Total)</th>
              <th className="px-6 py-4">Margin / g</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Memuatkan...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">Tiada offer.</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <Input
                      value={String(it.title ?? '')}
                      onChange={(e) => updateLocal(it.id, { title: e.target.value })}
                      placeholder="Tajuk"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      value="B&I"
                      disabled
                    />
                  </td>
                  <td className="px-6 py-4 font-mono text-white">
                    {Number(it.gramsRemaining || 0).toFixed(4)} / {Number(it.gramsTotal || 0).toFixed(4)}
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={String(it.marginPerGram ?? '')}
                      onChange={(e) => updateLocal(it.id, { marginPerGram: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={String(it.status || 'ACTIVE')}
                      onChange={(e) => updateLocal(it.id, { status: e.target.value })}
                      className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => save(it)} disabled={savingId === it.id}>
                      {savingId === it.id ? 'Menyimpan...' : 'Simpan'}
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
