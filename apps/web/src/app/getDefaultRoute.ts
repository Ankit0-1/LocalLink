import type { Role } from '../features/auth/types';
import { routePaths } from './routePaths';

export function getDefaultRoute(role: Role): string {
  switch (role) {
    case 'VENDOR':
      return routePaths.vendorDashboard;
    case 'CUSTOMER':
      return routePaths.customerDashboard;
    case 'DELIVERY_PARTNER':
      return routePaths.deliveryDashboard;
    case 'ADMIN':
      return routePaths.adminDashboard;
    default:
      return routePaths.home;
  }
}
