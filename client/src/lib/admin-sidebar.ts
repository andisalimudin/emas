import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  FileText, 
  ShieldCheck, 
  DollarSign 
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
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'AGENT_MANAGER', 'VIEWER'],
  },
  {
    title: 'Pengurusan Pengguna',
    path: '/admin/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER'],
  },
  {
    title: 'Pengurusan Ejen',
    path: '/admin/agents',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER'],
  },
  {
    title: 'Produk',
    path: '/admin/products',
    icon: ShoppingBag,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Transaksi',
    path: '/admin/transactions',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],
  },
  {
    title: 'Kewangan',
    path: '/admin/finance',
    icon: DollarSign,
    roles: ['SUPER_ADMIN', 'FINANCE'],
  },
  {
    title: 'Tetapan',
    path: '/admin/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN'],
  },
];
