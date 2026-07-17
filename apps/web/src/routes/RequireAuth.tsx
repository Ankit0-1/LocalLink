import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { routePaths } from '../app/routePaths';
import { useAuth } from '../features/auth/AuthContext';
import { RouteLoadingFallback } from './RouteLoadingFallback';

export function RequireAuth() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <RouteLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to={routePaths.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
