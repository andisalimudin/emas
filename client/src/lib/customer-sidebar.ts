import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  FileText, 
  User, 
  LogOut,
  Clock,
  Wallet,
  Bell
} from 'lucide-react';

export interface SidebarItem {
  title: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
}

export const customerSidebarItems: SidebarItem[] = [
  {
    title: 'Papan Pemuka',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Notifikasi',
    path: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Dashboard Vendor',
    path: '/dashboard/vendor',
    icon: ShoppingBag,
    roles: ['VENDOR'],
  },
  {
    title: 'Lihat Produk',
    path: '/dashboard/products',
    icon: ShoppingBag,
  },
  {
    title: 'Troli Saya',
    path: '/dashboard/cart',
    icon: ShoppingCart,
  },
  {
    title: 'E-Wallet',
    path: '/dashboard/wallet',
    icon: Wallet,
  },
  {
    title: 'Pesanan Saya',
    path: '/dashboard/orders',
    icon: FileText,
  },
  {
    title: 'Kunci Harga',
    path: '/dashboard/price-lock',
    icon: Clock,
  },
  {
    title: 'Profil',
    path: '/dashboard/profile',
    icon: User,
  },
];

export interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

export const customerSidebarSections: SidebarSection[] = [
  {
    label: 'Umum',
    items: [
      { title: 'Papan Pemuka', path: '/dashboard', icon: LayoutDashboard },
      { title: 'Notifikasi', path: '/dashboard/notifications', icon: Bell },
    ],
  },
  {
    label: 'Beli',
    items: [
      { title: 'Lihat Produk', path: '/dashboard/products', icon: ShoppingBag },
      { title: 'Troli Saya', path: '/dashboard/cart', icon: ShoppingCart },
      { title: 'Pesanan Saya', path: '/dashboard/orders', icon: FileText },
    ],
  },
  {
    label: 'Kewangan',
    items: [
      { title: 'E-Wallet', path: '/dashboard/wallet', icon: Wallet },
      { title: 'Kunci Harga', path: '/dashboard/price-lock', icon: Clock },
    ],
  },
  {
    label: 'Akaun',
    items: [{ title: 'Profil', path: '/dashboard/profile', icon: User }],
  },
  {
    label: 'Vendor',
    items: [{ title: 'Dashboard Vendor', path: '/dashboard/vendor', icon: ShoppingBag, roles: ['VENDOR'] }],
  },
];
