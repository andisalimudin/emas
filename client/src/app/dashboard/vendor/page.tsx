'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white">Papan Pemuka Vendor</h1>
        <p className="text-gray-400 mt-2">Hantar produk untuk semakan dan kelulusan Admin sebelum dipaparkan dalam sistem.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/vendor/products/new">
            <Button>Hantar Produk</Button>
          </Link>
          <Link href="/dashboard/vendor/products">
            <Button variant="outline">Lihat Status</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

