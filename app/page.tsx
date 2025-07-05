'use client'

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/runner.png"
          alt="Runner background"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Logo at the top */}
      <div className="relative z-10 w-full flex justify-center pt-8">
        {/* Replace with your SVG or image if available */}
        <span className="block">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 6L14 50H24.5L28 39.5L31.5 50H42L28 6Z" fill="white"/>
            <path d="M36 18H44V22H36V18Z" fill="white"/>
          </svg>
        </span>
      </div>

      {/* Main content at the bottom */}
      <div className="relative z-10 w-full flex flex-col items-center pb-10 px-4">
        <div className="w-full max-w-md rounded-3xl bg-black/40 backdrop-blur-md p-8 flex flex-col items-center shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">Run With Purpose</h1>
          <p className="text-lg text-gray-200 mb-8 text-center">Get fit and raise money for causes you care about</p>
          <Link
            href="/login"
            className="w-full rounded-full bg-white text-gray-900 text-lg font-semibold py-3 shadow-lg hover:bg-gray-100 transition text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
} 