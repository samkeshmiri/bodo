'use client'

import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full" style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Mobile fixed container */}
      <div
        className="relative"
        style={{
          width: 390,
          height: '92vh',
          maxWidth: '100vw',
          borderRadius: 18,
          background: '#F2F2F2',
          overflow: 'hidden',
          boxSizing: 'border-box',
          marginTop: 16,
          marginBottom: 16,
          border: '2.5px solid rgba(255,255,255,0.18)',
          position: 'relative',
        }}
      >
        {/* Background image */}
        <div className="absolute inset-0 w-full h-full" style={{ borderRadius: 18, overflow: 'hidden', zIndex: 0 }}>
          <img
            src="/runner.png"
            alt="Runner background"
            className="w-full h-full object-cover object-center"
            style={{ borderRadius: 18 }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" style={{ borderRadius: 18 }} />
        </div>
        {/* Logo at the top center */}
        <div className="relative z-10 w-full flex justify-center" style={{ paddingTop: 32, paddingBottom: 24 }}>
          <Image src="/assets/logo.svg" alt="Logo" width={56} height={56} priority />
        </div>
        {/* Main content at the bottom, glassmorphic rectangle, bottom left aligned, full width, no border, touches bottom */}
        <div className="absolute left-0 right-0 bottom-0 z-10 flex flex-col items-start justify-end px-0" style={{ width: '100%' }}>
          <div
            style={{
              width: '100%',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              background: 'linear-gradient(180deg, rgba(121, 71, 17, 0.00) 0%, rgba(194, 87, 34, 0.97) 100%)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
              backdropFilter: 'blur(17.05px)',
              WebkitBackdropFilter: 'blur(17.05px)',
              padding: '32px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              margin: '0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Blue blend overlay for seamless top blending */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              pointerEvents: 'none',
              background: 'linear-gradient(180deg, rgba(121, 71, 17, 0.00) 0%, rgba(194, 87, 34, 0.10) 30%, rgba(194, 87, 34, 0.97) 100%)',
            }} />
            <h1
              style={{
                fontFamily: 'Red Hat Display, sans-serif',
                fontWeight: 500,
                fontSize: 32,
                color: '#fff',
                marginBottom: 10,
                textAlign: 'left',
                letterSpacing: 0.2,
                lineHeight: 1.1,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Run With Purpose
            </h1>
            <p
              style={{
                fontFamily: 'Red Hat Display, sans-serif',
                fontWeight: 400,
                fontSize: 18,
                color: '#FFFFFF9C',
                marginBottom: 28,
                textAlign: 'left',
                lineHeight: 1.3,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Get fit and raise money for causes you care about
            </p>
            <Link href="/login" style={{ width: '100%', display: 'block', position: 'relative', zIndex: 1 }}>
              <Image src="/assets/getstarted.svg" alt="Get Started" width={320} height={56} style={{ width: '100%', height: 'auto', maxWidth: 320, minWidth: 180, display: 'block' }} />
            </Link>
          </div>
        </div>
        {/* Glassmorphic sticky bottom navbar (INSIDE phone container) */}
     
      </div>
    </div>
  );
} 