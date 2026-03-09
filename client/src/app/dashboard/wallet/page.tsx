'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, CreditCard, ArrowUpRight, History } from 'lucide-react';
import { format } from 'date-fns';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

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
      alert('Top-up successful!');
    } catch (err) {
      console.error('Failed to top up:', err);
      alert('Top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading wallet...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gold-600 to-gold-800 rounded-xl p-8 text-black shadow-lg shadow-gold-900/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium opacity-80 mb-1">Current Balance</p>
              <h2 className="text-4xl font-bold">{wallet?.balance || 0} Tokens</h2>
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
            Top Up Tokens
          </h3>
          <form onSubmit={handleTopUp} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount (Tokens)</label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
              {topUpAmount && (
                <p className="text-xs text-gray-500 mt-2">
                  Cost: RM {(parseInt(topUpAmount) * 2).toFixed(2)}
                </p>
              )}
            </div>
            <Button type="submit" disabled={processing || !topUpAmount} className="w-full">
              {processing ? 'Processing...' : 'Top Up Now'}
            </Button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <History size={20} className="text-gold-500" />
          <h3 className="text-lg font-bold text-white">Transaction History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {wallet?.transactions?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">No transactions yet.</td>
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
