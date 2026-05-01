'use client';

import { useEffect, useState } from 'react';
import { API_URL, fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Save, Lock } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const me = await fetchAPI('/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setEmail(String(me?.email || ''));
        setUsername(String(me?.username || ''));
        setName(String(me?.name || ''));
        setPhone(String(me?.phone || ''));
        setAvatarUrl(String(me?.avatarUrl || ''));
      } catch (err: any) {
        console.error(err);
        setError('Gagal memuatkan profil');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const uploadAvatar = async (file: File) => {
    setAvatarUploading(true);
    setError('');
    setSuccess('');
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
      setAvatarUrl(String(data?.url || ''));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal upload gambar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await fetchAPI('/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          name,
          username: username || null,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
        }),
      });
      setEmail(String(updated?.email || ''));
      setUsername(String(updated?.username || ''));
      setName(String(updated?.name || ''));
      setPhone(String(updated?.phone || ''));
      setAvatarUrl(String(updated?.avatarUrl || ''));

      const storedUser = localStorage.getItem('user');
      const parsed = storedUser ? JSON.parse(storedUser) : {};
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...parsed,
          email: updated?.email,
          username: updated?.username,
          name: updated?.name,
          phone: updated?.phone,
          avatarUrl: updated?.avatarUrl,
        }),
      );

      setSuccess('Profil berjaya dikemas kini');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal kemas kini profil');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setPasswordSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!currentPassword || !newPassword) {
        setError('Sila isi kata laluan semasa dan kata laluan baharu');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Pengesahan kata laluan baharu tidak sama');
        return;
      }
      await fetchAPI('/me/password', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Kata laluan berjaya dikemas kini');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal kemas kini kata laluan');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Sedang memuatkan profil...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Profil</h1>
      </div>

      {error ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-red-400">{error}</div>
      ) : null}
      {success ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-green-400">{success}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Gambar Profil</h3>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">Tiada</span>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
                  <Camera size={16} className="text-gold-500" />
                  {avatarUploading ? 'Sedang upload...' : 'Tukar Gambar'}
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
              <p className="text-xs text-gray-500 mt-2">Disyorkan: gambar square, bawah 10MB.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Maklumat Akaun</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nama</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama penuh" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Contoh: amyreyes" />
              <p className="text-xs text-gray-500 mt-2">Boleh kosong. Jika diisi, mestilah unik.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">No Telefon</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 0123456789" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email (tidak boleh diubah)</label>
              <div className="relative">
                <Input value={email} readOnly disabled className="pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile} disabled={saving || avatarUploading} className="flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Tukar Kata Laluan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Kata Laluan Semasa</label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Kata Laluan Baharu</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <p className="text-xs text-gray-500 mt-2">Minimum 8 aksara.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sahkan Kata Laluan Baharu</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={savePassword} disabled={passwordSaving} variant="outline">
            {passwordSaving ? 'Menyimpan...' : 'Kemas Kini Kata Laluan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
