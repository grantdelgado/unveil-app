import { supabase } from '@/lib/supabase/client'
import type { UserInsert } from '@/lib/supabase/types'
import { logAuth, logAuthError, logDev } from '@/lib/logger'

// Development phone whitelist - retrieved from Supabase auth.users with @dev.unveil.app emails
const DEV_PHONE_WHITELIST = [
  '+15550000001',
  '+15550000002', 
  '+15550000003'
]

// Check if we're in development mode
const isDevMode = () => {
  return process.env.NODE_ENV !== 'production'
}

// Rate limiting for OTP requests
interface OTPRateLimit {
  phone: string
  attempts: number
  lastAttempt: number
  blockedUntil?: number
}

// In-memory rate limiting store (in production, use Redis or database)
const otpRateLimits = new Map<string, OTPRateLimit>()

// Rate limiting constants
const MAX_OTP_ATTEMPTS = 3 // Max attempts per hour
const OTP_RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const OTP_BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const MIN_RETRY_INTERVAL = 60 * 1000 // 1 minute between attempts

// Error handling for database constraints
const handleDatabaseError = (error: unknown, context: string) => {
  logAuthError(`Database error in ${context}`, error, context)
  
  const dbError = error as { code?: string; message?: string }
  
  if (dbError.code === '23505') {
    if (dbError.message?.includes('phone')) {
      throw new Error('A user with this phone number already exists')
    }
    throw new Error('User already exists')
  }
  
  if (dbError.code === '23503') {
    throw new Error('Invalid user reference')
  }
  
  throw new Error(dbError.message || 'Database operation failed')
}

// Phone number normalization utility
const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Convert to E.164 format (+1XXXXXXXXXX for US numbers)
  if (digits.length === 10) {
    return `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  } else if (digits.startsWith('1') && digits.length > 11) {
    return `+${digits.slice(0, 11)}`
  }
  
  // Default: assume US number and prepend +1
  return `+1${digits.slice(-10)}`
}

// Check if phone number is in development whitelist (bypasses OTP)
const isDevPhone = (phone: string): boolean => {
  return isDevMode() && DEV_PHONE_WHITELIST.includes(phone)
}

// Rate limiting functions
export const checkOTPRateLimit = (phone: string): { allowed: boolean; error?: string; retryAfter?: number } => {
  const now = Date.now()
  const rateLimit = otpRateLimits.get(phone)
  
  if (!rateLimit) {
    return { allowed: true }
  }
  
  // Check if blocked
  if (rateLimit.blockedUntil && now < rateLimit.blockedUntil) {
    const retryAfter = Math.ceil((rateLimit.blockedUntil - now) / 1000)
    return { 
      allowed: false, 
      error: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      retryAfter 
    }
  }
  
  // Reset if window has passed
  if (now - rateLimit.lastAttempt > OTP_RATE_LIMIT_WINDOW) {
    otpRateLimits.delete(phone)
    return { allowed: true }
  }
  
  // Check minimum retry interval
  if (now - rateLimit.lastAttempt < MIN_RETRY_INTERVAL) {
    const retryAfter = Math.ceil((MIN_RETRY_INTERVAL - (now - rateLimit.lastAttempt)) / 1000)
    return { 
      allowed: false, 
      error: `Please wait ${retryAfter} seconds before requesting another code.`,
      retryAfter 
    }
  }
  
  // Check max attempts
  if (rateLimit.attempts >= MAX_OTP_ATTEMPTS) {
    const blockedUntil = now + OTP_BLOCK_DURATION
    rateLimit.blockedUntil = blockedUntil
    otpRateLimits.set(phone, rateLimit)
    
    return { 
      allowed: false, 
      error: `Maximum attempts exceeded. Please try again in ${Math.ceil(OTP_BLOCK_DURATION / 60000)} minutes.`,
      retryAfter: Math.ceil(OTP_BLOCK_DURATION / 1000)
    }
  }
  
  return { allowed: true }
}

export const recordOTPAttempt = (phone: string) => {
  const now = Date.now()
  const existing = otpRateLimits.get(phone)
  
  if (existing && now - existing.lastAttempt < OTP_RATE_LIMIT_WINDOW) {
    existing.attempts += 1
    existing.lastAttempt = now
    otpRateLimits.set(phone, existing)
  } else {
    otpRateLimits.set(phone, {
      phone,
      attempts: 1,
      lastAttempt: now
    })
  }
}

export const clearOTPRateLimit = (phone: string) => {
  otpRateLimits.delete(phone)
}

// Core auth service functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    logAuthError('Error getting current user', error)
    return { user: null, error }
  }
}

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  } catch (error) {
    logAuthError('Error getting current session', error)
    return { session: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    logAuthError('Error signing out', error)
    return { error }
  }
}

// Send OTP to phone number
export const sendOTP = async (phone: string): Promise<{
  success: boolean;
  isDev: boolean;
  isNewUser?: boolean;
  error?: string;
}> => {
  try {
    // Normalize phone to E.164 format
    const normalizedPhone = normalizePhoneNumber(phone)
    
    logAuth('Sending OTP to phone', { 
      originalPhone: phone, 
      normalizedPhone 
    })
    
    // Check rate limiting
    const rateLimitCheck = checkOTPRateLimit(normalizedPhone)
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        isDev: false,
        error: rateLimitCheck.error
      }
    }
    
    // Check if development phone - bypass OTP and create direct session
    if (isDevPhone(normalizedPhone)) {
      logDev('Development phone detected, bypassing OTP and creating direct session')
      
      try {
        // Get the corresponding dev email for this phone (matches auth table format)
        const phoneForEmail = normalizedPhone.slice(1) // Remove + prefix: +15550000001 -> 15550000001
        const devEmail = `${phoneForEmail}@dev.unveil.app`
        const devPassword = `dev-${normalizedPhone.slice(-4)}-2024` // Match dev-setup.ts pattern
        
        logDev('Dev authentication attempt', {
          normalizedPhone,
          phoneForEmail,
          devEmail,
          devPassword
        })
        
        // Try to sign in with existing dev credentials
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword
        })
        
        if (authData?.user && authData?.session) {
          logAuth('Dev user signed in successfully', { userId: authData.user.id })
          
          // Handle user profile creation/lookup
          const userResult = await handleUserCreation(normalizedPhone, authData.user.id)
          
          if (!userResult.success) {
            logAuthError('Failed to handle user profile', userResult.error)
            return {
              success: false,
              isDev: true,
              error: userResult.error || 'Failed to handle user profile'
            }
          }
          
          return {
            success: true,
            isDev: true,
            isNewUser: userResult.isNewUser
          }
        }
        
        if (authError) {
          logAuthError('Dev authentication failed', authError)
          return {
            success: false,
            isDev: true,
            error: `Development authentication failed: ${authError.message}`
          }
        }
        
        return {
          success: false,
          isDev: true,
          error: 'Failed to create development session'
        }
        
      } catch (error) {
        logAuthError('Dev authentication error', error)
        return {
          success: false,
          isDev: true,
          error: error instanceof Error ? error.message : 'Development authentication failed'
        }
      }
    }
    
    // Send OTP via Supabase
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        channel: 'sms'
      }
    })
    
    if (error) {
      logAuthError('Failed to send OTP', error)
      return {
        success: false,
        isDev: false,
        error: error.message
      }
    }
    
    // Record attempt for rate limiting
    recordOTPAttempt(normalizedPhone)
    
    logAuth('OTP sent successfully')
    return {
      success: true,
      isDev: false
    }
    
  } catch (error) {
    logAuthError('OTP send error', error)
    return {
      success: false,
      isDev: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP'
    }
  }
}

// Verify OTP and complete authentication
export const verifyOTP = async (phone: string, token: string): Promise<{
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  error?: string;
}> => {
  try {
    // Normalize phone to E.164 format
    const normalizedPhone = normalizePhoneNumber(phone)
    
    logAuth('Verifying OTP for phone', { normalizedPhone })
    
    // Development phones should not reach this function - they authenticate directly in sendOTP
    if (isDevPhone(normalizedPhone)) {
      logAuthError('Dev phone should not reach verifyOTP - authentication handled in sendOTP')
      return {
        success: false,
        isNewUser: false,
        error: 'Development authentication error - please try again'
      }
    }
    
    // Verify OTP with Supabase
    const { data: authData, error: otpError } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token,
      type: 'sms'
    })
    
    if (otpError) {
      logAuthError('OTP verification failed', otpError)
      return {
        success: false,
        isNewUser: false,
        error: otpError.message
      }
    }
    
    if (!authData?.user) {
      return {
        success: false,
        isNewUser: false,
        error: 'Authentication failed'
      }
    }
    
    logAuth('OTP verified successfully', { userId: authData.user.id })
    
    // Clear rate limiting on successful verification
    clearOTPRateLimit(normalizedPhone)
    
    // Handle user profile creation/lookup
    const result = await handleUserCreation(normalizedPhone, authData.user.id)
    
    // Add isNewUser flag to the response
    return {
      ...result,
      isNewUser: result.isNewUser
    }
    
  } catch (error) {
    logAuthError('OTP verification error', error)
    return {
      success: false,
      isNewUser: false,
      error: error instanceof Error ? error.message : 'OTP verification failed'
    }
  }
}

// Helper function to handle user creation/lookup logic
const handleUserCreation = async (normalizedPhone: string, userId: string): Promise<{
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  error?: string;
}> => {
  try {
    // Step 1: Check if user with this phone already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id, phone, full_name, email, created_at')
      .eq('phone', normalizedPhone)
      .single()
    
    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected for new users
      logAuthError('User lookup failed', lookupError)
      return {
        success: false,
        isNewUser: false,
        error: 'Failed to check existing user'
      }
    }
    
    if (existingUser) {
      // Step 2a: Returning user - verify session ID matches
      if (existingUser.id === userId) {
        logAuth('Returning user with matching session ID', { userId: existingUser.id })
        return {
          success: true,
          isNewUser: false,
          userId: userId
        }
      } else {
        // This should not happen with proper OTP flow, but handle gracefully
        logAuth('Existing user found but auth.uid() mismatch', {
          existingUserId: existingUser.id,
          sessionUserId: userId,
          phone: normalizedPhone
        })
        
        // In this case, the existing user profile takes precedence
        // The auth.uid() will be the new session ID
        return {
          success: true,
          isNewUser: false,
          userId: userId
        }
      }
    }
    
    // Step 2b: New user - create profile in users table
    logAuth('Creating new user profile for phone', { normalizedPhone })
    
    const newUserData: UserInsert = {
      id: userId, // Use the authenticated session user ID
      phone: normalizedPhone,
      full_name: `User ${normalizedPhone.slice(-4)}`, // Placeholder name
      email: null,
      avatar_url: null
    }
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(newUserData)
      .select('id, phone, full_name')
      .single()
    
    if (createError) {
      logAuthError('User creation failed', createError)
      return {
        success: false,
        isNewUser: true,
        error: `Failed to create user profile: ${createError.message}`
      }
    }
    
    logAuth('New user created', { userId: newUser.id })
    
    return {
      success: true,
      isNewUser: true,
      userId: userId
    }
    
  } catch (error) {
    logAuthError('User creation error', error)
    return {
      success: false,
      isNewUser: false,
      error: error instanceof Error ? error.message : 'User creation failed'
    }
  }
}

// Get current authenticated user profile from users table
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { data: null, error: authError || new Error('No authenticated user') }
    }
    
    // Fetch user profile from users table using auth.uid()
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return { data: profile, error: profileError }
  } catch (error) {
    logAuthError('Error fetching user profile', error)
    return { data: null, error }
  }
}

// Validate phone number format
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' }
  }
  
  if (digits.length > 11) {
    return { isValid: false, error: 'Phone number is too long' }
  }
  
  return { isValid: true }
}

// Helper function to get user by phone
export const getUserByPhone = async (phone: string) => {
  try {
    return await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
      return { data: null, error: null } // User not found is OK
    }
    handleDatabaseError(error, 'getUserByPhone')
  }
}

// Export rate limiting constants for monitoring
export const OTP_RATE_LIMITING = {
  MAX_ATTEMPTS: MAX_OTP_ATTEMPTS,
  WINDOW_MS: OTP_RATE_LIMIT_WINDOW,
  BLOCK_DURATION_MS: OTP_BLOCK_DURATION,
  MIN_RETRY_INTERVAL_MS: MIN_RETRY_INTERVAL,
  // Helper to get current rate limit status
  getRateLimitStatus: (phone: string) => otpRateLimits.get(phone) || null
} 