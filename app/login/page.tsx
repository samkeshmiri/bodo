'use client'

import { useState, useEffect } from 'react';
import { usePrivy, useLogin, useLoginWithEmail, useSendTransaction } from '@privy-io/react-auth';
import Link from 'next/link';

interface User {
  id: string;
  privyUserId: string;
  stravaId?: string;
  status: string;
  createdAt: string;
}

interface Fundraise {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  deadline: string;
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
  const { sendTransaction } = useSendTransaction();
  const [stravaConnected, setStravaConnected] = useState(false);
  const [fundraise, setFundraise] = useState<Fundraise | null>(null);
  const [fundraiseError, setFundraiseError] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Step 2: Connect Strava
  function handleConnectStrava() {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/strava/callback`;
    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=auto&scope=activity:read`;
    window.location.href = stravaAuthUrl;
  }

  // Step 3: Create Fundraise
  async function handleCreateFundraise(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFundraiseError('');
    setFundraise(null);
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
    const targetAmount = (form.elements.namedItem('targetAmount') as HTMLInputElement).value;
    const deadlineDate = (form.elements.namedItem('deadline') as HTMLInputElement).value;
    const deadline = new Date(deadlineDate).toISOString();
    try {
      if (!user) throw new Error('User not found');
      const res = await fetch('/api/fundraise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title,
          description,
          targetAmount: Number(targetAmount),
          deadline
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create fundraise');
      setFundraise(data.fundraise as Fundraise);
    } catch (err) {
      setFundraiseError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

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
    <div className="relative min-h-screen flex flex-col justify-between items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/runner.png"
          alt="Runner background"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Logo at the top */}
      <div className="relative z-10 w-full flex justify-center pt-8">
        <span className="block">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 6L14 50H24.5L28 39.5L31.5 50H42L28 6Z" fill="white"/>
            <path d="M36 18H44V22H36V18Z" fill="white"/>
          </svg>
        </span>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full flex flex-col items-center pb-10 px-4">
        <div className="w-full max-w-md rounded-3xl bg-black/40 backdrop-blur-md p-8 flex flex-col items-center shadow-xl">
          <div className="mb-6 w-full">
            <Link href="/" className="text-indigo-200 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Login to Bodo</h1>
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
          {/* Step 2: After login, show wallet actions */}
          {authenticated && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-green-400 font-medium">Logged in as: {user?.privyUserId || user?.id}</div>
              <button onClick={logout} className="text-xs text-red-300 underline mb-2">Logout</button>
            </div>
          )}
          {/* Step 1b: Backend User Creation/Fetch */}
          {authenticated && !user && loading && (
            <div className="text-gray-200 text-center">Syncing user...</div>
          )}
          {/* Step 2: Connect Strava */}
          {user && !user.stravaId && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-green-400 font-medium">User ready: {user.privyUserId}</div>
              <button onClick={handleConnectStrava} className="w-full bg-orange-500 text-white py-2 rounded-full hover:bg-orange-600">
                Connect Strava
              </button>
            </div>
          )}
          {user && user.stravaId && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-green-400 font-medium">✅ Strava Connected!</div>
              <Link href="/create-fundraise" className="w-full rounded-full bg-white text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-gray-100 transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}>
                Create Fundraise
              </Link>
            </div>
          )}
          {/* Step 3: Create Fundraise */}
          {/* (Moved to /create-fundraise) */}
          {/* Step 4: Show Shareable Link */}
          {/* (Moved to /create-fundraise) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              className="mt-4 w-full rounded-full bg-yellow-400 text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-yellow-300 transition"
              onClick={() => window.location.href = '/create-fundraise'}
            >
              Skip Auth (Dev Only)
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 