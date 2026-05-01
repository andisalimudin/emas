'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit, Mail, Phone, Shield, User, Calendar, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchAPI } from '@/lib/api';
import { format } from 'date-fns';

export default function ViewUserProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchAPI(`/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUser(data);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Gagal memuatkan profil pengguna');
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  if (loading) return <div className="text-white text-center py-8">Memuatkan...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">Profil Pengguna</h1>
            <p className="text-sm text-gray-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <Link href={`/admin/users/${id}`}>
          <Button className="flex items-center gap-2">
            <Edit size={16} />
            Edit
          </Button>
        </Link>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
          {error}
        </div>
      ) : null}

      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="text-gold-500" size={28} />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-white truncate">{user?.name || '-'}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200">
                <Shield size={14} className="text-gold-500" />
                {user?.role || 'CUSTOMER'}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  user?.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : user?.status === 'PENDING_APPROVAL'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}
              >
                {String(user?.status || '').replace('_', ' ') || 'ACTIVE'}
              </span>
              {user?.isLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-200">
                  <Lock size={14} className="text-gold-500" />
                  Locked
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Mail size={14} className="text-gold-500" />
              Email
            </div>
            <div className="text-white font-medium mt-2 break-all">{user?.email || '-'}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <User size={14} className="text-gold-500" />
              Username
            </div>
            <div className="text-white font-medium mt-2">{user?.username || '-'}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Phone size={14} className="text-gold-500" />
              Telefon
            </div>
            <div className="text-white font-medium mt-2">{user?.phone || '-'}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Calendar size={14} className="text-gold-500" />
              Tarikh Daftar
            </div>
            <div className="text-white font-medium mt-2">
              {user?.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

