"use client";

import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import confetti from "canvas-confetti";

function PrimaryActionButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        borderRadius: 97,
        background: 'linear-gradient(90deg, #FC4C02 0%, #DD2C00 100%)',
        boxShadow: '0px 0px 14.8px 4px rgba(71, 26, 0, 0.28) inset',
        color: '#FFF',
        fontFamily: 'Red Hat Display, sans-serif',
        fontWeight: 600,
        fontSize: 20,
        letterSpacing: 0.18,
        textAlign: 'center',
        outline: 'none',
        border: 'none',
        cursor: 'pointer',
        lineHeight: 'normal',
        width: '100%',
        padding: '18px 0',
        marginBottom: 0,
        marginTop: 8,
        transition: 'background 0.2s',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default function FundraisePublicSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.fundraiseId?.toString().toUpperCase() || "8XBS7SHA9";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pledge, setPledge] = useState(500);
  const [rate, setRate] = useState(5);
  const [distance, setDistance] = useState(100);
  const [goal, setGoal] = useState(1500);
  const [weeks, setWeeks] = useState(4);
  const [timeLeft, setTimeLeft] = useState(2); // weeks left
  const [profileUrl] = useState("/assets/profile 1.svg");

  useEffect(() => {
    if (canvasRef.current) {
      const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: true });
      myConfetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.1 },
        startVelocity: 35,
        gravity: 0.7,
        scalar: 1.1,
        ticks: 200,
        zIndex: 40,
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen w-full relative" style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Floating Profile + Dots */}
      <div className="absolute left-1/2 z-30" style={{ top: 60, transform: 'translateX(-50%)' }}>
        <div className="relative flex flex-col items-center">
          {/* Dots */}
          <span style={{ position: 'absolute', left: -60, top: 38, width: 12, height: 12, background: 'white', opacity: 0.7, borderRadius: '50%' }} />
          <span style={{ position: 'absolute', right: -60, top: 38, width: 12, height: 12, background: 'white', opacity: 0.7, borderRadius: '50%' }} />
          <span style={{ position: 'absolute', left: 60, top: -18, width: 8, height: 8, background: 'white', opacity: 0.5, borderRadius: '50%' }} />
          <span style={{ position: 'absolute', right: 60, top: -18, width: 8, height: 8, background: 'white', opacity: 0.5, borderRadius: '50%' }} />
          <span style={{ position: 'absolute', left: '50%', bottom: -18, width: 8, height: 8, background: 'white', opacity: 0.5, borderRadius: '50%', transform: 'translateX(-50%)' }} />
          <div className="rounded-full bg-white/10 p-2 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)' }}>
            <Image src={profileUrl} alt="Profile" width={120} height={120} style={{ borderRadius: '50%' }} />
          </div>
        </div>
      </div>
      {/* Mobile fixed container */}
      <div
        className="relative flex flex-col justify-between"
        style={{
          width: 390,
          height: '92vh',
          maxWidth: '100vw',
          borderRadius: 18,
          background: 'rgba(0,0,0,0.12)',
          overflow: 'hidden',
          marginTop: 16,
          marginBottom: 16,
          border: '2.5px solid rgba(255,255,255,0.18)',
          position: 'relative',
        }}
      >
        {/* Confetti Canvas */}
        <canvas
          ref={canvasRef}
          width={390}
          height={window.innerHeight * 0.92 || 700}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        />
        {/* Background image inside container */}
        <img
          src="/assets/success1-bg.png"
          alt="Success background"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ borderRadius: 18, zIndex: 0 }}
        />
        {/* Overlay for darkening if needed */}
        <div className="absolute inset-0" style={{ borderRadius: 18, zIndex: 1 }} />
        {/* Close button */}
        <button onClick={() => router.push("/homepage")}
          className="absolute top-4 right-4 z-20 text-lg text-gray-200 font-semibold focus:outline-none"
        >
          Close
        </button>
        {/* Main content */}
        <div className="flex flex-col items-center justify-center relative z-10 px-6 pt-48" style={{ flex: 1 }}>
          {/* Heading and subtext */}
          <h1 className="text-3xl font-bold text-white mb-2 text-center" style={{ fontFamily: 'Red Hat Display, sans-serif', letterSpacing: 0.5 }}>John is training for {weeks} weeks</h1>
          <p className="text-lg text-gray-200 mb-4 text-center" style={{ fontWeight: 400 }}>He's raising €{goal} for Cancer Research.<br />Join his mission by pledging support</p>
          {/* Stats row */}
          <div className="flex flex-row items-center justify-center gap-6 mb-6">
            <div className="flex flex-col items-center text-white/80 text-sm">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 8v4l3 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/></svg>
                {timeLeft}w left
              </span>
            </div>
            <div className="flex flex-col items-center text-white/80 text-sm">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {distance}km
              </span>
            </div>
            <div className="flex flex-col items-center text-white/80 text-sm">
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/><path d="M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                €{goal}
              </span>
            </div>
          </div>
          {/* Glassmorphic Pledge Card */}
          <div className="w-full mb-6" style={{ maxWidth: 370 }}>
            <div style={{
              borderRadius: 32,
              background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
              backdropFilter: 'blur(17.05px)',
              WebkitBackdropFilter: 'blur(17.05px)',
              padding: '28px 24px 18px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              margin: '0',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div className="flex flex-row items-center justify-between mb-2">
                <span className="text-white/90 text-lg font-semibold">Pledge a max amount</span>
                <span className="text-white/60 text-sm underline cursor-pointer">Edit rate</span>
              </div>
              <div className="flex flex-row items-center gap-3 mb-2">
                <div className="rounded-xl bg-white/80 px-4 py-2 text-orange-700 font-bold text-lg min-w-[70px] text-center" style={{ fontFamily: 'Red Hat Display, monospace', fontSize: 22 }}>€{pledge}</div>
                <input
                  type="range"
                  min={50}
                  max={goal}
                  step={10}
                  value={pledge}
                  onChange={e => setPledge(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: '#FC4C02',
                    height: 6,
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #FC4C02 0%, #DD2C00 100%)',
                    boxShadow: '0 2px 8px rgba(252,76,2,0.12)',
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between mt-1">
                <span className="text-white/80 text-base">€{rate} per km</span>
                {/* Optionally, add a little info icon here */}
              </div>
            </div>
          </div>
          {/* Summary */}
          <div className="w-full text-center text-white/80 text-base mb-4" style={{ fontWeight: 400 }}>
            At €{rate}/km, if John completes {distance}km, you'll pay €{pledge}
          </div>
        </div>
        {/* Approve Button */}
        <div className="w-full px-6 pb-8 z-20 relative flex flex-col gap-2" style={{ maxWidth: 390 }}>
          <PrimaryActionButton onClick={() => router.push('/fundraise/' + code + '/pledge/success')}>Approve</PrimaryActionButton>
        </div>
      </div>
    </div>
  );
} 