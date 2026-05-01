'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export function NotificationBell({ href }: { href: string }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const [countRes, listRes] = await Promise.all([
        fetchAPI('/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchAPI('/notifications?page=1&limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setUnreadCount(Number(countRes?.count || 0));
      setItems(Array.isArray(listRes) ? listRes : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetchAPI(`/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAll = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetchAPI('/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) load();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="text-gray-400 hover:text-gold-500 transition-colors relative"
          aria-label="Notifikasi"
        >
          <Bell size={20} />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-zinc-900 text-white border border-white/10">
        <div className="px-2 py-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Notifikasi</div>
          <button
            type="button"
            className="text-xs text-gold-500 hover:text-gold-400 disabled:opacity-50"
            onClick={markAll}
            disabled={loading || unreadCount === 0}
          >
            Tandakan semua dibaca
          </button>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {items.length === 0 ? (
          <div className="px-2 py-6 text-sm text-gray-400 text-center">Tiada notifikasi</div>
        ) : (
          <>
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="cursor-pointer focus:bg-white/5"
                onSelect={async (e) => {
                  e.preventDefault();
                  if (!n.isRead) await markRead(n.id);
                  router.push(href);
                }}
              >
                <div className="flex flex-col gap-0.5 w-full">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white truncate">{n.title}</div>
                    {!n.isRead ? <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" /> : null}
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2">{n.message}</div>
                  <div className="text-[11px] text-gray-500">{formatWhen(n.createdAt)}</div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-white/10" />

            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/5 justify-center text-gold-500"
              onSelect={(e) => {
                e.preventDefault();
                router.push(href);
              }}
            >
              Lihat semua
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

