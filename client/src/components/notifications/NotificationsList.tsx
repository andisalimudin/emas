'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/lib/api';

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

function formatWhen(input: any) {
  const d = new Date(String(input || ''));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function NotificationsList() {
  const limit = 20;
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = useMemo(() => items.length > 0 && items.length % limit === 0, [items.length]);

  const loadPage = useCallback(
    async (nextPage: number) => {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAPI(`/notifications?page=${nextPage}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rows = Array.isArray(res) ? (res as NotificationRow[]) : [];
        setItems((prev) => (nextPage === 1 ? rows : [...prev, ...rows]));
        setPage(nextPage);
      } catch (e: any) {
        setError(String(e?.message || 'Gagal memuat notifikasi'));
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const markRead = useCallback(async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetchAPI(`/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
  }, []);

  const markAll = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetchAPI('/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Notifikasi</h1>
        <button
          type="button"
          className="px-3 py-2 rounded-lg border border-gold-500/30 text-gold-500 hover:bg-gold-500/10 transition-colors disabled:opacity-50"
          onClick={markAll}
          disabled={loading || items.every((x) => x.isRead)}
        >
          Tandakan semua dibaca
        </button>
      </div>

      {error ? <div className="text-red-500 text-sm">{error}</div> : null}

      <div className="space-y-3">
        {items.length === 0 && !loading ? (
          <div className="text-gray-400">Tiada notifikasi buat masa ini.</div>
        ) : null}

        {items.map((n) => (
          <div
            key={n.id}
            className={[
              'p-4 rounded-xl border transition-colors',
              n.isRead ? 'border-white/10 bg-zinc-900/40' : 'border-gold-500/30 bg-gold-500/5',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{n.title}</div>
                <div className="text-sm text-gray-300 mt-1 whitespace-pre-line">{n.message}</div>
                <div className="text-xs text-gray-500 mt-2">{formatWhen(n.createdAt)}</div>
              </div>
              {!n.isRead ? (
                <button
                  type="button"
                  className="text-xs text-gold-500 hover:text-gold-400 shrink-0"
                  onClick={() => markRead(n.id)}
                >
                  Tandakan dibaca
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        {hasMore ? (
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            onClick={() => loadPage(page + 1)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Muat lagi'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

