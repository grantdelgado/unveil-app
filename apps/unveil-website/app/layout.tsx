import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.sendunveil.com'),
  title: 'Unveil - Wedding Management Made Simple',
  description: 'Transform your wedding planning with Unveil. Seamlessly manage guest communications, share memories, and coordinate your special day with our intuitive mobile app.',
  keywords: ['wedding', 'planning', 'guests', 'communication', 'mobile app', 'memories'],
  authors: [{ name: 'Unveil Team' }],
  creator: 'Unveil',
  publisher: 'Unveil',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.sendunveil.com',
    title: 'Unveil - Wedding Management Made Simple',
    description: 'Transform your wedding planning with Unveil. Seamlessly manage guest communications, share memories, and coordinate your special day.',
    siteName: 'Unveil',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Unveil - Wedding Management Made Simple',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unveil - Wedding Management Made Simple',
    description: 'Transform your wedding planning with Unveil. Seamlessly manage guest communications, share memories, and coordinate your special day.',
    creator: '@sendunveil',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification-token-here',
  },
  other: {
    'msvalidate.01': 'validation-token-here',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Font preload for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicons and PWA icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA meta tags */}
        <meta name="theme-color" content="#fb7185" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Unveil" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Unveil" />
        
        {/* Performance and security */}
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* iOS specific */}
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
} 