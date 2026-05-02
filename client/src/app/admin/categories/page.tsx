'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI('/categories');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || 'Gagal memuatkan kategori');
    } finally {
      setLoading(false);
    }
  };

  const updateLocal = (id: string, patch: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      await fetchAPI('/categories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name,
          description: newDescription.trim() || undefined,
        }),
      });
      setNewName('');
      setNewDescription('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal tambah kategori');
    } finally {
      setCreating(false);
    }
  };

  const save = async (it: any) => {
    setSavingId(it.id);
    setError(null);
    try {
      await fetchAPI(`/categories/${it.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: it.name,
          description: it.description,
        }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal simpan kategori');
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await fetchAPI(`/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal padam kategori');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Kategori Produk</h1>
        </div>
        <Button variant="outline" onClick={load}>
          Muat Semula
        </Button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">{error}</div>}

      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Tambah Kategori Baharu</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nama Kategori</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Barang Kemas" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Penerangan (optional)</label>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Contoh: Koleksi untuk pemakaian harian"
            />
          </div>
          <Button type="submit" disabled={creating || !newName.trim()}>
            {creating ? 'Menambah...' : 'Tambah'}
          </Button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">Penerangan</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center">
                  Memuatkan...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center">
                  Tiada kategori ditemui.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <Input
                      value={String(it.name ?? '')}
                      onChange={(e) => updateLocal(it.id, { name: e.target.value })}
                      placeholder="Nama kategori"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      value={String(it.description ?? '')}
                      onChange={(e) => updateLocal(it.id, { description: e.target.value })}
                      placeholder="Penerangan (optional)"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => save(it)} disabled={savingId === it.id}>
                        {savingId === it.id ? 'Menyimpan...' : 'Simpan'}
                      </Button>
                      <Button variant="destructive" onClick={() => setDeleteTarget(it)}>
                        Padam
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Padam kategori?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Kategori <span className="font-bold text-white">{deleteTarget?.name}</span> akan dipadam. Produk yang
              menggunakan kategori ini akan jadi tanpa kategori.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {deleting ? 'Memadam...' : 'Padam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

