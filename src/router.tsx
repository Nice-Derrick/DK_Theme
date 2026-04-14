import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import { AuthLayout } from '@/components/auth-layout';
import { useAuth } from '@/features/auth/auth-context';

const ClientsPage = lazy(() => import('@/pages/clients-page').then((module) => ({ default: module.ClientsPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard-page').then((module) => ({ default: module.DashboardPage })));
const InvitePage = lazy(() => import('@/pages/invite-page').then((module) => ({ default: module.InvitePage })));
const KnowledgePage = lazy(() => import('@/pages/knowledge-page').then((module) => ({ default: module.KnowledgePage })));
const LoginPage = lazy(() => import('@/pages/login-page').then((module) => ({ default: module.LoginPage })));
const NodeStatusPage = lazy(() => import('@/pages/node-status-page').then((module) => ({ default: module.NodeStatusPage })));
const OrdersPage = lazy(() => import('@/pages/orders-page').then((module) => ({ default: module.OrdersPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password-page').then((module) => ({ default: module.ForgotPasswordPage })));
const RegisterPage = lazy(() => import('@/pages/register-page').then((module) => ({ default: module.RegisterPage })));
const PlansPage = lazy(() => import('@/pages/plans-page').then((module) => ({ default: module.PlansPage })));
const SettingsPage = lazy(() => import('@/pages/settings-page').then((module) => ({ default: module.SettingsPage })));
const TicketsPage = lazy(() => import('@/pages/tickets-page').then((module) => ({ default: module.TicketsPage })));

function ProtectedLayout() {
  const { token, hydrated } = useAuth();
  if (!hydrated) {
    return <div className='flex min-h-screen items-center justify-center text-sm text-muted-foreground'>正在初始化用户中心…</div>;
  }
  if (!token) {
    return <Navigate to='/login' replace />;
  }
  return <AppShell />;
}

export function AppRouter() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/register' element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/clients' element={<ClientsPage />} />
        <Route path='/plans' element={<PlansPage />} />
        <Route path='/node-status' element={<NodeStatusPage />} />
        <Route path='/orders' element={<OrdersPage />} />
        <Route path='/invite' element={<InvitePage />} />
        <Route path='/tickets' element={<TicketsPage />} />
        <Route path='/knowledge' element={<KnowledgePage />} />
        <Route path='/settings' element={<SettingsPage />} />
      </Route>
      <Route path='*' element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
