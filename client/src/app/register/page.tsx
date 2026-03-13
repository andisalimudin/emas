'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      // After register, maybe auto-login or redirect to login?
      // For now, redirect to login
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-white/10 shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-2">Cipta Akaun</h2>
        <p className="text-gray-400 text-center mb-8">Sertai platform GoldExclude</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Nama Penuh</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Masukkan nama penuh anda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Emel</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Masukkan emel anda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Kata Laluan</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Masukkan kata laluan anda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Peranan</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
            >
              <option value="CUSTOMER">Pelanggan</option>
              <option value="AGENT">Ejen</option>
              <option value="FUNDER">Pembiaya</option>
              <option value="PARTNER">Rakan Kongsi</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang mencipta akaun...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Sudah mempunyai akaun?{' '}
          <Link href="/login" className="text-gold-500 hover:underline">
            Log Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
