import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Temporarily disabled to test redirects
  return NextResponse.next()
  
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
