'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { sendOTP, verifyOTP, validatePhoneNumber } from '@/services'

// Login flow steps
type LoginStep = 'phone' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDev, setIsDev] = useState(false)
  const router = useRouter()

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError('')
    
    // Validate phone number
    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid phone number')
      return
    }

    setLoading(true)

    try {
      console.log('📱 Sending OTP to:', phone)
      
      const result = await sendOTP(phone)
      
      if (result.success) {
        console.log('✅ OTP sent successfully:', {
          isDev: result.isDev
        })
        
        if (result.isDev) {
          // Dev phone authenticated directly
          console.log('🛠️ Development mode: Direct authentication successful', {
            isNewUser: result.isNewUser
          })
          setError('') // Clear any previous errors
          
          // For dev authentication, show a success message and let AuthSessionWatcher handle routing
          // Don't immediately clear loading state as we want to show "Authenticating..." until redirect
          console.log('⏳ Waiting for AuthSessionWatcher to handle routing...')
          
          // Clear loading after a short delay if redirect doesn't happen
          setTimeout(() => {
            setLoading(false)
          }, 3000) // 3 second timeout
          
          return
        }
        
        // Regular flow - show OTP input
        setIsDev(result.isDev)
        setStep('otp')
        setLoading(false) // Only clear loading for regular OTP flow
      } else {
        console.error('❌ Failed to send OTP:', result.error)
        
        // Better error messages for development mode
        let errorMessage = result.error || 'Failed to send verification code. Please try again.'
        
        if (result.isDev && result.error?.includes('Database error')) {
          errorMessage = 'Development authentication failed. Please check your Supabase configuration.'
        } else if (result.isDev) {
          errorMessage = `Development authentication error: ${result.error}`
        }
        
        setError(errorMessage)
        setLoading(false)
      }
    } catch (err) {
      console.error('❌ Unexpected OTP send error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError('')
    
    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a 6-digit verification code')
      return
    }

    setLoading(true)

    try {
      console.log('🔐 Verifying OTP for:', phone)
      
      const result = await verifyOTP(phone, otp)
      
      if (result.success) {
        console.log('✅ Authentication successful:', {
          userId: result.userId,
          isNewUser: result.isNewUser
        })
        
        // Success - route based on user status
        if (result.isNewUser) {
          router.push('/setup')
        } else {
          router.push('/select-event')
        }
      } else {
        console.error('❌ OTP verification failed:', result.error)
        setError(result.error || 'Invalid verification code. Please try again.')
      }
    } catch (err) {
      console.error('❌ Unexpected OTP verification error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setError('')
    setIsDev(false)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length >= 10) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})/)
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`
      }
    }
    
    // For shorter numbers, just return the digits
    if (cleaned.length >= 6) {
      const match = cleaned.match(/^(\d{3})(\d{0,3})(\d{0,4})/)
      if (match) {
        let formatted = `(${match[1]})`
        if (match[2]) formatted += ` ${match[2]}`
        if (match[3]) formatted += `-${match[3]}`
        return formatted
      }
    }
    
    return cleaned
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
    setOtp(value)
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-stone-200 p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Unveil</h1>
          {step === 'phone' ? (
            <p className="text-gray-600">
              Enter your phone number to continue
            </p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Enter the verification code sent to
              </p>
              <p className="text-gray-900 font-medium">{phone}</p>
            </div>
          )}
        </div>

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              disabled={loading}
              error={error}
              isRequired
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading || !phone.trim()}
              isLoading={loading}
            >
              {loading ? 'Authenticating...' : 'Continue'}
            </Button>

            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <div className="font-semibold mb-1">🚀 Development Mode</div>
                <div>Use test numbers for instant authentication:</div>
                <div className="mt-1 font-mono text-blue-900">
                  (555) 000-0001 • (555) 000-0002 • (555) 000-0003
                </div>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <Input
              id="otp"
              label="Verification Code"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="123456"
              disabled={loading}
              error={error}
              isRequired
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
            />

            {isDev && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Development Mode:</strong> Enter any 6-digit code to continue
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading || otp.length !== 6}
                isLoading={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleBackToPhone}
                disabled={loading}
              >
                Change Phone Number
              </Button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          {step === 'phone' ? (
            <p>New to Unveil? Don&apos;t worry - we&apos;ll create your account automatically.</p>
          ) : (
            <p>Didn&apos;t receive a code? Wait 60 seconds and try again.</p>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Development Mode:</strong> Using phone-based OTP authentication
            <br />
            <strong>Test phones:</strong> +15550000001, +15550000002, +15550000003
          </div>
        )}
      </div>
    </div>
  )
} 