'use client';
import Image from 'next/image';
import { useState } from 'react';

export default function FundraiserSuccessPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = '8XBS7SHA9';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}
    >
      {/* Mobile fixed container */}
      <div
        className="relative"
        style={{
          width: 390,
          maxWidth: '100vw',
          borderRadius: 18,
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: '2.5px solid rgba(255,255,255,0.18)',
          background: '#1a1a1a',
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background image inside mobile container */}
        <Image
          src="/assets/success1-bg.png"
          alt="Success Background"
          fill
          style={{ objectFit: 'cover', zIndex: 0 }}
          priority
        />
        {/* Overlay for content readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* Close button */}
          <button
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'none',
              border: 'none',
              color: '#E5E5E5',
              fontSize: 22,
              fontWeight: 500,
              zIndex: 2,
              cursor: 'pointer',
            }}
            onClick={() => window.location.href = '/homepage'}
          >
            Close
          </button>
          {/* Success Icon */}
          <div style={{ marginTop: 48, marginBottom: 32, zIndex: 2 }}>
            <Image src="/assets/success-icon.svg" alt="Success" width={100} height={100} />
          </div>
          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 12, zIndex: 2 }}>
            <div
              style={{
                fontFamily: 'Red Hat Display, sans-serif',
                fontWeight: 700,
                fontSize: 30,
                color: '#fff',
                marginBottom: 8,
                letterSpacing: 0.2,
              }}
            >
              Awesome!
            </div>
            <div
              style={{
                fontFamily: 'Red Hat Display, sans-serif',
                fontWeight: 500,
                fontSize: 16,
                color: '#E5E5E5',
                lineHeight: 1.4,
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              Fundraiser created. Share this link with your people and get started!
            </div>
          </div>
          {/* Referral code and copy */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0 32px 0', width: '100%', maxWidth: 320, zIndex: 2 }}>
            <input
              value={referralCode}
              readOnly
              style={{
                flex: 1,
                borderRadius: 12,
                border: 'none',
                background: 'rgba(255,255,255,0.85)',
                color: '#7B7B8B',
                fontSize: 18,
                fontFamily: 'Red Hat Display, sans-serif',
                fontWeight: 500,
                padding: '12px 12px',
                marginRight: 8,
                outline: 'none',
                textAlign: 'center',
                letterSpacing: 2,
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                background: '#7B4B36',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontFamily: 'Red Hat Display, sans-serif',
                fontWeight: 500,
                fontSize: 16,
                padding: '10px 18px',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {/* Share Link Button */}
          <button
            style={{
              width: '100%',
              maxWidth: 320,
              borderRadius: 40,
              background: 'linear-gradient(90deg, #FC4C02 0%, #DD2C00 100%)',
              color: '#fff',
              fontFamily: 'Red Hat Display, sans-serif',
              fontWeight: 600,
              fontSize: 18,
              padding: '14px 0',
              marginBottom: 14,
              border: 'none',
              boxShadow: '0 4px 20px rgba(252, 76, 2, 0.18)',
              cursor: 'pointer',
              transition: 'background 0.15s',
              zIndex: 2,
            }}
            onClick={() => {}}
          >
            Share Link
          </button>
          {/* Track your fundraiser (secondary) */}
          <button
            style={{
              width: '100%',
              maxWidth: 320,
              borderRadius: 40,
              background: 'none',
              color: '#E5E5E5',
              fontFamily: 'Red Hat Display, sans-serif',
              fontWeight: 500,
              fontSize: 15,
              padding: '10px 0',
              border: 'none',
              marginBottom: 10,
              cursor: 'pointer',
              textDecoration: 'underline',
              zIndex: 2,
            }}
            onClick={() => {}}
          >
            Track your fundraiser
          </button>
        </div>
      </div>
    </div>
  );
} 