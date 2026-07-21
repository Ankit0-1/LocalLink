import { Outlet } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { StorefrontShell } from '../../components/layout/StorefrontShell';
import { CartIcon, HomeIcon, OrdersIcon, UserIcon } from '../../components/ui/icons';
import type { NavItem } from '../../components/layout/navTypes';
import { CartProvider, useCart } from './CartContext';

const navItems: NavItem[] = [
  { label: 'Home', to: routePaths.customer.home, icon: HomeIcon, end: true },
  { label: 'Orders', to: routePaths.customer.orders, icon: OrdersIcon },
  { label: 'Cart', to: routePaths.customer.cart, icon: CartIcon },
  { label: 'Profile', to: routePaths.customer.profile, icon: UserIcon },
];

function CustomerShellContent() {
  const { itemCount } = useCart();

  return (
    <StorefrontShell navItems={navItems} badges={{ [routePaths.customer.cart]: itemCount }}>
      <Outlet />
    </StorefrontShell>
  );
}

export function CustomerLayout() {
  return (
    <CartProvider>
      <CustomerShellContent />
    </CartProvider>
  );
}
