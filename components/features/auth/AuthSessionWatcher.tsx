'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthSessionWatcherProps {
  children?: React.ReactNode
}

export function AuthSessionWatcher({ children }: AuthSessionWatcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return

      console.log('🔐 Auth state change:', event, session?.user?.id || 'no session')

      try {
        if (session?.user) {
          // User is authenticated with valid Supabase session
          await handleAuthenticatedUser(session.user)
        } else {
          // No Supabase session - but don't immediately redirect on SIGNED_OUT events
          // as they might be temporary during token refresh
          console.log('❌ No Supabase session found')
          
          // Only redirect if this is an initial session check or token expired
          if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            setLoading(false)
            setInitialized(true)
            
            // Only redirect to login if not already on login page
            if (pathname !== '/login') {
              console.log('🔄 Redirecting to login from:', pathname)
              router.push('/login')
            } else {
              console.log('✅ Already on login page, no redirect needed')
            }
          } else if (event === 'SIGNED_OUT') {
            // For SIGNED_OUT events, wait a moment to see if it's just a token refresh
            console.log('⏳ User signed out, waiting for potential token refresh...')
            setTimeout(() => {
              if (!mounted) return
              
              // Check if we still don't have a session after waiting
              supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
                if (!currentSession && pathname !== '/login') {
                  console.log('🔄 No session after timeout, redirecting to login')
                  setLoading(false)
                  setInitialized(true)
                  router.push('/login')
                }
              })
            }, 1000) // Wait 1 second for potential token refresh
          }
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error)
        setLoading(false)
        setInitialized(true)
        
        // Only redirect if not already on login page
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    }

    const handleAuthenticatedUser = async (authUser: User) => {
      try {
        console.log('👤 Handling authenticated user:', authUser.id)
        
        // Fetch user profile from users table using auth.uid()
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, phone, full_name, email, avatar_url, created_at, updated_at')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          console.error('❌ Failed to fetch user profile:', profileError)
          
          // If profile doesn't exist, redirect to login to recreate it
          if (profileError.code === 'PGRST116') {
            console.log('👤 No user profile found, redirecting to login')
            setLoading(false)
            setInitialized(true)
            if (pathname !== '/login') {
              router.push('/login')
            }
            return
          }
          
          throw profileError
        }

        if (userProfile) {
          console.log('✅ User profile loaded:', userProfile.id)
          setLoading(false)
          setInitialized(true)
          
          // If on login page and authenticated, redirect to select-event immediately
          if (pathname === '/login') {
            console.log('🔄 Authenticated user on login page, redirecting to select-event')
            // Use replace instead of push to prevent back button issues
            router.replace('/select-event')
          }
        } else {
          console.warn('⚠️ No user profile data returned')
          setLoading(false)
          setInitialized(true)
          if (pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('❌ Error handling authenticated user:', error)
        setLoading(false)
        setInitialized(true)
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting initial session:', error)
          setLoading(false)
          setInitialized(true)
          return
        }

        console.log('📋 Initial session result:', session ? 'session found' : 'no session')
        await handleAuthStateChange('INITIAL_SESSION', session)
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error)
        setLoading(false)
        setInitialized(true)
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    // Get initial session
    getInitialSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname])

  // Show loading state while checking authentication (but not on login page)
  if (loading && !initialized && pathname !== '/login') {
    return (
              <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💍</div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Render children (the actual page content)
  return <>{children}</>
}

