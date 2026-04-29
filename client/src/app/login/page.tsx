'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      // Store token
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-white/10 shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-2">Selamat Kembali</h2>
        <p className="text-gray-400 text-center mb-8">Log masuk ke akaun anda</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Emel / Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Masukkan emel atau username"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang log masuk...' : 'Log Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Tiada akaun?{' '}
          <Link href="/register" className="text-gold-500 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
