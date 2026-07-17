import { createBrowserRouter } from 'react-router-dom';
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
    ],
  },
]);
