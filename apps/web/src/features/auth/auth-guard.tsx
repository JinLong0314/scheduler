import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../shared/lib/auth-store';

export function AuthGuard() {
  const token = useAuthStore((s) => s.token);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const valid = token && expiresAt && new Date(expiresAt).getTime() > Date.now();
  if (!valid) return <Navigate to="/login" replace />;
  return <Outlet />;
}
