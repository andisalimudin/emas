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

export default function AdminInvestmentSubmissionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    load();
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/investment-submissions?status=${encodeURIComponent(statusFilter)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    setActionLoadingId(id);
    try {
      await fetchAPI(`/investment-submissions/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      load();
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    const note = window.prompt('Masukkan nota penolakan (optional):') || '';
    setActionLoadingId(id);
    try {
      await fetchAPI(`/investment-submissions/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ adminNote: note }),
      });
      load();
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Semakan Pelaburan Partner</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
          >
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Diluluskan</option>
            <option value="REJECTED">Ditolak</option>
          </select>
          <Button variant="outline" onClick={load}>Muat Semula</Button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Partner</th>
              <th className="px-6 py-4">Modal</th>
              <th className="px-6 py-4">Transfer</th>
              <th className="px-6 py-4">Bank Ref</th>
              <th className="px-6 py-4">Slip</th>
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
                <td colSpan={8} className="px-6 py-8 text-center">Tiada submission.</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{it.partner?.name || '-'}</p>
                      <p className="text-xs">{it.partner?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">RM {Number(it.capitalAmount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">RM {Number(it.transferAmount || 0).toFixed(2)}</td>
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
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(it.status)}`}>
                      {it.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{it.adminNote || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    {it.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => approve(it.id)}
                          disabled={actionLoadingId === it.id}
                        >
                          {actionLoadingId === it.id ? 'Memproses...' : 'Lulus'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => reject(it.id)}
                          disabled={actionLoadingId === it.id}
                        >
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

