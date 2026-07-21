import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../features/admin/AdminLayout';
import { DashboardPage as AdminDashboardPage } from '../features/admin/pages/DashboardPage';
import { DeliveryPartnersPage } from '../features/admin/pages/DeliveryPartnersPage';
import { OrdersPage as AdminOrdersPage } from '../features/admin/pages/OrdersPage';
import { StoresPage as AdminStoresPage } from '../features/admin/pages/StoresPage';
import { UsersPage } from '../features/admin/pages/UsersPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { CustomerLayout } from '../features/customer/CustomerLayout';
import { CartPage } from '../features/customer/pages/CartPage';
import { HomePage as CustomerHomePage } from '../features/customer/pages/HomePage';
import { OrdersPage as CustomerOrdersPage } from '../features/customer/pages/OrdersPage';
import { ProfilePage as CustomerProfilePage } from '../features/customer/pages/ProfilePage';
import { StorePage } from '../features/customer/pages/StorePage';
import { DeliveryLayout } from '../features/delivery/DeliveryLayout';
import { ActivePage } from '../features/delivery/pages/ActivePage';
import { AvailablePage } from '../features/delivery/pages/AvailablePage';
import { DashboardPage as DeliveryDashboardPage } from '../features/delivery/pages/DashboardPage';
import { HistoryPage } from '../features/delivery/pages/HistoryPage';
import { ProfilePage as DeliveryProfilePage } from '../features/delivery/pages/ProfilePage';
import { LandingPage } from '../features/landing/LandingPage';
import { VendorLayout } from '../features/vendor/VendorLayout';
import { AnalyticsPage } from '../features/vendor/pages/AnalyticsPage';
import { DashboardPage as VendorDashboardPage } from '../features/vendor/pages/DashboardPage';
import { OrdersPage as VendorOrdersPage } from '../features/vendor/pages/OrdersPage';
import { SettingsPage as VendorSettingsPage } from '../features/vendor/pages/SettingsPage';
import { StoreDetailPage } from '../features/vendor/pages/StoreDetailPage';
import { StoresPage as VendorStoresPage } from '../features/vendor/pages/StoresPage';
import { RequireAuth } from '../routes/RequireAuth';
import { RequireRole } from '../routes/RequireRole';
import { RootLayout } from './RootLayout';
import { routePaths } from './routePaths';

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['CUSTOMER']} />,
        children: [
          {
            path: 'customer',
            element: <CustomerLayout />,
            children: [
              { index: true, element: <CustomerHomePage /> },
              { path: 'stores/:storeId', element: <StorePage /> },
              { path: 'cart', element: <CartPage /> },
              { path: 'orders', element: <CustomerOrdersPage /> },
              { path: 'profile', element: <CustomerProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole allowedRoles={['VENDOR']} />,
        children: [
          {
            path: 'vendor',
            element: <VendorLayout />,
            children: [
              { index: true, element: <VendorDashboardPage /> },
              { path: 'stores', element: <VendorStoresPage /> },
              { path: 'stores/:storeId', element: <StoreDetailPage /> },
              { path: 'orders', element: <VendorOrdersPage /> },
              { path: 'analytics', element: <AnalyticsPage /> },
              { path: 'settings', element: <VendorSettingsPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole allowedRoles={['DELIVERY_PARTNER']} />,
        children: [
          {
            path: 'delivery',
            element: <DeliveryLayout />,
            children: [
              { index: true, element: <DeliveryDashboardPage /> },
              { path: 'available', element: <AvailablePage /> },
              { path: 'active', element: <ActivePage /> },
              { path: 'history', element: <HistoryPage /> },
              { path: 'profile', element: <DeliveryProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole allowedRoles={['ADMIN']} />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'stores', element: <AdminStoresPage /> },
              { path: 'orders', element: <AdminOrdersPage /> },
              { path: 'delivery-partners', element: <DeliveryPartnersPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
