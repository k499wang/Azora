import { useEffect, useState, type ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionBootstrap } from '../../hooks/useSubscriptionBootstrap';
import { useNotificationBootstrap } from '../../hooks/useNotificationBootstrap';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const initialize = useAuthStore((state) => state.initialize);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
      <QueryClientProvider client={queryClient}>
        <SubscriptionBootstrap />
        <NotificationBootstrap />
        {children}
      </QueryClientProvider>
  );
}

function SubscriptionBootstrap() {
  useSubscriptionBootstrap();
  return null;
}

function NotificationBootstrap() {
  useNotificationBootstrap();
  return null;
}
