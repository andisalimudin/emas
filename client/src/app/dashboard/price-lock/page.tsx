'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Clock, Lock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function PriceLockPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [activeLock, setActiveLock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [goldPrice, setGoldPrice] = useState(385.50); // Dummy price

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const walletData = await fetchAPI('/wallet', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setWallet(walletData);
      
      // Fetch active lock (mock for now)
      // setActiveLock(null); 
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLockPrice = async () => {
    if (!wallet || wallet.balance < 1) {
      alert('Token tidak mencukupi! Sila tambah nilai dompet anda.');
      return;
    }

    if (!confirm('Ini akan menolak 1 Token dari dompet anda. Teruskan?')) return;

    setProcessing(true);
    try {
      // 1. Deduct token
      await fetchAPI('/wallet/deduct', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ tokens: 1, description: 'Price Lock Fee' }),
      });

      // 2. Create Lock (Mock)
      setActiveLock({
        id: 'lock-123',
        price: goldPrice,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
      });

      await loadData(); // Refresh wallet
      alert('Harga berjaya dikunci selama 15 minit!');
    } catch (err) {
      console.error('Failed to lock price:', err);
      alert('Gagal mengunci harga');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Sedang memuatkan...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Sistem Kunci Harga</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Price Card */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-6">
          <div className="bg-gold-500/10 p-4 rounded-full text-gold-500">
            <Clock size={48} />
          </div>
          <div>
            <p className="text-gray-400 mb-2">Harga Emas Semasa (999.9)</p>
            <h2 className="text-5xl font-bold text-white">RM {goldPrice.toFixed(2)}<span className="text-lg text-gray-500">/g</span></h2>
          </div>
          
          {activeLock ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 w-full">
              <h3 className="text-green-500 font-bold flex items-center justify-center gap-2 mb-2">
                <Lock size={18} /> Harga Dikunci!
              </h3>
              <p className="text-sm text-gray-300">
                Dikunci pada: <span className="font-bold text-white">RM {activeLock.price.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-300">
                Tamat pada: {format(new Date(activeLock.expiresAt), 'HH:mm:ss')}
              </p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-between text-sm px-4">
                <span className="text-gray-400">Baki Dompet:</span>
                <span className="font-bold text-gold-500">{wallet?.balance || 0} Token</span>
              </div>
              <Button 
                onClick={handleLockPrice} 
                disabled={processing || (wallet?.balance || 0) < 1}
                className="w-full py-6 text-lg bg-gold-500 hover:bg-gold-400 text-black font-bold"
              >
                {processing ? 'Sedang Memproses...' : 'Kunci Harga Sekarang (1 Token)'}
              </Button>
              {(wallet?.balance || 0) < 1 && (
                <p className="text-xs text-red-500 flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Token tidak mencukupi
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">Bagaimana ia berfungsi</h3>
          <ul className="space-y-4 text-gray-400">
            <li className="flex gap-3">
              <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</div>
              <p>Semak harga emas semasa secara langsung.</p>
            </li>
            <li className="flex gap-3">
              <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</div>
              <p>Gunakan <strong>1 Token</strong> dari dompet anda untuk mengunci harga selama <strong>15 minit</strong>.</p>
            </li>
            <li className="flex gap-3">
              <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</div>
              <p>Buat pembayaran dalam had masa untuk mendapatkan emas pada harga yang dikunci.</p>
            </li>
            <li className="flex gap-3">
              <div className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">4</div>
              <p>Jika masa tamat, harga akan kembali kepada harga pasaran semasa.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
