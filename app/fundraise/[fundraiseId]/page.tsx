'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Fundraise {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  deadline: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    privyUserId: string;
    status: string;
    wallets?: { address: string }[];
  };
}

export default function FundraisePage() {
  const { fundraiseId } = useParams<{ fundraiseId: string }>();
  const [fundraise, setFundraise] = useState<Fundraise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFundraise() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/fundraise/${fundraiseId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch fundraise');
        setFundraise(data.fundraise);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch fundraise');
      } finally {
        setLoading(false);
      }
    }
    fetchFundraise();
  }, [fundraiseId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error || !fundraise) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Fundraise not found'}</div>;
  }

  // Get the first wallet address if available
  const walletAddress = fundraise.user.wallets?.[0]?.address || 'No wallet address available';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-indigo-600 mb-4">{fundraise.title}</h1>
        <div className="mb-2 text-gray-700">By: <span className="font-mono">{fundraise.user.privyUserId}</span></div>
        <div className="mb-2 text-gray-700">Target: <span className="font-semibold">${fundraise.targetAmount}</span></div>
        <div className="mb-2 text-gray-700">Deadline: <span className="font-semibold">{new Date(fundraise.deadline).toLocaleDateString()}</span></div>
        <div className="mb-4 text-gray-700">{fundraise.description}</div>
        <div className="mb-4">
          <div className="font-semibold mb-1">Send Funds</div>
          <div className="flex items-center space-x-2">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{walletAddress}</span>
            <button
              className="text-xs text-indigo-600 underline"
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              disabled={walletAddress === 'No wallet address available'}
            >
              Copy Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 