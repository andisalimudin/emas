'use client';

import { 
  ShoppingBag, 
  ShoppingCart, 
  Clock, 
  CreditCard, 
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle
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

const spendingData = [
  { name: 'Jan', amount: 0 },
  { name: 'Feb', amount: 0 },
  { name: 'Mar', amount: 450 },
  { name: 'Apr', amount: 1200 },
  { name: 'May', amount: 800 },
  { name: 'Jun', amount: 1500 },
];

const orderStatusData = [
  { name: 'Completed', value: 5, color: '#10b981' }, // green
  { name: 'Pending', value: 2, color: '#f59e0b' },   // yellow
  { name: 'Cancelled', value: 1, color: '#ef4444' }, // red
];

export default function UserDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Spending" 
          value="RM 3,950.00" 
          icon={CreditCard}
          trend="+12%"
          isPositive={true}
        />
        <StatCard 
          title="Total Orders" 
          value="8" 
          icon={ShoppingBag}
        />
        <StatCard 
          title="Pending Orders" 
          value="2" 
          icon={Clock}
          isWarning={true}
        />
        <StatCard 
          title="Gold Holdings" 
          value="15.5g" 
          icon={Package}
          trend="+5g"
          isPositive={true}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickAction 
          title="Buy Gold" 
          description="Browse our latest collection" 
          icon={TrendingUp} 
          href="/dashboard/products"
          color="bg-gold-500 text-black hover:bg-gold-400"
        />
        <QuickAction 
          title="My Orders" 
          description="Track your shipments" 
          icon={Package} 
          href="/dashboard/orders"
          color="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
        />
        <QuickAction 
          title="Update Profile" 
          description="Manage account details" 
          icon={CheckCircle} 
          href="/dashboard/profile"
          color="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Spending Overview</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData}>
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

        {/* Order Status Chart */}
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Order Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
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

      {/* Recent Orders Table (Simplified) */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
          <Link href="/dashboard/orders" className="text-sm text-gold-500 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono">#ORD-2024-{1000+i}</td>
                  <td className="px-6 py-4">Mar {10+i}, 2024</td>
                  <td className="px-6 py-4 text-white font-medium">RM {(i*500 + 250).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 text-xs">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
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
          {trend} from last month
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
