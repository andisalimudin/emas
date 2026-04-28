'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';

export default function AdminCategoryGoldPricesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newPricePerGram, setNewPricePerGram] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/category-gold-prices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const updateLocal = (key: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, pricePerGram: value } : it)));
  };

  const updateLocalCategory = (key: string, value: string) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, category: value } : it)));
  };

  const save = async (it: any) => {
    setSavingKey(it.key);
    try {
      await fetchAPI(`/category-gold-prices/${encodeURIComponent(it.key)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          category: it.category,
          pricePerGram: Number(it.pricePerGram),
        }),
      });
      await load();
    } finally {
      setSavingKey(null);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCreating(true);
    try {
      await fetchAPI('/category-gold-prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          category: newCategory,
          pricePerGram: newPricePerGram ? Number(newPricePerGram) : 0,
        }),
      });
      setNewCategory('');
      setNewPricePerGram('');
      await load();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Harga Emas 1g Mengikut Kategori</h1>
        <Button variant="outline" onClick={load}>Muat Semula</Button>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Tambah Kategori Baharu</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nama Kategori</label>
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Contoh: Gold Bar"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Harga 1g (RM)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={newPricePerGram}
              onChange={(e) => setNewPricePerGram(e.target.value)}
              placeholder="Contoh: 350.00"
            />
          </div>
          <Button type="submit" disabled={creating || !newCategory.trim()}>
            {creating ? 'Menambah...' : 'Tambah'}
          </Button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Harga 1g (RM)</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center">Memuatkan...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center">Tiada kategori ditemui.</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.key} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <Input
                      value={String(it.category ?? '')}
                      onChange={(e) => updateLocalCategory(it.key, e.target.value)}
                      placeholder="Nama kategori"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={String(it.pricePerGram ?? '')}
                      onChange={(e) => updateLocal(it.key, e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => save(it)} disabled={savingKey === it.key}>
                      {savingKey === it.key ? 'Menyimpan...' : 'Simpan'}
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
