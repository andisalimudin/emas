'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';

export default function AdminInvestmentCommitmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/investment-offers/commitments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const rows = Array.isArray(data) ? data : [];
      rows.sort((a: any, b: any) => {
        const ap = String(a?.status || '').toUpperCase() === 'PENDING' ? 0 : 1;
        const bp = String(b?.status || '').toUpperCase() === 'PENDING' ? 0 : 1;
        if (ap !== bp) return ap - bp;
        const at = new Date(a?.createdAt || 0).getTime();
        const bt = new Date(b?.createdAt || 0).getTime();
        return bt - at;
      });
      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    setProcessingId(id);
    try {
      await fetchAPI(`/investment-offers/commitments/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      await load();
      alert('Diluluskan. Wallet pelaburan ditolak amaun pelaburan dan margin dikreditkan.');
    } catch (err) {
      alert((err as any)?.message || 'Gagal meluluskan');
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (id: string) => {
    setProcessingId(id);
    try {
      await fetchAPI(`/investment-offers/commitments/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          adminNote: (notes[id] || '').trim() || null,
        }),
      });
      await load();
      alert('Ditolak. Tiada potongan dibuat pada wallet pelaburan.');
    } catch (err) {
      alert((err as any)?.message || 'Gagal menolak');
    } finally {
      setProcessingId(null);
    }
  };

  const updateNote = (id: string, value: string) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Semakan Pelaburan Offer Partner</h1>
        <Button variant="outline" onClick={load}>Muat Semula</Button>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Partner</th>
              <th className="px-6 py-4">Offer</th>
              <th className="px-6 py-4">Gram</th>
              <th className="px-6 py-4">Amaun (RM)</th>
              <th className="px-6 py-4">Margin / g</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Nota</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Memuatkan...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">Tiada rekod.</td>
              </tr>
            ) : (
              items.map((it) => {
                const isPending = String(it.status || '').toUpperCase() === 'PENDING';
                const disabled = processingId === it.id || !isPending;
                return (
                  <tr key={it.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{it.partner?.name || '-'}</div>
                        <div className="text-xs">{it.partner?.email || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{it.offer?.title || it.offer?.baseCategory || '-'}</td>
                    <td className="px-6 py-4 font-mono text-white">{Number(it.grams || 0).toFixed(4)}g</td>
                    <td className="px-6 py-4">RM {Number(it.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">RM {Number(it.marginPerGram || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">{String(it.status || '-')}</td>
                    <td className="px-6 py-4">
                      <Input
                        value={notes[it.id] ?? String(it.adminNote ?? '')}
                        onChange={(e) => updateNote(it.id, e.target.value)}
                        placeholder="Nota (optional)"
                        disabled={!isPending}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button onClick={() => approve(it.id)} disabled={disabled}>
                          {processingId === it.id ? 'Memproses...' : 'Approve'}
                        </Button>
                        <Button variant="outline" onClick={() => reject(it.id)} disabled={disabled}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
