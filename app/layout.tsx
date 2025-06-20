import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthSessionWatcher } from '@/components/features/auth/AuthSessionWatcher';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { NavigationLayout } from '@/components/features/navigation';
import { ReactQueryProvider } from '@/lib/react-query-client';
import { APP_CONFIG } from '@/lib/constants';
import { Suspense } from 'react';
import { PerformanceMonitor } from '@/components/monitoring/PerformanceMonitor';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ReactQueryProvider>
          <ErrorBoundary>
            <PerformanceMonitor>
              <Suspense>
                <AuthSessionWatcher>
                  <NavigationLayout>{children}</NavigationLayout>
                </AuthSessionWatcher>
              </Suspense>
            </PerformanceMonitor>
          </ErrorBoundary>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
