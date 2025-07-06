'use client'

import { useState, useEffect } from 'react';
import { usePrivy, useLogin, useLoginWithEmail } from '@privy-io/react-auth';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  privyUserId: string;
  stravaId?: string;
  status: string;
  createdAt: string;
}

export default function LoginPage() {
  // Check if Privy is available (not during build)
  const isPrivyAvailable = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.NEXT_PUBLIC_PRIVY_APP_ID !== 'dummy';
  
  const { ready, authenticated, logout, user: privyUser } = usePrivy();
  const { login } = useLogin();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'email' | 'otp' | 'loggedIn'>('email');
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If Privy is not available, show a message
  if (!isPrivyAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">Bodo - Fitness Fundraising</h1>
          <p className="text-gray-600 text-center">
            Privy authentication is not configured. Please set up your environment variables.
          </p>
        </div>
      </div>
    );
  }

  // On Privy login, create or fetch backend user
  useEffect(() => {
    async function syncUser() {
      if (authenticated && privyUser?.id) {
        setLoading(true);
        setAuthError('');
        try {
          const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ privyUserId: privyUser.id, status: 'active' })
          });
          const data = await res.json();
          if (!res.ok && data.userId) {
            // User already exists, fetch user
            const userRes = await fetch(`/api/user/${data.userId}`);
            const userData = await userRes.json();
            setUser(userData.user as User);
          } else if (data.user) {
            setUser(data.user as User);
          } else {
            throw new Error(data.error || 'Failed to create/fetch user');
          }
        } catch (err) {
          setAuthError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
      }
    }
    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, privyUser?.id]);

  // Redirect to homepage when user is authenticated (regardless of Strava connection)
  useEffect(() => {
    if (user && authenticated) {
      router.push('/homepage');
    }
  }, [user, authenticated, router]);

  // Handle login flow
  const handleSendCode = async () => {
    setAuthError("");
    try {
      await sendCode({ email });
      setStep('otp');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send code');
    }
  };

  const handleLoginWithCode = async () => {
    setAuthError("");
    try {
      await loginWithCode({ code });
      setStep('loggedIn');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to log in');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full" style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Mobile fixed container */}
      <div
        className="relative"
        style={{
          width: 390,
          height: '92vh',
          maxWidth: '100vw',
          borderRadius: 18,
          background: '#F2F2F2',
          overflow: 'hidden',
          boxSizing: 'border-box',
          marginTop: 16,
          marginBottom: 16,
          border: '2.5px solid rgba(255,255,255,0.18)',
          position: 'relative',
        }}
      >
        {/* Background image */}
        <div className="absolute inset-0 w-full h-full" style={{ borderRadius: 18, overflow: 'hidden', zIndex: 0 }}>
          <img
            src="/runner.png"
            alt="Runner background"
            className="w-full h-full object-cover object-center"
            style={{ borderRadius: 18 }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" style={{ borderRadius: 18 }} />
        </div>
        {/* Logo at the top center */}
        <div className="relative z-10 w-full flex justify-center" style={{ paddingTop: 32, paddingBottom: 24 }}>
          <Image src="/assets/logo.svg" alt="Logo" width={56} height={56} priority />
        </div>
        {/* Main content at the bottom, glassmorphic rectangle, bottom left aligned, full width, no border, touches bottom */}
        <div className="absolute left-0 right-0 bottom-0 z-10 flex flex-col items-start justify-end px-0" style={{ width: '100%' }}>
          <div
            style={{
              width: '100%',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              background: 'linear-gradient(180deg, rgba(121, 71, 17, 0.00) 0%, rgba(194, 87, 34, 0.97) 100%)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
              backdropFilter: 'blur(17.05px)',
              WebkitBackdropFilter: 'blur(17.05px)',
              padding: '32px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              margin: '0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Blue blend overlay for seamless top blending */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(121, 71, 17, 0.00) 0%, rgba(194, 87, 34, 0.10) 30%, rgba(194, 87, 34, 0.97) 100%)',
            }} />
            {/* Login card content */}
            <div className="w-full" style={{ position: 'relative', zIndex: 1 }}>
              <div className="mb-6 w-full">
                <Link href="/" className="text-indigo-200 hover:text-white text-sm">
                  ← Back to Home
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-white mb-6 text-left" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>Login to Bodo</h1>
              {/* Step 1: Login with Privy (email OTP) */}
              {!authenticated && (
                <>
                  {step === 'email' && (
                    <div className="space-y-4 w-full">
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-white/80 text-gray-900"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading || !ready}
                      />
                      <button
                        className="w-full rounded-full bg-white text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-gray-100 transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
                        onClick={handleSendCode}
                        disabled={loading || !ready || !email}
                      >
                        {loading ? 'Sending code...' : 'Send Code'}
                      </button>
                      {authError && <div className="text-red-400 text-sm mt-2">{authError}</div>}
                    </div>
                  )}
                  {step === 'otp' && (
                    <div className="space-y-4 w-full">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-white/80 text-gray-900"
                        placeholder="Enter OTP code"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        className="w-full rounded-full bg-white text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-gray-100 transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
                        onClick={handleLoginWithCode}
                        disabled={loading || !code}
                      >
                        {loading ? 'Logging in...' : 'Login'}
                      </button>
                      {authError && <div className="text-red-400 text-sm mt-2">{authError}</div>}
                    </div>
                  )}
                </>
              )}
              {/* Step 2: After login, show user info and redirect */}
              {authenticated && (
                <div className="flex flex-col items-center space-y-4 w-full">
                  <div className="text-green-400 font-medium">Logged in as: {user?.privyUserId || user?.id}</div>
                  <div className="text-gray-200 text-center">Redirecting to homepage...</div>
                  <button onClick={logout} className="text-xs text-red-300 underline mb-2">Logout</button>
                </div>
              )}
              {/* Backend User Creation/Fetch */}
              {authenticated && !user && loading && (
                <div className="text-gray-200 text-center">Syncing user...</div>
              )}
              {process.env.NODE_ENV === 'development' && (
                <button
                  className="mt-4 w-full rounded-full bg-yellow-400 text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-yellow-300 transition"
                  onClick={() => window.location.href = '/homepage'}
                >
                  Skip Auth (Dev Only)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 