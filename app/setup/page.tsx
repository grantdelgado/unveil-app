'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserProfile } from '@/services/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { User } from '@/lib/supabase/types'

export default function AccountSetupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: profile, error } = await getCurrentUserProfile()
        
        if (error || !profile) {
          console.error('Failed to load user profile:', error)
          router.push('/login')
          return
        }

        setUserProfile(profile)
        
        // Pre-fill form if user already has some data
        if (profile.full_name && profile.full_name !== `User ${profile.phone?.slice(-4)}`) {
          setFullName(profile.full_name)
        }
        if (profile.email) {
          setEmail(profile.email)
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        router.push('/login')
      }
    }

    loadUserProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }

    setLoading(true)

    try {
      if (!userProfile?.id) {
        setError('User profile not found. Please try logging in again.')
        return
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          email: email.trim() || null
        })
        .eq('id', userProfile.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        setError('Failed to save your information. Please try again.')
        return
      }

      console.log('✅ Profile setup completed')
      
      // Redirect to select-event page
      router.push('/select-event')
      
    } catch (err) {
      console.error('Setup error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // Allow users to skip setup and go directly to events
    router.push('/select-event')
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-app rounded-xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Unveil!</h1>
          <p className="text-gray-600">
            Let&apos;s set up your account to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="fullName"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            disabled={loading}
            isRequired
          />

          <Input
            id="email"
            label="Email Address (Optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={loading}
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
              isLoading={loading}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Phone: {userProfile.phone}</p>
          <p className="mt-1">You can update this information later in your profile</p>
        </div>
      </div>
    </div>
  )
} 