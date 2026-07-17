import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
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
    ],
  },
]);
