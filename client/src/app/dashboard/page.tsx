'use client';

import { 
  ArrowDownRight,
  ArrowUpRight,
  ShoppingBag, 
  Clock, 
  CreditCard, 
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  Wallet as WalletIcon,
  Gem,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/lib/api';

function formatMoneyMYR(amount: any) {
  const n = Number(amount || 0);
  return `RM ${n.toFixed(2)}`;
}

function formatGrams(amount: any) {
  const n = Number(amount || 0);
  return `${n.toFixed(2)}g`;
}

function formatDateMY(input: any) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const data = await fetchAPI('/wallet', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setWallet(data);
      } catch (err) {
        setWallet(null);
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const walletActivityData = useMemo(() => {
    const tx = Array.isArray(wallet?.transactions) ? wallet.transactions : [];
    const sorted = [...tx].reverse();
    return sorted.map((t: any) => ({
      name: formatDateMY(t?.createdAt),
      amount: Number(t?.amount || 0),
    }));
  }, [wallet?.transactions]);

  const walletTypeData = useMemo(() => {
    const tx = Array.isArray(wallet?.transactions) ? wallet.transactions : [];
    const counts = tx.reduce((acc: Record<string, number>, t: any) => {
      const k = String(t?.type || 'LAIN').toUpperCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#10b981', '#f59e0b', '#ef4444', '#D4AF37', '#3b82f6'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length],
    }));
  }, [wallet?.transactions]);

  const isPartner = user?.role === 'PARTNER';
  const hasWallet = !!wallet;

  return (
    <div className="space-y-8">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={isPartner ? "Jumlah Deposit Pelaburan (Diluluskan)" : "Baki Dompet (Token)"}
          value={
            loading
              ? '...'
              : isPartner
                ? formatMoneyMYR(wallet?.investmentTotal)
                : String(wallet?.balance ?? 0)
          }
          icon={isPartner ? CreditCard : WalletIcon}
        />
        <StatCard
          title={isPartner ? "Baki Deposit Pelaburan" : "Transaksi Dompet"}
          value={
            loading
              ? '...'
              : isPartner
                ? formatMoneyMYR(wallet?.investmentBalance)
                : String((wallet?.transactions || []).length)
          }
          icon={Clock}
          isWarning={isPartner}
        />
        <StatCard
          title={isPartner ? "Jumlah Pelaburan (Diluluskan)" : "Pegangan Emas"}
          value={loading ? '...' : isPartner ? formatGrams(wallet?.investmentGramsTotal) : '-'}
          icon={Gem}
        />
        <StatCard
          title="Status Akaun"
          value={user?.status ? String(user.status) : 'ACTIVE'}
          icon={CheckCircle}
          isPositive={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction 
          title="Beli Emas" 
          description="Lihat koleksi terkini kami" 
          icon={TrendingUp} 
          href="/dashboard/products"
          color="bg-gold-500 text-black hover:bg-gold-400"
        />
        <QuickAction 
          title={isPartner ? "E-Wallet" : "Pesanan Saya"}
          description={isPartner ? "Urus deposit & pelaburan anda" : "Jejak penghantaran anda"}
          icon={Package} 
          href={isPartner ? "/dashboard/wallet" : "/dashboard/orders"}
          color="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
        />
        <QuickAction 
          title="Kemaskini Profil" 
          description="Urus butiran akaun" 
          icon={CheckCircle} 
          href="/dashboard/profile"
          color="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Activity Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">
            {isPartner ? 'Aktiviti Dompet (Token)' : 'Aktiviti Dompet (Token)'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {hasWallet ? 'Berdasarkan transaksi dompet terkini.' : 'Tiada data untuk dipaparkan.'}
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={walletActivityData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#D4AF37" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wallet Type Chart */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Jenis Transaksi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={walletTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {walletTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Wallet Transactions */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Transaksi Terkini</h3>
          <Link href="/dashboard/wallet" className="text-sm text-gold-500 hover:underline">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Tarikh</th>
                <th className="px-6 py-4">Amaun</th>
                <th className="px-6 py-4">Jenis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td className="px-6 py-6" colSpan={4}>
                    Memuatkan...
                  </td>
                </tr>
              ) : (wallet?.transactions || []).length === 0 ? (
                <tr>
                  <td className="px-6 py-6" colSpan={4}>
                    Tiada transaksi buat masa ini.
                  </td>
                </tr>
              ) : (
                (wallet?.transactions || []).map((t: any) => {
                  const amount = Number(t?.amount || 0);
                  const isCredit = amount > 0;
                  const badge = isCredit ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20';
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono">{String(t.id).slice(0, 8)}</td>
                      <td className="px-6 py-4">{formatDateMY(t.createdAt)}</td>
                      <td className="px-6 py-4 text-white font-medium">
                        <span className={clsx("px-2 py-1 rounded-md border text-xs", badge)}>
                          {isCredit ? <ArrowUpRight size={14} className="inline-block mr-1" /> : <ArrowDownRight size={14} className="inline-block mr-1" />}
                          {amount}
                        </span>
                      </td>
                      <td className="px-6 py-4">{String(t.type || '-')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, isPositive, isWarning }: any) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-gold-500/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={clsx(
          "p-3 rounded-lg",
          isWarning ? "bg-yellow-500/10 text-yellow-500" : "bg-gold-500/10 text-gold-500"
        )}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className={clsx(
          "text-xs font-medium flex items-center gap-1",
          isPositive ? "text-green-500" : "text-red-500"
        )}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
          {trend} dari bulan lepas
        </div>
      )}
    </div>
  );
}

function QuickAction({ title, description, icon: Icon, href, color }: any) {
  return (
    <Link 
      href={href}
      className={clsx(
        "flex items-center gap-4 p-6 rounded-xl transition-all duration-300 group",
        color
      )}
    >
      <div className="bg-white/20 p-3 rounded-full">
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </Link>
  );
}
