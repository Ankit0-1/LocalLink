import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { CustomerDashboard } from '../features/customer/CustomerDashboard';
import { VendorDashboard } from '../features/vendor/VendorDashboard';
import { RequireAuth } from '../routes/RequireAuth';
import { RequireRole } from '../routes/RequireRole';
import { RootLayout } from './RootLayout';
import { routePaths } from './routePaths';

export const router = createBrowserRouter([
  {
    path: routePaths.home,
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <p>Marketplace application setup is complete.</p>,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireRole allowedRoles={['CUSTOMER']} />,
            children: [{ path: 'customer', element: <CustomerDashboard /> }],
          },
          {
            element: <RequireRole allowedRoles={['VENDOR']} />,
            children: [{ path: 'vendor', element: <VendorDashboard /> }],
          },
        ],
      },
    ],
  },
]);
