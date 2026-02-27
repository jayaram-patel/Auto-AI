"use client"

import { useAuthContext } from './auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { LogOut, RefreshCw, ArrowRight, TestTube } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function DebugAuth() {
  const { user, session, loading, signOut, isAuthenticated } = useAuthContext()
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  const refreshSession = async () => {
    const { data, error } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
    console.log('Refreshed session:', data, error)
  }

  const goToDashboard = () => {
    console.log('Manual dashboard redirect...')
    router.push('/dashboard')
  }

  const testRedirect = () => {
    console.log('Testing redirect...')
    window.location.href = '/dashboard'
  }

  const checkAuthState = async () => {
    const { data, error } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
    console.log('Current auth state:', { data, error, isAuthenticated, user: !!user })
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </div>
        
        <div>
          <strong>Current Path:</strong> {currentPath}
        </div>
        
        <div>
          <strong>Loading State:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        {user && (
          <div>
            <strong>User:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
        
        {session && (
          <div>
            <strong>Session:</strong>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={refreshSession} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Session
          </Button>
          
          <Button onClick={checkAuthState} variant="outline" size="sm">
            <TestTube className="h-4 w-4 mr-2" />
            Check Auth State
          </Button>
          
          <Button onClick={testRedirect} variant="outline" size="sm">
            <TestTube className="h-4 w-4 mr-2" />
            Test Redirect
          </Button>
          
          {isAuthenticated && (
            <>
              <Button onClick={goToDashboard} variant="default" size="sm">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button onClick={signOut} variant="destructive" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
