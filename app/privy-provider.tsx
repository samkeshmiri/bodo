'use client';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  // If no app ID is provided, render children without Privy provider
  if (!appId || appId === 'dummy') {
    return <>{children}</>;
  }

  return (
    <PrivyProvider appId={appId}>
      {children}
    </PrivyProvider>
  );
} 