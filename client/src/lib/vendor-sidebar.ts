import { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingBag, PlusCircle, Bell } from 'lucide-react';

export interface VendorSidebarItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const vendorSidebarItems: VendorSidebarItem[] = [
  {
    title: 'Papan Pemuka Vendor',
    path: '/dashboard/vendor',
    icon: LayoutDashboard,
  },
  {
    title: 'Notifikasi',
    path: '/dashboard/vendor/notifications',
    icon: Bell,
  },
  {
    title: 'Produk Dihantar',
    path: '/dashboard/vendor/products',
    icon: ShoppingBag,
  },
  {
    title: 'Hantar Produk',
    path: '/dashboard/vendor/products/new',
    icon: PlusCircle,
  },
];
