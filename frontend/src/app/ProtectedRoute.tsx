import { Navigate, Outlet } from 'react-router-dom';
import { hasTokens } from '@/lib/tokens';

/**
 * ProtectedRoute component
 * 
 * Wraps routes that require authentication.
 * If user has valid access/refresh tokens, renders children.
 * Otherwise, redirects to /login.
 * 
 * @example
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 *   <Route path="/transactions" element={<Transactions />} />
 * </Route>
 */
export function ProtectedRoute() {
  const isAuthenticated = hasTokens();

  if (!isAuthenticated) {
    // Redirect to login and replace history entry
    // This prevents users from going back to protected routes
    return <Navigate to="/login" replace />;
  }

  // Render nested routes
  return <Outlet />;
}
