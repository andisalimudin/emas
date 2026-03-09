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
    title: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'AGENT_MANAGER', 'VIEWER'],
  },
  {
    title: 'User Management',
    path: '/admin/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER'],
  },
  {
    title: 'Agent Management',
    path: '/admin/agents',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER'],
  },
  {
    title: 'Products',
    path: '/admin/products',
    icon: ShoppingBag,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    title: 'Transactions',
    path: '/admin/transactions',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'],
  },
  {
    title: 'Finance',
    path: '/admin/finance',
    icon: DollarSign,
    roles: ['SUPER_ADMIN', 'FINANCE'],
  },
  {
    title: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN'],
  },
];
