'use client'

import { useState, useEffect } from 'react';
import { usePrivy, useLogin, useLoginWithEmail, useSendTransaction } from '@privy-io/react-auth';

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

export default function HomePage() {
  const { ready, authenticated, logout, user: privyUser } = usePrivy();
  const { login } = useLogin();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'email' | 'otp' | 'loggedIn'>('email');
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const { sendTransaction } = useSendTransaction();
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [fundraise, setFundraise] = useState<Fundraise | null>(null);
  const [fundraiseError, setFundraiseError] = useState('');
  const [loading, setLoading] = useState(false);

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

  // Step 2: Simulate Strava Connect
  function handleConnectStrava() {
    setStravaConnected(true);
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
    const deadline = (form.elements.namedItem('deadline') as HTMLInputElement).value;
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

  // Handle send transaction
  const handleSendTransaction = async () => {
    setTxStatus(null);
    try {
      const tx = await sendTransaction({
        to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C', // Example address
        value: 100000 // in wei (0.0001 ETH)
      });
      setTxStatus(`Transaction sent! Hash: ${tx.transactionHash}`);
    } catch (err: any) {
      setTxStatus(err.message || 'Failed to send transaction');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">Bodo - Fitness Fundraising</h1>
        {/* Step 1: Login with Privy (email OTP) */}
        {!authenticated && (
          <>
            {step === 'email' && (
              <div className="space-y-4">
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || !ready}
                />
                <button
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleSendCode}
                  disabled={loading || !ready || !email}
                >
                  {loading ? 'Sending code...' : 'Send Code'}
                </button>
                {authError && <div className="text-red-500 text-sm mt-2">{authError}</div>}
              </div>
            )}
            {step === 'otp' && (
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter OTP code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  disabled={loading}
                />
                <button
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleLoginWithCode}
                  disabled={loading || !code}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                {authError && <div className="text-red-500 text-sm mt-2">{authError}</div>}
              </div>
            )}
          </>
        )}
        {/* Step 2: After login, show wallet actions */}
        {authenticated && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-green-600 font-medium">Logged in as: {user?.privyUserId || user?.id}</div>
            <button onClick={logout} className="text-xs text-red-500 underline mb-2">Logout</button>
            <button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              onClick={handleSendTransaction}
              disabled={loading}
            >
              {loading ? 'Sending Transaction...' : 'Send Test Transaction'}
            </button>
            {txStatus && <div className="text-blue-600 text-sm mt-2 break-all">{txStatus}</div>}
          </div>
        )}
        {/* Step 1b: Backend User Creation/Fetch */}
        {authenticated && !user && loading && (
          <div className="text-gray-500 text-center">Syncing user...</div>
        )}
        {/* Step 2: Connect Strava */}
        {user && !stravaConnected && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-green-600 font-medium">User ready: {user.privyUserId}</div>
            <button onClick={handleConnectStrava} className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
              Connect Strava
            </button>
          </div>
        )}
        {/* Step 3: Create Fundraise */}
        {user && stravaConnected && !fundraise && (
          <form onSubmit={handleCreateFundraise} className="space-y-4 mt-4">
            <div className="text-green-600 font-medium">Strava connected!</div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Title</label>
              <input name="title" required className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Fundraise Title" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Description</label>
              <textarea name="description" required className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Describe your campaign" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Target Amount ($)</label>
              <input name="targetAmount" type="number" min="1" required className="w-full border border-gray-300 rounded px-3 py-2" placeholder="1000" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Deadline</label>
              <input name="deadline" type="date" required className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Creating Fundraise...' : 'Create Fundraise'}
            </button>
            {fundraiseError && <div className="text-red-500 text-sm mt-2">{fundraiseError}</div>}
          </form>
        )}
        {/* Step 4: Show Shareable Link */}
        {fundraise && (
          <div className="flex flex-col items-center space-y-4 mt-4">
            <div className="text-green-600 font-medium">Fundraise created!</div>
            <div className="text-gray-700">Title: <span className="font-semibold">{fundraise.title}</span></div>
            <div className="text-gray-700">Target: <span className="font-semibold">${fundraise.targetAmount}</span></div>
            <div className="text-gray-700">Deadline: <span className="font-semibold">{new Date(fundraise.deadline).toLocaleDateString()}</span></div>
            <div className="text-gray-700">Shareable Link:</div>
            <a href={`/fundraise/${fundraise.id}`} className="text-indigo-600 underline break-all" target="_blank" rel="noopener noreferrer">
              {typeof window !== 'undefined' ? window.location.origin : ''}/fundraise/{fundraise.id}
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 