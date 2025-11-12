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
import BudgetsOverview from '@/pages/BudgetsOverview';
import BudgetForm from '@/pages/BudgetForm';
import SavingGoalForm from '@/pages/SavingGoalForm';
import ImportCsv from '@/pages/ImportCsv';
import NotFound from '@/pages/NotFound';
import AppErrorBoundary from '@/pages/AppErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { hasValidTokens } from '@/lib/tokens';

function RootRedirect() {
  const isAuthenticated = hasValidTokens();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

const routes: RouteObject[] = [
  {
    path: '/',
    errorElement: <AppErrorBoundary />,
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
            element: <AppLayout />,
            children: [
              {
                path: '/dashboard',
                element: <Dashboard />,
              },
              {
                path: '/transactions',
                element: <Transactions />,
              },
              {
                path: '/transactions/import',
                element: <ImportCsv />,
              },
              {
                path: '/budgets',
                element: <BudgetsOverview />,
              },
              {
                path: '/budgets/new',
                element: <BudgetForm />,
              },
              {
                path: '/budgets/:id/edit',
                element: <BudgetForm />,
              },
              {
                path: '/goals/new',
                element: <SavingGoalForm />,
              },
              {
                path: '/settings',
                element: <div>Settings page coming soon</div>,
              },
            ],
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
