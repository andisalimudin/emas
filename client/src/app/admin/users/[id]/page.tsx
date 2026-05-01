'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_URL, fetchAPI } from '@/lib/api';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    avatarUrl: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    isLocked: false,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const data = await fetchAPI(`/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFormData({
        name: data.name || '',
        email: data.email || '',
        username: data.username || '',
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || '',
        role: data.role || 'CUSTOMER',
        status: data.status || 'ACTIVE',
        isLocked: !!data.isLocked,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuatkan pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await fetchAPI(`/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username || null,
          phone: formData.phone || null,
          avatarUrl: formData.avatarUrl || null,
          role: formData.role,
          status: formData.status,
          isLocked: formData.isLocked,
        }),
      });

      router.push('/admin/users');
    } catch (err: any) {
      setError(err.message || 'Gagal mengemaskini pengguna');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Gagal upload gambar');
      setFormData((prev) => ({ ...prev, avatarUrl: String(data?.url || '') }));
    } catch (err: any) {
      setError(err?.message || 'Gagal upload gambar');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-8">Memuatkan...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Pengguna</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Nama"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Nama pengguna"
          />

          <Input
            label="Emel"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="contoh@domain.com"
          />

          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Contoh: amyreyes"
          />

          <Input
            label="Telefon"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="cth. 60123456789"
          />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Gambar Profil (Avatar)</label>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500">Tiada</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  label="Avatar URL"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
                    <Camera size={16} className="text-gold-500" />
                    {avatarUploading ? 'Sedang upload...' : 'Upload Gambar'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={avatarUploading}
                    className="hidden"
                    onChange={(e) => {
                      const file = (e.target as any)?.files?.[0];
                      if (file) uploadAvatar(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Peranan</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
              >
                <option value="ADMIN">Pentadbir</option>
                <option value="CUSTOMER">Pelanggan</option>
                <option value="PARTNER">Rakan Kongsi</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Tidak Aktif</option>
                <option value="SUSPENDED">Digantung</option>
                <option value="PENDING_APPROVAL">Menunggu Kelulusan</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              name="isLocked"
              checked={formData.isLocked}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-gray-300">Kunci Akaun</span>
          </label>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <Link href="/admin/users">
            <Button type="button" variant="ghost">Batal</Button>
          </Link>
          <Button type="submit" disabled={saving || avatarUploading}>
            {saving ? 'Sedang Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
