'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL, fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Landmark, Upload } from 'lucide-react';

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const orderId = params?.id;
  const [order, setOrder] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [method, setMethod] = useState<'EWALLET' | 'MANUAL_TRANSFER'>('EWALLET');
  const [bankName, setBankName] = useState('');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [proofUrl, setProofUrl] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofFileName, setProofFileName] = useState('');

  useEffect(() => {
    load();
  }, [orderId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const [o, w] = await Promise.all([
        fetchAPI(`/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetchAPI('/wallet', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setOrder(o);
      setWallet(w);
      setMethod(String(o?.payment?.method || o?.paymentMethod || '').toUpperCase() === 'MANUAL_TRANSFER' ? 'MANUAL_TRANSFER' : 'EWALLET');
      setBankName(String(o?.payment?.bankName || ''));
      setReference(String(o?.payment?.reference || ''));
      setProofUrl(String(o?.payment?.proofUrl || o?.proofUrl || ''));
      setProofFileName('');
    } catch (e: any) {
      setError(e?.message || 'Gagal memuatkan pesanan');
    } finally {
      setLoading(false);
    }
  };

  const requiredTokens = useMemo(() => {
    const rate = 2;
    return Math.ceil(Number(order?.totalAmount || 0) / rate);
  }, [order?.totalAmount]);

  const isPaid = String(order?.status || '').toUpperCase() === 'PAID' || String(order?.payment?.status || '').toUpperCase() === 'APPROVED';

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

  const pay = async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      if (method === 'EWALLET') {
        await fetchAPI(`/orders/${orderId}/pay/ewallet`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        setSuccess('Pembayaran e-wallet berjaya.');
      } else {
        if (!proofUrl) throw new Error('Sila upload slip bayaran');
        await fetchAPI(`/orders/${orderId}/pay/transfer`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bankName, reference, proofUrl, paymentDate }),
        });
        setSuccess('Bukti pembayaran dihantar untuk semakan admin.');
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal proses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Sedang memuatkan pesanan...</div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Pesanan tidak dijumpai.</div>;

  const walletBalance = Number(wallet?.balance || 0);
  const ewalletDisabled = walletBalance < requiredTokens;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders">
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} /> Kembali
            </Button>
          </Link>
          <div>
            <div className="text-white text-xl font-bold">Pesanan #{String(order.id).slice(0, 8).toUpperCase()}</div>
            <div className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString('ms-MY')}</div>
          </div>
        </div>
        <div className="text-gold-500 font-mono text-lg">{formatMoneyMYR(order.totalAmount)}</div>
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
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-3">
            <div className="text-lg font-bold text-white">Item</div>
            <div className="space-y-2">
              {(order.items || []).map((it: any) => (
                <div key={it.id} className="flex justify-between gap-4 text-sm">
                  <div className="text-gray-200">
                    {it.product?.name} <span className="text-gray-500">x{it.quantity}</span>
                  </div>
                  <div className="text-gray-300 font-mono">{formatMoneyMYR(Number(it.priceAtOrder || 0) * Number(it.quantity || 0))}</div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between text-white font-semibold">
              <span>Jumlah</span>
              <span className="font-mono">{formatMoneyMYR(order.totalAmount)}</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
            <div className="text-lg font-bold text-white">Pembayaran</div>
            {isPaid ? (
              <div className="text-green-300">Pembayaran telah disahkan.</div>
            ) : (
              <>
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
                      E-Wallet (Token)
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                      Baki: <span className="text-white">{walletBalance} Token</span> • Diperlukan:{' '}
                      <span className="text-white">{requiredTokens} Token</span>
                    </div>
                    {ewalletDisabled && <div className="text-sm text-red-300 mt-2">Baki token tidak mencukupi.</div>}
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

                <Button
                  className="w-full py-6 text-lg"
                  onClick={pay}
                  disabled={processing || (method === 'EWALLET' && ewalletDisabled) || proofUploading}
                >
                  {processing ? 'Sedang memproses...' : method === 'EWALLET' ? 'Bayar Guna E-Wallet' : 'Hantar Bukti Bayaran'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 h-fit space-y-4">
          <div className="text-lg font-bold text-white">Status</div>
          <div className="text-sm text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-400">Pesanan</span>
              <span>{String(order.status || '').toUpperCase()}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-gray-400">Pembayaran</span>
              <span>{String(order.payment?.status || '—').toUpperCase()}</span>
            </div>
            {order.payment?.proofUrl && (
              <div className="mt-3">
                <a href={order.payment.proofUrl} target="_blank" rel="noreferrer" className="text-gold-500 hover:underline text-sm">
                  Lihat Slip
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

