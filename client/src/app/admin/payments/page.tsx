'use client';

import { useEffect, useState } from 'react';
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

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [methodFilter, setMethodFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [statusFilter, methodFilter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      if (methodFilter) qs.set('method', methodFilter);

      const data = await fetchAPI(`/payments?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || 'Gagal memuatkan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await fetchAPI(`/payments/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      load();
    } catch (e: any) {
      setError(e?.message || 'Gagal meluluskan pembayaran');
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    if (!window.confirm('Tolak pembayaran ini?')) return;
    setActionLoadingId(id);
    setError(null);
    try {
      await fetchAPI(`/payments/${id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      load();
    } catch (e: any) {
      setError(e?.message || 'Gagal menolak pembayaran');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Semakan Pembayaran</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Diluluskan</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
          >
            <option value="">Semua Kaedah</option>
            <option value="MANUAL_TRANSFER">Transfer Bank</option>
            <option value="EWALLET">E-Wallet</option>
          </select>
          <Button variant="outline" onClick={load}>
            Muat Semula
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">{error}</div>}

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Pembeli</th>
              <th className="px-6 py-4">Pesanan</th>
              <th className="px-6 py-4">Jumlah</th>
              <th className="px-6 py-4">Kaedah</th>
              <th className="px-6 py-4">Rujukan</th>
              <th className="px-6 py-4">Slip</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
                  Memuatkan...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
                  Tiada pembayaran.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{it.user?.name || '-'}</p>
                      <p className="text-xs">{it.user?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">#{String(it.orderId || '').slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs">{it.order?.status || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{formatMoneyMYR(it.amount)}</td>
                  <td className="px-6 py-4">{it.method}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white">{it.reference || '-'}</p>
                      <p className="text-xs">{it.bankName || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {it.proofUrl ? (
                      <a href={it.proofUrl} target="_blank" rel="noreferrer" className="text-gold-500 hover:underline">
                        Lihat
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(it.status)}`}>{it.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {String(it.status || '').toUpperCase() === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => approve(it.id)} disabled={actionLoadingId === it.id}>
                          {actionLoadingId === it.id ? 'Memproses...' : 'Lulus'}
                        </Button>
                        <Button variant="outline" onClick={() => reject(it.id)} disabled={actionLoadingId === it.id}>
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
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
