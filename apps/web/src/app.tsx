import { ThemeProvider } from '@kairo/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGuard } from './features/auth/auth-guard';
import { LoginPage } from './features/auth/login-page';
import { RegisterPage } from './features/auth/register-page';
import { DashboardPage } from './features/dashboard/dashboard-page';

// Code-split non-critical routes so the initial bundle stays small.
const AdminPage = lazy(() =>
  import('./features/admin/admin-page').then((m) => ({ default: m.AdminPage })),
);
const SettingsPage = lazy(() =>
  import('./features/settings/settings-page').then((m) => ({ default: m.SettingsPage })),
);
const WeekFullscreenPage = lazy(() =>
  import('./features/calendar/week-fullscreen-page').then((m) => ({
    default: m.WeekFullscreenPage,
  })),
);

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Keep results fresh for 30s by default so route transitions don't
      // trigger a network round-trip for data that's already in the cache.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-fg-muted text-sm">加载中…</div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<AuthGuard />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/week" element={<WeekFullscreenPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
