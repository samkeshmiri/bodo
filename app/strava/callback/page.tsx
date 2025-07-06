'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

function StravaCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, user: privyUser } = usePrivy();
  const [status, setStatus] = useState('Connecting to Strava...');

  useEffect(() => {
    async function connectStrava() {
      const code = searchParams.get('code');
      if (!code) {
        setStatus('Missing Strava code.');
        return;
      }
      if (!authenticated || !privyUser?.id) {
        setStatus('You must be logged in to connect Strava.');
        return;
      }
      const redirectUri = `${window.location.origin}/strava/callback`;
      try {
        const res = await fetch('/api/strava/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, privyUserId: privyUser.id, redirectUri })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to connect Strava');
        setStatus('Strava connected! Redirecting...');
        setTimeout(() => router.push('/homepage'), 1500);
      } catch (err: any) {
        setStatus(err.message || 'Failed to connect Strava');
      }
    }
    connectStrava();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, privyUser?.id]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow text-center">
        <div className="text-lg font-medium">{status}</div>
      </div>
    </div>
  );
}

export default function StravaCallbackPage() {
  return (
    <Suspense>
      <StravaCallbackInner />
    </Suspense>
  );
} 