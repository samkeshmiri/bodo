"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef } from "react";
import Image from "next/image";

export default function FundraiseSuccessPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
      document.execCommand("copy");
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/fundraise/${code}`;
    if (navigator.share) {
      navigator.share({
        title: "Support my fundraiser!",
        text: "Check out my fitness fundraiser on Bodo!",
        url,
      });
    } else {
      window.open(url, "_blank");
    }
  };

  const handleTrack = () => {
    router.push(`/fundraise/${code}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full" style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #D65B1F 0%, #3B2212 100%)', overflow: 'hidden' }}>
      {/* Mobile fixed container */}
      <div
        className="relative"
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
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, #D65B1F 0%, #3B2212 100%)', borderRadius: 18, zIndex: 0 }} />
        {/* Close button */}
        <button onClick={() => router.push("/homepage")}
          className="absolute top-4 right-4 z-10 text-lg text-gray-200 font-semibold focus:outline-none"
        >
          Close
        </button>
        {/* Lightning icon */}
        <div className="flex flex-col items-center justify-center mt-16 mb-6 relative z-10">
          <div className="rounded-full bg-white/10 p-8 flex items-center justify-center mb-4" style={{ boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)' }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="white" fillOpacity="0.08"/><path d="M32 14L20 50H30L32 42L34 50H44L32 14Z" stroke="#fff" strokeWidth="3" strokeLinejoin="round"/></svg>
          </div>
        </div>
        {/* Main content */}
        <div className="flex flex-col items-center px-6 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Red Hat Display, sans-serif' }}>Awesome!</h1>
          <p className="text-lg text-gray-200 mb-6 text-center">Fundraiser created. Share this link with your people and get started!</p>
          <div className="flex w-full mb-4">
            <input
              ref={inputRef}
              className="flex-1 rounded-l-lg px-4 py-2 text-lg bg-white/80 text-gray-700 focus:outline-none"
              value={code}
              readOnly
              style={{ borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}
              onFocus={e => e.target.select()}
            />
            <button
              className="rounded-r-lg px-4 py-2 bg-[#7B4A2A] text-white font-semibold text-lg hover:bg-[#A65B2A] focus:outline-none"
              style={{ borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
          <button
            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-700 text-white text-xl font-semibold py-4 mb-4 shadow-lg hover:from-orange-600 hover:to-orange-800 transition"
            onClick={handleShare}
          >
            Share Link
          </button>
          <button
            className="w-full rounded-full bg-white/20 text-gray-200 text-lg font-medium py-3 mb-2 hover:bg-white/30 transition"
            onClick={handleTrack}
          >
            Track your fundraiser
          </button>
        </div>
      </div>
    </div>
  );
} 