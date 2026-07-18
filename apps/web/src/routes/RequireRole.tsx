import { Navigate, Outlet } from 'react-router-dom';
import { routePaths } from '../app/routePaths';
import { useAuth } from '../features/auth/AuthContext';
import type { Role } from '../features/auth/types';

interface RequireRoleProps {
  allowedRoles: Role[];
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={routePaths.home} replace />;
  }

  return <Outlet />;
}
