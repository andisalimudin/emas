'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL, fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, CreditCard, Landmark, Upload } from 'lucide-react';
import Link from 'next/link';

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<'EWALLET' | 'MANUAL_TRANSFER'>('EWALLET');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('Malaysia');

  const [bankName, setBankName] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [proofUrl, setProofUrl] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofFileName, setProofFileName] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [cartData, walletData] = await Promise.all([
        fetchAPI('/cart', { headers: { Authorization: `Bearer ${token}` } }),
        fetchAPI('/wallet', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCart(cartData);
      setWallet(walletData);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuatkan checkout');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum: number, it: any) => sum + Number(it?.product?.price || 0) * Number(it?.quantity || 0), 0);
  }, [cart]);

  const requiredAmount = useMemo(() => Number(totalAmount || 0), [totalAmount]);

  const hasCartItems = Array.isArray(cart?.items) && cart.items.length > 0;

  const uploadProof = async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    setProofUploading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Gagal upload slip');
      setProofUrl(String(data?.url || ''));
      setProofFileName(file.name);
    } finally {
      setProofUploading(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (!hasCartItems) throw new Error('Troli kosong');

      const shippingAddress =
        recipient && phone && street && city && state && zipCode
          ? { label: 'Alamat Penghantaran', recipient, phone, street, city, state, zipCode, country }
          : undefined;

      const order = await fetchAPI('/orders/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shippingAddress }),
      });

      if (method === 'EWALLET') {
        await fetchAPI(`/orders/${order.id}/pay/ewallet`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Pembayaran e-wallet berjaya. Pesanan telah direkodkan.');
      } else {
        if (!proofUrl) throw new Error('Sila upload slip bayaran');
        await fetchAPI(`/orders/${order.id}/pay/transfer`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bankName, reference, proofUrl, paymentDate }),
        });
        setSuccess('Bukti pembayaran berjaya dihantar untuk semakan admin.');
      }

      await loadAll();
    } catch (e: any) {
      setError(e?.message || 'Gagal menghantar pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Sedang memuatkan checkout...</div>;
  }

  if (!hasCartItems) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Checkout</h1>
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 text-gray-400">
          Troli anda kosong. Sila tambah produk terlebih dahulu.
        </div>
        <Link href="/dashboard/products">
          <Button>Lihat Produk</Button>
        </Link>
      </div>
    );
  }

  const walletBalance = Number(wallet?.investmentTotal || 0);
  const ewalletDisabled = walletBalance < requiredAmount;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/cart">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} /> Kembali
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
        </div>
        <Link href="/dashboard/orders">
          <Button variant="outline">Pesanan Saya</Button>
        </Link>
      </div>

      {(error || success) && (
        <div
          className={`border rounded-xl p-4 ${
            error ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-green-500/10 border-green-500/20 text-green-200'
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Alamat Penghantaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Nama Penerima</div>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Contoh: Ahmad" />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">No. Telefon</div>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 0123456789" />
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-400 mb-2">Alamat</div>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Alamat jalan / rumah" />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Bandar</div>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Contoh: Shah Alam" />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Negeri</div>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Contoh: Selangor" />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Poskod</div>
                <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Contoh: 40000" />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Negara</div>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Kaedah Pembayaran</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMethod('EWALLET')}
                className={`border rounded-xl p-4 text-left transition-colors ${
                  method === 'EWALLET' ? 'border-gold-500/40 bg-gold-500/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 text-white font-semibold">
                  <CreditCard size={18} className="text-gold-500" />
                  E-Wallet (Jumlah Deposit Pelaburan)
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Baki: <span className="text-white">{formatMoneyMYR(walletBalance)}</span> • Diperlukan:{' '}
                  <span className="text-white">{formatMoneyMYR(requiredAmount)}</span>
                </div>
                {ewalletDisabled && <div className="text-sm text-red-300 mt-2">Baki deposit pelaburan tidak mencukupi.</div>}
              </button>

              <button
                type="button"
                onClick={() => setMethod('MANUAL_TRANSFER')}
                className={`border rounded-xl p-4 text-left transition-colors ${
                  method === 'MANUAL_TRANSFER'
                    ? 'border-gold-500/40 bg-gold-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 text-white font-semibold">
                  <Landmark size={18} className="text-gold-500" />
                  Transfer Bank (Slip)
                </div>
                <div className="text-sm text-gray-400 mt-2">Hantar bukti pembayaran untuk semakan admin.</div>
              </button>
            </div>

            {method === 'MANUAL_TRANSFER' && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Nama Bank</div>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Contoh: Maybank" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">No. Rujukan</div>
                    <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Contoh: REF123" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Tarikh Bayaran</div>
                    <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Slip Bayaran</div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            uploadProof(f);
                          }}
                        />
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-black border border-white/10 text-sm text-white hover:bg-white/5">
                          <Upload size={16} /> Upload
                        </span>
                      </label>
                      <div className="text-sm text-gray-400 truncate">
                        {proofUploading ? 'Sedang upload...' : proofFileName ? proofFileName : 'Belum ada fail'}
                      </div>
                    </div>
                    {proofUrl && (
                      <div className="text-sm text-gray-400 mt-2">
                        <a href={proofUrl} target="_blank" rel="noreferrer" className="text-gold-500 hover:underline">
                          Lihat slip
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 h-fit space-y-6">
          <h3 className="text-lg font-bold text-white">Ringkasan Pesanan</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subjumlah</span>
              <span>{formatMoneyMYR(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Penghantaran</span>
              <span>Dikira kemudian</span>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-white text-lg">
              <span>Jumlah</span>
              <span>{formatMoneyMYR(totalAmount)}</span>
            </div>
          </div>

          <Button
            className="w-full flex items-center justify-center gap-2 py-6 text-lg"
            onClick={submit}
            disabled={submitting || (method === 'EWALLET' && ewalletDisabled) || (method === 'MANUAL_TRANSFER' && proofUploading)}
          >
            {submitting ? 'Sedang memproses...' : method === 'EWALLET' ? 'Bayar Guna E-Wallet' : 'Hantar Bukti Bayaran'}{' '}
            <ArrowRight size={20} />
          </Button>

          {method === 'EWALLET' && (
            <div className="text-xs text-gray-500">
              Baki yang digunakan adalah daripada Jumlah Deposit Pelaburan (Diluluskan).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
