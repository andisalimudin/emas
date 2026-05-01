import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShoppingBag,
  Package,
  ClipboardList,
  HandCoins,
  Coins,
  CreditCard,
  BadgePercent,
  ListChecks,
  BookOpen,
  Bell,
} from 'lucide-react';

export interface SidebarItem {
  title: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
}

export const sidebarItems: SidebarItem[] = [
  {
    title: 'Papan Pemuka',
    path: '/admin',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    title: 'Notifikasi',
    path: '/admin/notifications',
    icon: Bell,
    roles: ['ADMIN'],
  },
  {
    title: 'Pengurusan Pengguna',
    path: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Senarai Order',
    path: '/admin/orders',
    icon: Package,
    roles: ['ADMIN'],
  },
  {
    title: 'Semakan Produk Vendor',
    path: '/admin/product-submissions',
    icon: ClipboardList,
    roles: ['ADMIN'],
  },
  {
    title: 'Semakan Pelaburan Partner',
    path: '/admin/investment-submissions',
    icon: HandCoins,
    roles: ['ADMIN'],
  },
  {
    title: 'Semakan Pembayaran',
    path: '/admin/payments',
    icon: CreditCard,
    roles: ['ADMIN'],
  },
  {
    title: 'Harga Emas Kategori',
    path: '/admin/category-gold-prices',
    icon: Coins,
    roles: ['ADMIN'],
  },
  {
    title: 'Offer Pelaburan',
    path: '/admin/investment-offers',
    icon: BadgePercent,
    roles: ['ADMIN'],
  },
  {
    title: 'Semakan Offer Partner',
    path: '/admin/investment-commitments',
    icon: ListChecks,
    roles: ['ADMIN'],
  },
  {
    title: 'Ledger Pelaburan',
    path: '/admin/investment-ledger',
    icon: BookOpen,
    roles: ['ADMIN'],
  },
  {
    title: 'Produk',
    path: '/admin/products',
    icon: ShoppingBag,
    roles: ['ADMIN'],
  },
  {
    title: 'Tetapan',
    path: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
];
