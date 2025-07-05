'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Fundraise {
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
}

export default function FundraisesPage() {
  const [fundraises, setFundraises] = useState<Fundraise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchFundraises() {
      try {
        const response = await fetch('/api/fundraise');
        if (response.ok) {
          const data = await response.json();
          setFundraises(data.fundraises || []);
        } else {
          setError('Failed to fetch fundraises');
        }
      } catch (err) {
        setError('Error loading fundraises');
      } finally {
        setLoading(false);
      }
    }

    fetchFundraises();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading fundraises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Fundraising Campaigns</h1>
          <Link 
            href="/"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {fundraises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No fundraising campaigns found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundraises.map((fundraise) => (
              <div key={fundraise.id} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{fundraise.title}</h3>
                <p className="text-gray-600 mb-4">{fundraise.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-semibold">${fundraise.targetAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pledged:</span>
                    <span className="font-semibold text-green-600">${fundraise.totalPledged}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Out:</span>
                    <span className="font-semibold text-blue-600">${fundraise.totalPaidOut}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(fundraise.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(fundraise.progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <p>Deadline: {new Date(fundraise.deadline).toLocaleDateString()}</p>
                  <p>Status: <span className={`font-semibold ${fundraise.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                    {fundraise.status}
                  </span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 