'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchAPI } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatMoneyMYR(value: any) {
  const n = Number(value || 0);
  return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getBadgeClass(value: string) {
  const s = (value || '').toUpperCase();
  if (s === 'PAID' || s === 'DELIVERED') return 'bg-green-500/10 text-green-500 border-green-500/20';
  if (s === 'PAYMENT_REJECTED' || s === 'CANCELLED') return 'bg-red-500/10 text-red-500 border-red-500/20';
  if (s === 'SHIPPED' || s === 'PAYMENT_SUBMITTED') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
}

export default function AdminOrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editShippingStatus, setEditShippingStatus] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');

  useEffect(() => {
    load();
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      const data = await fetchAPI(`/orders?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || 'Gagal memuatkan order');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (order: any) => {
    setOrderToEdit(order);
    setEditStatus(String(order?.status || ''));
    setEditShippingStatus(String(order?.shippingStatus || 'PENDING'));
    setEditTrackingNumber(String(order?.trackingNumber || ''));
  };

  const saveEdit = async () => {
    if (!orderToEdit?.id) return;
    setActionLoadingId(orderToEdit.id);
    setError(null);
    try {
      await fetchAPI(`/orders/${orderToEdit.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          status: editStatus,
          shippingStatus: editShippingStatus,
          trackingNumber: editTrackingNumber,
        }),
      });
      setOrderToEdit(null);
      load();
    } catch (e: any) {
      setError(e?.message || 'Gagal kemas kini order');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Senarai Order</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
          >
            <option value="">Semua Status</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="PAYMENT_SUBMITTED">PAYMENT_SUBMITTED</option>
            <option value="PAYMENT_REJECTED">PAYMENT_REJECTED</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <Button variant="outline" onClick={load}>
            Muat Semula
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-200">{error}</div>}

      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Pembeli</th>
              <th className="px-6 py-4">Order</th>
              <th className="px-6 py-4">Jumlah</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Penghantaran</th>
              <th className="px-6 py-4">Tracking</th>
              <th className="px-6 py-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  Memuatkan...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  Tiada order.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{it.user?.name || '-'}</p>
                      <p className="text-xs">{it.user?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">#{String(it.id || '').slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs">{new Date(it.createdAt).toLocaleString('ms-MY')}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{formatMoneyMYR(it.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getBadgeClass(it.status)}`}>{it.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getBadgeClass(it.shippingStatus || 'PENDING')}`}>
                      {it.shippingStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{it.trackingNumber || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => openEdit(it)} disabled={actionLoadingId === it.id}>
                      {actionLoadingId === it.id ? 'Memproses...' : 'Edit Status'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!orderToEdit} onOpenChange={(open) => !open && setOrderToEdit(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Kemaskini Order</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Anda boleh kemas kini status penghantaran dan tracking untuk order ini.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white mb-2">Alamat Penghantaran</div>
              {orderToEdit?.shippingAddress ? (
                <div className="text-sm text-gray-300 space-y-1">
                  <div className="text-white font-medium">{orderToEdit.shippingAddress.recipient || '-'}</div>
                  <div>{orderToEdit.shippingAddress.phone || '-'}</div>
                  <div>{orderToEdit.shippingAddress.street || '-'}</div>
                  <div>
                    {[orderToEdit.shippingAddress.zipCode, orderToEdit.shippingAddress.city, orderToEdit.shippingAddress.state]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </div>
                  <div>{orderToEdit.shippingAddress.country || 'Malaysia'}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Tiada alamat penghantaran.</div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Status Order</div>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                  <option value="PAYMENT_SUBMITTED">PAYMENT_SUBMITTED</option>
                  <option value="PAYMENT_REJECTED">PAYMENT_REJECTED</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-2">Status Penghantaran</div>
                <select
                  value={editShippingStatus}
                  onChange={(e) => setEditShippingStatus(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Tracking Number</div>
              <Input
                value={editTrackingNumber}
                onChange={(e) => setEditTrackingNumber(e.target.value)}
                placeholder="Contoh: MY123456789"
              />
              <div className="text-xs text-gray-500 mt-2">Kosongkan untuk buang tracking number.</div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                saveEdit();
              }}
              className="bg-gold-600 hover:bg-gold-700 text-black border-none"
            >
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
