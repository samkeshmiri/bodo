'use client'

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">Bodo</h1>
        <p className="text-xl text-gray-600 mb-8">Fitness Fundraising Platform</p>
        <p className="text-gray-500 mb-8">
          Connect your Strava activities to fundraising campaigns. 
          Create campaigns, make pledges, and earn money based on your fitness activities.
        </p>
        <Link 
          href="/login" 
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
} 