'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import clsx from 'clsx';
import { fetchAPI } from '@/lib/api';

function formatPct(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
}

function initialsFromName(name: string) {
  const parts = (name || '')
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean);
  const a = parts[0]?.[0] || 'U';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase();
}

function timeAgo(dateValue: any) {
  const d = new Date(dateValue);
  const ms = Date.now() - d.getTime();
  if (!Number.isFinite(ms)) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'baru sahaja';
  if (mins < 60) return `${mins} minit yang lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchAPI('/admin/dashboard/summary', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setSummary(data);
      } catch (err: any) {
        console.error(err);
        setError('Gagal memuatkan ringkasan dashboard');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const chartData = useMemo(() => {
    const items = Array.isArray(summary?.chart) ? summary.chart : [];
    return items.map((it: any) => {
      const month = String(it.month || '');
      const [y, m] = month.split('-');
      const label = y && m ? new Date(Number(y), Number(m) - 1, 1).toLocaleString('ms-MY', { month: 'short' }) : month;
      return { name: label, amount: Number(it.amount || 0) };
    });
  }, [summary]);

  const stats = summary?.stats || {};
  const totalUsers = Number(stats?.totalUsers?.value || 0);
  const totalRevenue = Number(stats?.totalRevenue?.value || 0);
  const totalOrders = Number(stats?.totalOrders?.value || 0);
  const activeAgents = Number(stats?.activeAgents?.value || 0);

  const usersChange = Number(stats?.totalUsers?.changePct || 0);
  const revenueChange = Number(stats?.totalRevenue?.changePct || 0);
  const ordersChange = Number(stats?.totalOrders?.changePct || 0);
  const agentsChange = Number(stats?.activeAgents?.changePct || 0);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-red-400">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Jumlah Pengguna" 
          value={loading ? '...' : totalUsers.toLocaleString('ms-MY')} 
          change={loading ? '' : formatPct(usersChange)} 
          isPositive={usersChange >= 0} 
          icon={Users} 
        />
        <StatCard 
          title="Jumlah Hasil" 
          value={loading ? '...' : `RM ${totalRevenue.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          change={loading ? '' : formatPct(revenueChange)} 
          isPositive={revenueChange >= 0} 
          icon={DollarSign} 
        />
        <StatCard 
          title="Jumlah Pesanan" 
          value={loading ? '...' : totalOrders.toLocaleString('ms-MY')} 
          change={loading ? '' : formatPct(ordersChange)} 
          isPositive={ordersChange >= 0} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="Ejen Aktif" 
          value={loading ? '...' : activeAgents.toLocaleString('ms-MY')} 
          change={loading ? '' : formatPct(agentsChange)} 
          isPositive={agentsChange >= 0} 
          icon={Activity} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Gambaran Keseluruhan Jualan</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="amount" stroke="#D4AF37" fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Aktiviti Terkini</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-gray-500">Sedang memuatkan...</div>
            ) : Array.isArray(summary?.recentActivity) && summary.recentActivity.length > 0 ? (
              summary.recentActivity.map((it: any) => (
                <div key={it.id} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 text-xs font-bold">
                    {initialsFromName(it.userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{it.title}</p>
                    <p className="text-xs text-gray-400">{timeAgo(it.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">Tiada aktiviti terkini.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon: Icon }: any) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg text-gold-500">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl font-bold text-white">{value}</h2>
        {change ? (
          <span className={clsx("flex items-center text-xs font-medium", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
        ) : null}
      </div>
    </div>
  );
}
