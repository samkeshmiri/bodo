'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';

interface Fundraise {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  deadline: string;
  user: {
    privyUserId: string;
  };
}

export default function PledgePage() {
  const { fundraiseId } = useParams<{ fundraiseId: string }>();
  const router = useRouter();
  const { login, authenticated, user, ready } = usePrivy();
  
  const [fundraise, setFundraise] = useState<Fundraise | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'form' | 'transfer' | 'complete'>('form');
  const [pledgeId, setPledgeId] = useState<string>('');
  
  // Form state
  const [perKmRate, setPerKmRate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

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

  // Always use connected wallet address
  useEffect(() => {
    if (ready && authenticated && user && user.wallet?.address) {
      setWalletAddress(user.wallet.address);
    } else {
      setWalletAddress('');
    }
  }, [ready, authenticated, user]);

  const handleConnectWallet = async () => {
    setError('');
    try {
      await login();
    } catch (err: any) {
      setError('Failed to connect wallet');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!authenticated || !walletAddress) {
        setError('Please connect your wallet first.');
        setSubmitting(false);
        return;
      }
      // Create the pledge record
      const pledgeData: any = {
        fundraiseId,
        perKmRate: parseFloat(perKmRate),
        totalAmountPledged: parseFloat(totalAmount),
        stakerWalletAddress: walletAddress,
      };
      // Only include stakerUserId if it's a UUID (your own user, not Privy)
      if (user?.id && /^[0-9a-fA-F-]{36}$/.test(user.id)) {
        pledgeData.stakerUserId = user.id;
      }
      const res = await fetch('/api/pledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pledgeData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create pledge');
      setPledgeId(data.pledge.id);
      setStep('transfer');
    } catch (err: any) {
      setError(err.message || 'Failed to create pledge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundTransfer = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (!user?.wallet?.address) {
        throw new Error('Please connect your wallet first');
      }
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x1234567890123456789012345678901234567890';
      const tx = await signer.sendTransaction({
        to: escrowAddress,
        value: ethers.parseEther(totalAmount),
      });
      const receipt = await tx.wait();
      const updateRes = await fetch('/api/pledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pledgeId: pledgeId,
          escrowTxHash: receipt?.hash,
        }),
      });
      if (!updateRes.ok) {
        throw new Error('Failed to update pledge with transaction hash');
      }
      setStep('complete');
      setTimeout(() => {
        router.push(`/fundraise/${fundraiseId}`);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to transfer funds');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading wallet provider...
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error && !fundraise) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }
  if (!fundraise) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Fundraise not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">Pledge to Support</h1>
        <h2 className="text-lg font-semibold text-gray-700 mb-6">{fundraise.title}</h2>
        
        {step === 'complete' ? (
          <div className="text-center">
            <div className="text-green-600 text-lg font-semibold mb-2">Pledge & Payment Complete!</div>
            <div className="text-gray-600">Redirecting to fundraise page...</div>
          </div>
        ) : step === 'transfer' ? (
          <div className="text-center">
            <div className="text-lg font-semibold mb-4">Transfer Funds to Escrow</div>
            <div className="text-gray-600 mb-4">
              Amount: ${totalAmount}<br/>
              Rate: ${perKmRate}/km
            </div>
            <button
              onClick={handleFundTransfer}
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing Transaction...' : `Send $${totalAmount} to Escrow`}
            </button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!authenticated || !walletAddress ? (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect Wallet
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Please connect your wallet to pledge and send funds
                </p>
              </div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate per kilometer ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total amount to pledge ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="100.00"
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={submitting || !authenticated || !walletAddress}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating Pledge...' : 'Create Pledge'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 