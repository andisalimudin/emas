import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  FileText, 
  User, 
  LogOut,
  Clock,
  Wallet
} from 'lucide-react';

export interface SidebarItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const customerSidebarItems: SidebarItem[] = [
  {
    title: 'Papan Pemuka',
    path: '/dashboard',
    icon: LayoutDashboard,
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
    title: 'Dompet Saya',
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
