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
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Browse Products',
    path: '/dashboard/products',
    icon: ShoppingBag,
  },
  {
    title: 'My Cart',
    path: '/dashboard/cart',
    icon: ShoppingCart,
  },
  {
    title: 'My Wallet',
    path: '/dashboard/wallet',
    icon: Wallet,
  },
  {
    title: 'My Orders',
    path: '/dashboard/orders',
    icon: FileText,
  },
  {
    title: 'Price Lock',
    path: '/dashboard/price-lock',
    icon: Clock,
  },
  {
    title: 'Profile',
    path: '/dashboard/profile',
    icon: User,
  },
];
