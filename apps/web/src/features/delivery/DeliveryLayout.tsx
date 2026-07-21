import { Outlet } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { DashboardShell } from '../../components/layout/DashboardShell';
import type { NavItem } from '../../components/layout/navTypes';
import { DashboardIcon, HistoryIcon, PackageIcon, TruckIcon, UserIcon } from '../../components/ui/icons';

const navItems: NavItem[] = [
  { label: 'Dashboard', to: routePaths.delivery.dashboard, icon: DashboardIcon, end: true },
  { label: 'Available Deliveries', to: routePaths.delivery.available, icon: PackageIcon },
  { label: 'Active Delivery', to: routePaths.delivery.active, icon: TruckIcon },
  { label: 'History', to: routePaths.delivery.history, icon: HistoryIcon },
  { label: 'Profile', to: routePaths.delivery.profile, icon: UserIcon },
];

export function DeliveryLayout() {
  return (
    <DashboardShell roleLabel="Delivery partner" navItems={navItems}>
      <Outlet />
    </DashboardShell>
  );
}
