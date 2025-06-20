'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, RefreshCw, Home, AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Website error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-unveil-gradient">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold">Unveil</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Error Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We&apos;re sorry, but something unexpected happened. 
              Please try again or return to the homepage.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              variant="gradient" 
              size="lg" 
              className="w-full"
              onClick={reset}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Link href="/">
              <Button variant="outline" size="lg" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Error Details (Development Only)
              </summary>
              <div className="text-xs text-gray-600 font-mono break-all">
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.digest && (
                  <div className="mb-2">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Help Links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Need help?</p>
            <div className="space-y-2">
              <Link 
                href="/#guest-consent" 
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                Guest Consent Documentation
              </Link>
              <Link 
                href="/#policies" 
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                Privacy & SMS Policies
              </Link>
              <a 
                href="mailto:hello@sendunveil.com" 
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Unveil. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
} 