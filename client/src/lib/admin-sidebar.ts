import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShoppingBag, 
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
    title: 'Pengurusan Pengguna',
    path: '/admin/users',
    icon: Users,
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
