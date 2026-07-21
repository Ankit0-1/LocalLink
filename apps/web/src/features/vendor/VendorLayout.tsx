import { Outlet } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { DashboardShell } from '../../components/layout/DashboardShell';
import type { NavItem } from '../../components/layout/navTypes';
import { ChartIcon, DashboardIcon, OrdersIcon, SettingsIcon, StoreIcon } from '../../components/ui/icons';

const navItems: NavItem[] = [
  { label: 'Dashboard', to: routePaths.vendor.dashboard, icon: DashboardIcon, end: true },
  { label: 'My Store', to: routePaths.vendor.stores, icon: StoreIcon },
  { label: 'Orders', to: routePaths.vendor.orders, icon: OrdersIcon },
  { label: 'Analytics', to: routePaths.vendor.analytics, icon: ChartIcon },
  { label: 'Settings', to: routePaths.vendor.settings, icon: SettingsIcon },
];

export function VendorLayout() {
  return (
    <DashboardShell roleLabel="Vendor" navItems={navItems}>
      <Outlet />
    </DashboardShell>
  );
}
