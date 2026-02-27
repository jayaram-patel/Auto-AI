import { useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isInitialMount = useRef(true)
  const hasRedirected = useRef(false)

  useEffect(() => {
    console.log('useAuth: Initial mount, getting session...')
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('useAuth: Initial session:', session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('useAuth: Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state change:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // Empty dependency array is correct here

  // Separate effect for handling redirects
  useEffect(() => {
    console.log('useAuth: Redirect effect triggered:', { 
      user: !!user, 
      loading, 
      isInitialMount: isInitialMount.current,
      hasRedirected: hasRedirected.current
    })
    
    // Skip redirect on initial mount
    if (isInitialMount.current) {
      console.log('useAuth: Skipping redirect on initial mount')
      isInitialMount.current = false
      return
    }

    // Only redirect after loading is complete
    if (loading) {
      return
    }

    const currentPath = window.location.pathname

    if (user) {
      // User is authenticated, redirect to dashboard if not already there and haven't redirected yet
      if (currentPath !== '/dashboard' && !hasRedirected.current) {
        console.log('useAuth: User authenticated, redirecting to dashboard')
        hasRedirected.current = true
        try {
          router.push('/dashboard')
        } catch (error) {
          console.error('useAuth: Error during redirect:', error)
          window.location.href = '/dashboard'
        }
      }
    } else {
      // User is not authenticated, reset redirect flag and redirect to login if not already there
      hasRedirected.current = false
      if (currentPath !== '/') {
        console.log('useAuth: User not authenticated, redirecting to login')
        try {
          router.push('/')
        } catch (error) {
          console.error('useAuth: Error during redirect:', error)
          window.location.href = '/'
        }
      }
    }
  }, [user, loading, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('useAuth: Error signing out:', error)
    }
  }

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  }
}