import {
  Navigate,
  RouteObject,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import AuthLogin from '@/pages/AuthLogin';
import AuthRegister from '@/pages/AuthRegister';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';
import { hasTokens } from '@/lib/tokens';

/**
 * Root redirect logic:
 * - If authenticated → /transactions
 * - If not authenticated → /login
 */
function RootRedirect() {
  const isAuthenticated = hasTokens();
  return <Navigate to={isAuthenticated ? '/transactions' : '/login'} replace />;
}

const routes: RouteObject[] = [
  {
    path: '/',
    children: [
      {
        index: true,
        element: <RootRedirect />,
      },
      // Protected routes (require authentication)
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          {
            path: '/transactions',
            element: <Transactions />,
          },
        ],
      },
      // Public routes (auth pages)
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <AuthLogin />,
          },
          {
            path: '/register',
            element: <AuthRegister />,
          },
        ],
      },
      // 404 fallback
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export { router as appRouter };
