"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import confetti from "canvas-confetti";

function PrimaryActionButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      style={{
        borderRadius: 97,
        background: '#FC4C02',
        boxShadow: '0px 0px 14.8px 4px rgba(71, 26, 0, 0.28) inset',
        color: '#FFF',
        fontFamily: 'Red Hat Display, sans-serif',
        fontWeight: 500,
        fontSize: 18,
        letterSpacing: 0.18,
        textAlign: 'center',
        outline: 'none',
        border: 'none',
        cursor: 'pointer',
        lineHeight: 'normal',
        width: '100%',
        padding: '18px 0',
        marginBottom: 10,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default function FundraiseConfirmationPage() {
  const router = useRouter();
  const code = "8XBS7SHA9"; // Placeholder code
  const [inviteUrl, setInviteUrl] = useState("");
  const [canvasHeight, setCanvasHeight] = useState(700);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteUrl(`${window.location.origin}/fundraise/${code}/success`);
      setCanvasHeight(window.innerHeight * 0.92 || 700);
    }
  }, []);

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inviteUrl);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Support my fundraiser!",
        text: "Check out my fitness fundraiser on Bodo!",
        url: `${window.location.origin}/fundraise/${code}`,
      });
    } else {
      window.open(`${window.location.origin}/fundraise/${code}`, "_blank");
    }
  };

  const handleTrack = () => {
    router.push(`/fundraise/${code}`);
  };

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
      {/* Floating Success Icon */}
      <div className="absolute left-1/2 z-30" style={{ top: 60, transform: 'translateX(-50%)' }}>
        <Image src="/assets/success-icon2.svg" alt="Success" width={180} height={180} />
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
          height={canvasHeight}
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
        <div className="flex flex-col items-center justify-center relative z-10 px-6 pt-40" style={{ flex: 1 }}>
          {/* Heading and subtext */}
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Red Hat Display, sans-serif', letterSpacing: 0.5 }}>Awesome!</h1>
          <p className="text-lg text-gray-200 mb-8 text-center" style={{ fontWeight: 400 }}>Fundraiser created. Share this link with your people and get started!</p>
          {/* Code input and copy button */}
          <div className="flex w-full mb-2 justify-center" style={{ maxWidth: 320 }}>
            <input
              ref={inputRef}
              className="flex-1 rounded-l-lg px-4 py-3 text-xl bg-white/80 text-gray-700 focus:outline-none font-semibold tracking-widest text-center"
              value={inviteUrl}
              readOnly
              style={{ borderTopLeftRadius: 12, borderBottomLeftRadius: 12, fontFamily: 'Red Hat Display, monospace', letterSpacing: 4 }}
              onFocus={e => e.target.select()}
            />
            <button
              className="rounded-r-lg px-5 py-3 bg-[#7B4A2A] text-white font-semibold text-lg hover:bg-[#A65B2A] focus:outline-none"
              style={{ borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
        </div>
        {/* Bottom buttons */}
        <div className="w-full px-6 pb-8 z-20 relative flex flex-col gap-2" style={{ maxWidth: 390 }}>
          <PrimaryActionButton onClick={handleShare}>
            Share Link
          </PrimaryActionButton>
          <button
            className="w-full rounded-full bg-transparent text-gray-200 text-lg font-medium py-3 hover:bg-white/10 transition"
            onClick={handleTrack}
            style={{ textDecoration: 'underline', background: 'none', fontWeight: 500 }}
          >
            Track your fundraiser
          </button>
        </div>
      </div>
    </div>
  );
} 