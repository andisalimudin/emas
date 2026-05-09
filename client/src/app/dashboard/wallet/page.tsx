'use client';

import { useMemo, useState, useEffect } from 'react';
import { API_URL, fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, CreditCard, ArrowUpRight, History, TrendingUp, Scale } from 'lucide-react';
import { format } from 'date-fns';

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

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [investments, setInvestments] = useState<any[]>([]);
  const [investmentLoading, setInvestmentLoading] = useState(false);
  const [investmentProcessing, setInvestmentProcessing] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [proofUrl, setProofUrl] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofFileName, setProofFileName] = useState('');
  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);
  const [gramsToSubmit, setGramsToSubmit] = useState('');
  const [offerProcessingId, setOfferProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadWallet();
  }, []);

  useEffect(() => {
    if (user?.role === 'PARTNER') {
      loadInvestments();
      loadOffers();
      loadCommitments();
    }
  }, [user?.role]);

  const refreshPartnerData = async () => {
    await loadWallet();
    await loadInvestments();
    await loadOffers();
    await loadCommitments();
  };

  const loadWallet = async () => {
    try {
      const data = await fetchAPI('/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvestments = async () => {
    setInvestmentLoading(true);
    try {
      const data = await fetchAPI('/investment-submissions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setInvestments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load investments:', err);
    } finally {
      setInvestmentLoading(false);
    }
  };

  const loadOffers = async () => {
    setOffersLoading(true);
    try {
      const data = await fetchAPI('/investment-offers/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setOffersLoading(false);
    }
  };

  const loadCommitments = async () => {
    setCommitmentsLoading(true);
    try {
      const data = await fetchAPI('/investment-offers/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setCommitments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load commitments:', err);
    } finally {
      setCommitmentsLoading(false);
    }
  };

  const commitOffer = async (offerId: string, gramsStr: string) => {
    const grams = Number(gramsStr);
    if (!Number.isFinite(grams) || grams <= 0) return;

    setOfferProcessingId(offerId);
    try {
      await fetchAPI(`/investment-offers/${offerId}/commit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ grams }),
      });
      setGramsToSubmit('');
      await loadWallet();
      await loadOffers();
      await loadCommitments();
      alert('Permohonan pelaburan telah dihantar untuk semakan admin.');
    } catch (err) {
      console.error('Failed to commit offer:', err);
      alert((err as any)?.message || 'Gagal membuat pelaburan');
    } finally {
      setOfferProcessingId(null);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount) return;

    setProcessing(true);
    try {
      await fetchAPI('/wallet/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tokens: parseInt(topUpAmount) }),
      });
      setTopUpAmount('');
      await loadWallet();
      alert('Tambah nilai berjaya!');
    } catch (err) {
      console.error('Failed to top up:', err);
      alert('Tambah nilai gagal');
    } finally {
      setProcessing(false);
    }
  };

  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || !proofUrl) return;

    setInvestmentProcessing(true);
    try {
      await fetchAPI('/investment-submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          transferAmount: Number(transferAmount),
          bankName,
          reference,
          paymentDate,
          proofUrl,
        }),
      });
      setTransferAmount('');
      setBankName('');
      setReference('');
      setProofUrl('');
      setProofFileName('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      await loadWallet();
      await loadInvestments();
      alert('Permohonan pelaburan telah dihantar untuk semakan admin.');
    } catch (err) {
      console.error('Failed to submit investment:', err);
      alert((err as any)?.message || 'Gagal hantar permohonan pelaburan');
    } finally {
      setInvestmentProcessing(false);
    }
  };

  const uploadProof = async (file: File) => {
    setProofUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal upload fail');
      }
      setProofUrl(String(data?.url || ''));
      setProofFileName(file.name);
    } catch (err) {
      setProofUrl('');
      setProofFileName('');
      alert((err as any)?.message || 'Gagal upload fail');
    } finally {
      setProofUploading(false);
    }
  };

  const highlightOffer = useMemo(() => {
    if (!Array.isArray(offers) || offers.length === 0) return null;
    return [...offers].sort((a, b) => Number(b?.gramsRemaining || 0) - Number(a?.gramsRemaining || 0))[0];
  }, [offers]);

  if (loading) return <div className="text-center py-12 text-gray-500">Sedang memuatkan dompet...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">E-Wallet</h1>

      {user?.role === 'PARTNER' && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={refreshPartnerData}>Muat Semula</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Baki Gram</div>
              <div className="text-3xl font-bold text-gold-500">
                {Number(wallet?.investmentGramsTotal || 0).toFixed(2)} g
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Harga Semasa/g (B&I)</div>
              <div className="text-3xl font-bold text-gold-500">
                {highlightOffer ? formatMoneyMYR(highlightOffer.basePricePerGram) : '-'}
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-2">Margin/g</div>
              <div className="text-3xl font-bold text-gold-500">
                {highlightOffer ? formatMoneyMYR(highlightOffer.marginPerGram) : '-'}
              </div>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <div className="text-sm text-gray-400 mb-3">Masukkan Gram</div>
              <div className="space-y-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Contoh: 1.25"
                  value={gramsToSubmit}
                  onChange={(e) => setGramsToSubmit(e.target.value)}
                />
                <Button
                  onClick={() => highlightOffer && commitOffer(highlightOffer.id, gramsToSubmit)}
                  disabled={!highlightOffer || offerProcessingId === highlightOffer?.id || !gramsToSubmit.trim()}
                  className="w-full"
                >
                  {offerProcessingId === highlightOffer?.id ? 'Memproses...' : 'Hantar'}
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Jumlah: {highlightOffer ? formatMoneyMYR(Number(gramsToSubmit || 0) * Number(highlightOffer.basePricePerGram || 0)) : '-'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">Jumlah Deposit Pelaburan (Diluluskan)</h3>
              <p className="text-3xl font-bold text-gold-500">
                {formatMoneyMYR(wallet?.investmentTotal || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Jumlah ini akan bertambah selepas admin meluluskan slip bayaran.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Masukkan Pelaburan</h3>
              <form onSubmit={handleInvestmentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Jumlah Transfer (RM)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Contoh: 5000"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bank</label>
                    <Input
                      placeholder="Contoh: Maybank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Rujukan / Ref</label>
                    <Input
                      placeholder="Contoh: FT123456"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tarikh Pembayaran</label>
                    <Input
                      type="date"
                      value={paymentDate}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bukti Pembayaran (Gambar/PDF)</label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={proofUploading}
                      onChange={(e) => {
                        const file = (e.target as any)?.files?.[0];
                        if (file) uploadProof(file);
                      }}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      {proofUploading ? 'Sedang upload...' : proofUrl ? `Fail: ${proofFileName || 'Uploaded'}` : 'Sila pilih fail bukti pembayaran.'}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={investmentProcessing || !transferAmount || !proofUrl || proofUploading}
                  className="w-full"
                >
                  {investmentProcessing ? 'Sedang Memproses...' : 'Hantar Untuk Semakan Admin'}
                </Button>
              </form>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Sejarah Pelaburan (Gram)</h3>
              <Button variant="outline" onClick={loadCommitments}>Muat Semula</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4">Tarikh</th>
                    <th className="px-6 py-4">Gram</th>
                    <th className="px-6 py-4">Amaun</th>
                    <th className="px-6 py-4">Margin/g</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {commitmentsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">Memuatkan...</td>
                    </tr>
                  ) : commitments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">Tiada rekod lagi.</td>
                    </tr>
                  ) : (
                    commitments.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          {format(new Date(c.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 font-mono text-white">{Number(c.grams || 0).toFixed(2)} g</td>
                        <td className="px-6 py-4">{formatMoneyMYR(c.amount || 0)}</td>
                        <td className="px-6 py-4">{formatMoneyMYR(c.marginPerGram || 0)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusBadge(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Sejarah Permohonan Pelaburan</h3>
              <Button variant="outline" onClick={loadInvestments}>Muat Semula</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4">Tarikh</th>
                    <th className="px-6 py-4">Transfer</th>
                    <th className="px-6 py-4">Ref</th>
                    <th className="px-6 py-4">Slip</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {investmentLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">Memuatkan...</td>
                    </tr>
                  ) : investments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">Tiada permohonan lagi.</td>
                    </tr>
                  ) : (
                    investments.map((it) => (
                      <tr key={it.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          {format(new Date(it.createdAt), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4">{formatMoneyMYR(it.transferAmount || 0)}</td>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gold-600 to-gold-800 rounded-xl p-8 text-black shadow-lg shadow-gold-900/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium opacity-80 mb-1">Baki Semasa</p>
              <h2 className="text-4xl font-bold">{wallet?.balance || 0} Token</h2>
            </div>
            <div className="bg-black/20 p-3 rounded-lg">
              <Wallet size={32} className="text-black" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium opacity-70">
            1 Token = RM 2.00
          </p>
        </div>

        {/* Top Up Form */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-gold-500" />
            Tambah Nilai Token
          </h3>
          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Jumlah (Token)</label>
              <Input
                type="number"
                min="1"
                placeholder="Masukkan jumlah"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
              {topUpAmount && (
                <p className="text-xs text-gray-500 mt-2">
                  Kos: {formatMoneyMYR(parseInt(topUpAmount) * 2)}
                </p>
              )}
            </div>
            <Button type="submit" disabled={processing || !topUpAmount} className="w-full">
              {processing ? 'Sedang Memproses...' : 'Tambah Nilai Sekarang'}
            </Button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <History size={20} className="text-gold-500" />
          <h3 className="text-lg font-bold text-white">Sejarah Transaksi</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Tarikh</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wallet?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">Tiada transaksi lagi.</td>
                </tr>
              ) : (
                wallet?.transactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        tx.amount > 0 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{tx.description}</td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${
                      tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
