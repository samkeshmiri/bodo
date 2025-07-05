'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  deadline: string;
  status: string;
  createdAt: string;
  totalPledged: number;
  totalPaidOut: number;
  progress: number;
  daysRemaining: number;
  user: {
    id: string;
    privyUserId: string;
    status: string;
  };
  pledges: Array<{
    id: string;
    perKmRate: number;
    totalAmountPledged: number;
    amountPaidOut: number;
    status: string;
    createdAt: string;
    staker?: {
      id: string;
      privyUserId: string;
    };
    stakerWalletAddress?: string;
  }>;
}

export default function CampaignDetailPage() {
  const params = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const response = await fetch(`/api/campaigns/${params.campaignId}`);
        if (response.ok) {
          const data = await response.json();
          setCampaign(data.campaign);
        } else {
          setError('Failed to fetch campaign');
        }
      } catch (err) {
        setError('Error loading campaign');
      } finally {
        setLoading(false);
      }
    }

    if (params.campaignId) {
      fetchCampaign();
    }
  }, [params.campaignId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Campaign not found'}</p>
          <Link 
            href="/campaigns"
            className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link 
              href="/campaigns"
              className="text-indigo-600 hover:text-indigo-700 mb-4 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Campaigns
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{campaign.title}</h1>
            <p className="text-gray-600 text-lg">{campaign.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
            {campaign.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Campaign Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Campaign Progress</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Target Amount:</span>
                  <span className="font-semibold text-2xl">${campaign.targetAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Pledged:</span>
                  <span className="font-semibold text-xl text-green-600">${campaign.totalPledged.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Paid Out:</span>
                  <span className="font-semibold text-xl text-blue-600">${campaign.totalPaidOut.toLocaleString()}</span>
                </div>

                <div className="pt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(campaign.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(campaign.progress)}`}
                      style={{ width: `${Math.min(campaign.progress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pledges Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pledges ({campaign.pledges.length})</h2>
              
              {campaign.pledges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No pledges yet</p>
                  <p className="text-gray-500 text-sm">Be the first to support this campaign!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaign.pledges.map((pledge) => (
                    <div key={pledge.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-800">
                            {pledge.staker ? `User ${pledge.staker.privyUserId.slice(-6)}` : `Anonymous ${pledge.stakerWalletAddress?.slice(-6)}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${pledge.perKmRate}/km • ${pledge.totalAmountPledged.toLocaleString()} pledged
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pledge.status)}`}>
                          {pledge.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Paid out: ${pledge.amountPaidOut.toLocaleString()}</span>
                        <span>{new Date(pledge.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Campaign Details</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">{new Date(campaign.deadline).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className={`font-medium ${campaign.daysRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {campaign.daysRemaining > 0 ? `${campaign.daysRemaining} days left` : 'Expired'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Campaigner</p>
                  <p className="font-medium">User {campaign.user.privyUserId.slice(-6)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/fundraise/${campaign.id}`}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center font-medium block"
                >
                  Make a Pledge
                </Link>
                
                <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Share Campaign
                </button>
                
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 