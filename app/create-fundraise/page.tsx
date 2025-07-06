'use client'

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function CreateFundraisePage() {
  const { ready, authenticated, user: privyUser } = usePrivy();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fundraise, setFundraise] = useState<Fundraise | null>(null);
  const [fundraiseError, setFundraiseError] = useState('');
  const router = useRouter();

  // Fetch user info on mount
  useEffect(() => {
    async function fetchUser() {
      if (authenticated && privyUser?.id) {
        setLoading(true);
        try {
          const res = await fetch(`/api/user/${privyUser.id}`);
          const data = await res.json();
          setUser(data.user as User);
        } catch (err) {
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else if (process.env.NODE_ENV === 'development') {
        // Dev mode bypass: set a mock user with stravaId
        setUser({
          id: 'dev-user',
          privyUserId: 'dev-privy',
          stravaId: 'dev-strava',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    }
    fetchUser();
  }, [authenticated, privyUser?.id]);

  async function handleCreateFundraise(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFundraiseError('');
    setFundraise(null);
    setLoading(true);
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
      // Redirect to success page with fundraiser id
      router.push(`/fundraises/success?code=${data.fundraise.id}`);
    } catch (err) {
      setFundraiseError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Access control
  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>
    );
  }
  if (!authenticated && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">You must be logged in to create a fundraise.</div>
    );
  }
  if (!user?.stravaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">You must connect your Strava account first.</div>
    );
  }

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
        {process.env.NODE_ENV === 'development' && !authenticated && (
          <div className="w-full max-w-md mb-4 rounded-xl bg-yellow-400 text-gray-900 font-semibold text-center py-2 shadow">DEV MODE: Auth Bypassed</div>
        )}
        <div className="w-full max-w-md rounded-3xl bg-black/40 backdrop-blur-md p-8 flex flex-col items-center shadow-xl">
          <div className="mb-6 w-full">
            <Link href="/homepage" className="text-indigo-200 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Fundraise</h1>
          {!fundraise && (
            <form onSubmit={handleCreateFundraise} className="space-y-4 mt-4 w-full">
              <div>
                <label className="block text-gray-200 font-medium mb-1">Title</label>
                <input name="title" required className="w-full border border-gray-300 rounded px-3 py-2 bg-white/80 text-gray-900" placeholder="Fundraise Title" />
              </div>
              <div>
                <label className="block text-gray-200 font-medium mb-1">Description</label>
                <textarea name="description" required className="w-full border border-gray-300 rounded px-3 py-2 bg-white/80 text-gray-900" placeholder="Describe your campaign" />
              </div>
              <div>
                <label className="block text-gray-200 font-medium mb-1">Target Amount ($)</label>
                <input name="targetAmount" type="number" min="1" required className="w-full border border-gray-300 rounded px-3 py-2 bg-white/80 text-gray-900" placeholder="1000" />
              </div>
              <div>
                <label className="block text-gray-200 font-medium mb-1">Deadline</label>
                <input name="deadline" type="date" required className="w-full border border-gray-300 rounded px-3 py-2 bg-white/80 text-gray-900" />
              </div>
              <button type="submit" className="w-full rounded-full bg-white text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-gray-100 transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}>
                {loading ? 'Creating Fundraise...' : 'Create Fundraise'}
              </button>
              {fundraiseError && <div className="text-red-400 text-sm mt-2">{fundraiseError}</div>}
            </form>
          )}
          {fundraise && (
            <div className="flex flex-col items-center space-y-4 mt-4 w-full">
              <div className="text-green-400 font-medium">Fundraise created!</div>
              <div className="text-gray-200">Title: <span className="font-semibold">{fundraise.title}</span></div>
              <div className="text-gray-200">Target: <span className="font-semibold">${fundraise.targetAmount}</span></div>
              <div className="text-gray-200">Deadline: <span className="font-semibold">{new Date(fundraise.deadline).toLocaleDateString()}</span></div>
              <div className="text-gray-200">Shareable Link:</div>
              <a href={`/fundraise/${fundraise.id}`} className="text-indigo-200 underline break-all" target="_blank" rel="noopener noreferrer">
                {typeof window !== 'undefined' ? window.location.origin : ''}/fundraise/{fundraise.id}
              </a>
              <div className="text-gray-300 text-sm mt-2">Redirecting to homepage in 3 seconds...</div>
              <Link href="/homepage" className="w-full rounded-full bg-white text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-gray-100 transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}>
                Go to Homepage Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 