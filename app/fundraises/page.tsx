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
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}
    >
      {/* Mobile fixed container */}
      <div
        className="relative scrollbar-hide"
        style={{
          width: 390,
          height: '92vh',
          maxWidth: '100vw',
          borderRadius: 18,
          background: '#F2F2F2',
          overflowY: 'auto',
          boxSizing: 'border-box',
          marginTop: 16,
          marginBottom: 16,
          border: '2.5px solid rgba(255,255,255,0.18)',
          position: 'relative', // ensure absolute children are relative to this
          /* Hide scrollbar for all browsers */
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE 10+ */
        }}
      >
        {/* Hide scrollbar for Webkit browsers */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
        
        {/* Top bar with back arrow and heading */}
        <div className="flex items-center px-4 pt-6 pb-4">
          <Link href="/homepage" className="mr-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 21L10.5 14L17.5 7" stroke="#696F79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1
            className="flex-1 text-center"
            style={{
              color: '#696F79',
              fontFamily: 'Red Hat Display, sans-serif',
              fontSize: 18,
              fontStyle: 'normal',
              fontWeight: 700,
              lineHeight: '109%',
              letterSpacing: 0.22,
              marginRight: 28 // to balance the arrow
            }}
          >
            Browse Campaigns
          </h1>
        </div>

        {/* Content */}
        <div className="px-4 pb-8">
          {fundraises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No fundraising campaigns found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fundraises.map((fundraise) => (
                <div key={fundraise.id} className="bg-white rounded-lg shadow-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{fundraise.title}</h3>
                  <p className="text-gray-600 mb-3 text-sm">{fundraise.description}</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold">${fundraise.targetAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pledged:</span>
                      <span className="font-semibold text-green-600">${fundraise.totalPledged}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid Out:</span>
                      <span className="font-semibold text-blue-600">${fundraise.totalPaidOut}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
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

                  <div className="text-xs text-gray-500">
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

        {/* Sticky plus button wrapper */}
        <div
          style={{
            position: 'sticky',
            bottom: 92,
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 40,
            pointerEvents: 'none', // so only the button is clickable
          }}
        >
          <button
            style={{
              marginRight: 24,
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.65)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
              border: '2px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 41,
              transition: 'box-shadow 0.2s, background 0.2s',
              pointerEvents: 'auto', // make the button itself clickable
            }}
            className="group hover:scale-105 active:scale-95"
            tabIndex={0}
          >
            {/* plus.svg (active: #DD2C00) */}
            <svg width="30" height="28" viewBox="0 0 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5874 13.9999H23.5041M15.0457 5.83325V22.1666" stroke="#DD2C00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Glassmorphic sticky bottom navbar (INSIDE phone container) */}
        <nav
          style={{
            position: 'sticky',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              width: '92%',
              margin: '0 auto',
              marginBottom: 12,
              background: 'rgba(255,255,255,0.65)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
              borderRadius: 40,
              border: '2px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
              height: 72,
              pointerEvents: 'auto',
              transition: 'box-shadow 0.2s',
            }}
          >
            {/* Home icon */}
            <Link href="/homepage" legacyBehavior passHref>
              <button
                style={{ background: 'none', border: 'none', padding: 0, outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 20, transition: 'background 0.15s, transform 0.15s' }}
                className="group hover:scale-110 active:scale-95"
                tabIndex={0}
                aria-label="Home"
              >
                {/* Home.svg */}
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.9435 7.23765L15.2188 2.6639C14.8031 2.38115 14.2975 2.22827 13.7778 2.22827C13.2582 2.22827 12.7523 2.38115 12.3366 2.6639L5.61188 7.23765C5.16445 7.54196 4.80127 7.93655 4.55115 8.3902C4.30103 8.84384 4.1709 9.3441 4.1709 9.85128V21.8303C4.1709 22.4079 4.42383 22.9619 4.87424 23.3703C5.32465 23.7788 5.93565 24.0083 6.57263 24.0083H20.983C21.62 24.0083 22.2307 23.7788 22.6811 23.3703C23.1315 22.9619 23.3848 22.4079 23.3848 21.8303V9.85128C23.3848 9.3441 23.2543 8.84384 23.0042 8.3902C22.7541 7.93655 22.3909 7.54196 21.9435 7.23765V7.23765Z" stroke="#44475C" strokeWidth="1.91535" strokeMiterlimit="10"/>
                  <path d="M13.7783 13.2002V20.4054" stroke="#44475C" strokeWidth="1.91535" strokeMiterlimit="10"/>
                </svg>
              </button>
            </Link>
            {/* Campaigns (Donation) icon */}
            <Link href="/campaigns" legacyBehavior passHref>
              <button
                style={{ background: 'none', border: 'none', padding: 0, outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 20, transition: 'background 0.15s, transform 0.15s' }}
                className="group hover:scale-110 active:scale-95"
                tabIndex={0}
                aria-label="Campaigns"
              >
                {/* hand-coins.svg */}
                <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.8335 17.9301H15.1668C15.7857 17.9301 16.3792 17.6843 16.8167 17.2467C17.2543 16.8091 17.5002 16.2156 17.5002 15.5968C17.5002 14.9779 17.2543 14.3844 16.8167 13.9468C16.3792 13.5093 15.7857 13.2634 15.1668 13.2634H11.6668C10.9668 13.2634 10.3835 13.4968 10.0335 13.9634L3.50016 20.2634M8.16683 24.9301L10.0335 23.2968C10.3835 22.8301 10.9668 22.5968 11.6668 22.5968H16.3335C17.6168 22.5968 18.7835 22.1301 19.6002 21.1968L24.9668 16.0634C25.417 15.638 25.6798 15.0511 25.6973 14.4319C25.7148 13.8127 25.4856 13.212 25.0602 12.7618C24.6347 12.3116 24.0478 12.0488 23.4287 12.0313C22.8095 12.0138 22.2087 12.243 21.7585 12.6684L16.8585 17.2184M2.3335 19.0968L9.3335 26.0968M22.0502 10.9301C22.0502 12.7987 20.5354 14.3134 18.6668 14.3134C16.7983 14.3134 15.2835 12.7987 15.2835 10.9301C15.2835 9.06153 16.7983 7.54676 18.6668 7.54676C20.5354 7.54676 22.0502 9.06153 22.0502 10.9301ZM10.5002 6.26343C10.5002 8.19642 8.93316 9.76343 7.00016 9.76343C5.06717 9.76343 3.50016 8.19642 3.50016 6.26343C3.50016 4.33043 5.06717 2.76343 7.00016 2.76343C8.93316 2.76343 10.5002 4.33043 10.5002 6.26343Z" stroke="#44475C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </Link>
            {/* Bell icon */}
            <Link href="/notifications" legacyBehavior passHref>
              <button
                style={{ background: 'none', border: 'none', padding: 0, outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 20, position: 'relative', transition: 'background 0.15s, transform 0.15s' }}
                className="group hover:scale-110 active:scale-95"
                tabIndex={0}
                aria-label="Notifications"
              >
                {/* bell.svg */}
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.8137 21.4302C10.9892 21.7342 11.2417 21.9866 11.5457 22.1622C11.8497 22.3377 12.1946 22.4301 12.5457 22.4301C12.8967 22.4301 13.2416 22.3377 13.5456 22.1622C13.8496 21.9866 14.1021 21.7342 14.2777 21.4302M3.80766 15.7562C3.67702 15.8994 3.59081 16.0774 3.55951 16.2687C3.52821 16.46 3.55318 16.6562 3.63136 16.8336C3.70955 17.0109 3.83759 17.1617 3.99991 17.2677C4.16223 17.3736 4.35183 17.43 4.54566 17.4302H20.5457C20.7395 17.4302 20.9291 17.374 21.0915 17.2683C21.2539 17.1626 21.3822 17.0119 21.4605 16.8347C21.5389 16.6575 21.5641 16.4613 21.5331 16.27C21.502 16.0787 21.4161 15.9005 21.2857 15.7572C19.9557 14.3862 18.5457 12.9292 18.5457 8.43018C18.5457 6.83888 17.9135 5.31275 16.7883 4.18754C15.6631 3.06232 14.137 2.43018 12.5457 2.43018C10.9544 2.43018 9.42823 3.06232 8.30302 4.18754C7.1778 5.31275 6.54566 6.83888 6.54566 8.43018C6.54566 12.9292 5.13466 14.3862 3.80766 15.7562Z" stroke="#44475C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </Link>
            {/* User icon - ACTIVE, with highlight */}
            <Link href="/fundraises" legacyBehavior passHref>
              <button
                style={{ background: 'none', border: 'none', padding: 0, outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: '50%', position: 'relative', transition: 'background 0.15s, transform 0.15s' }}
                className="group hover:scale-110 active:scale-95"
                tabIndex={0}
                aria-label="Browse Campaigns"
              >
                {/* Highlight circle */}
                <span style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(221,44,0,0.10)',
                  filter: 'blur(2px)',
                  zIndex: 0,
                }} />
                {/* Profile.svg (active: #DD2C00) */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M16.2864 6.64492C16.2864 5.62209 15.88 4.64115 15.1568 3.91789C14.4335 3.19464 13.4527 2.78833 12.4298 2.78833C11.407 2.78833 10.4261 3.19464 9.70287 3.91789C8.97962 4.64115 8.57324 5.62209 8.57324 6.64492V8.57321C8.57324 9.59604 8.97962 10.577 9.70287 11.3002C10.4261 12.0235 11.407 12.4298 12.4298 12.4298C13.4527 12.4298 14.4335 12.0235 15.1568 11.3002C15.88 10.577 16.2864 9.59604 16.2864 8.57321V6.64492Z" stroke="#DD2C00" strokeWidth="1.86358" strokeMiterlimit="10"/>
                  <path d="M3.75244 22.0713C5.21794 18.099 8.57317 15.3223 12.4298 15.3223C16.2863 15.3223 19.6416 18.099 21.1071 22.0713" stroke="#DD2C00" strokeWidth="1.86358" strokeMiterlimit="10"/>
                </svg>
              </button>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
} 