'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';
import { format } from 'date-fns';

export default function AdminInvestmentLedgerDetailPage() {
  const params = useParams();
  const partnerId = String((params as any)?.partnerId || '');

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const tokenHeader = useMemo(() => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` }), []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/investment-ledger/${encodeURIComponent(partnerId)}`, {
        headers: tokenHeader,
      });
      setPartner(data?.partner || null);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  };

  const payoutRefs = useMemo(() => {
    const refs = new Set<string>();
    for (const it of items) {
      if (String(it?.type || '') === 'OFFER_PAYOUT' && it?.referenceId) {
        refs.add(String(it.referenceId));
      }
    }
    return refs;
  }, [items]);

  useEffect(() => {
    if (!partnerId) return;
    load();
  }, [partnerId]);

  const restore = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await fetchAPI(`/investment-ledger/${encodeURIComponent(partnerId)}/restore`, {
        method: 'POST',
        headers: tokenHeader,
        body: JSON.stringify({ amount: amt, note: note || null }),
      });
      setAmount('');
      setNote('');
      await load();
      alert('Deposit telah dikembalikan.');
    } catch (err) {
      alert((err as any)?.message || 'Gagal mengembalikan deposit');
    } finally {
      setSaving(false);
    }
  };

  const payout = async (entryId: string) => {
    if (!entryId) return;
    setPayingId(entryId);
    try {
      await fetchAPI(`/investment-ledger/${encodeURIComponent(partnerId)}/payout`, {
        method: 'POST',
        headers: tokenHeader,
        body: JSON.stringify({ entryId }),
      });
      await load();
      alert('Payout berjaya. Amaun dipulangkan ke deposit dan gram ditolak.');
    } catch (err) {
      alert((err as any)?.message || 'Gagal payout transaksi');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ledger Partner</h1>
          <p className="text-sm text-gray-400">{partner?.name || '-'} • {partner?.email || '-'}</p>
        </div>
        <Button variant="outline" onClick={load}>Muat Semula</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-500">Baki Pelaburan (RM)</div>
          <div className="text-xl font-bold text-white">RM {Number(partner?.wallet?.investmentTotal || 0).toFixed(2)}</div>
        </div>
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-gray-500">Gram Diluluskan (g)</div>
          <div className="text-xl font-bold text-white">{Number(partner?.wallet?.investmentGramsTotal || 0).toFixed(4)} g</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Kembalikan Deposit</h2>
        <form onSubmit={restore} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amaun (RM)</label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Contoh: 1000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Nota (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Pembetulan transaksi" />
          </div>
          <Button type="submit" disabled={saving || !amount}>
            {saving ? 'Memproses...' : 'Tambah Deposit'}
          </Button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Tarikh</th>
              <th className="px-6 py-4">Jenis</th>
              <th className="px-6 py-4">Amaun (RM)</th>
              <th className="px-6 py-4">Gram (g)</th>
              <th className="px-6 py-4">Margin (RM)</th>
              <th className="px-6 py-4">Nota</th>
              <th className="px-6 py-4">Ref</th>
              <th className="px-6 py-4">Tindakan</th>
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
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">{it.createdAt ? format(new Date(it.createdAt), 'MMM dd, yyyy HH:mm') : '-'}</td>
                  <td className="px-6 py-4 text-white">{String(it.type || '-')}</td>
                  <td className="px-6 py-4">RM {Number(it.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-mono text-white">{Number(it.grams || 0).toFixed(4)}</td>
                  <td className="px-6 py-4">RM {Number(it.margin || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">{it.note || '-'}</td>
                  <td className="px-6 py-4 font-mono text-xs">{it.referenceId || '-'}</td>
                  <td className="px-6 py-4">
                    {String(it.type || '') === 'OFFER_APPROVED' ? (
                      payoutRefs.has(String(it.id)) ? (
                        <span className="text-xs text-gray-400">Sudah payout</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={payingId === String(it.id)}
                          onClick={() => payout(String(it.id))}
                        >
                          {payingId === String(it.id) ? 'Memproses...' : 'Payout'}
                        </Button>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
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
