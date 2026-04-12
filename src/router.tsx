import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import { AuthLayout } from '@/components/auth-layout';
import { useAuth } from '@/features/auth/auth-context';
import { ClientsPage } from '@/pages/clients-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { InvitePage } from '@/pages/invite-page';
import { KnowledgePage } from '@/pages/knowledge-page';
import { LoginPage } from '@/pages/login-page';
import { NodeStatusPage } from '@/pages/node-status-page';
import { OrdersPage } from '@/pages/orders-page';
import { ForgotPasswordPage } from '@/pages/forgot-password-page';
import { RegisterPage } from '@/pages/register-page';
import { PlansPage } from '@/pages/plans-page';
import { SettingsPage } from '@/pages/settings-page';
import { TicketsPage } from '@/pages/tickets-page';

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
