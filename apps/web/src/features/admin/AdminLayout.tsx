import { Outlet } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { DashboardShell } from '../../components/layout/DashboardShell';
import type { NavItem } from '../../components/layout/navTypes';
import { DashboardIcon, OrdersIcon, StoreIcon, TruckIcon, UserIcon } from '../../components/ui/icons';
import { AdminDataProvider } from './AdminDataContext';

const navItems: NavItem[] = [
  { label: 'Dashboard', to: routePaths.admin.dashboard, icon: DashboardIcon, end: true },
  { label: 'Users', to: routePaths.admin.users, icon: UserIcon },
  { label: 'Stores', to: routePaths.admin.stores, icon: StoreIcon },
  { label: 'Orders', to: routePaths.admin.orders, icon: OrdersIcon },
  { label: 'Delivery Partners', to: routePaths.admin.deliveryPartners, icon: TruckIcon },
];

export function AdminLayout() {
  return (
    <AdminDataProvider>
      <DashboardShell roleLabel="Admin" navItems={navItems}>
        <Outlet />
      </DashboardShell>
    </AdminDataProvider>
  );
}
