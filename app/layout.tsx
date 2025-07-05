import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bodo - Fitness Fundraising Platform',
  description: 'Connect your fitness activities to fundraising campaigns. Every kilometer you run, cycle, or walk can earn money for causes you care about.',
  keywords: ['fitness', 'fundraising', 'strava', 'blockchain', 'escrow'],
  authors: [{ name: 'Bodo Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
} 