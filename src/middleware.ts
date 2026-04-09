import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'enablement-hub-session'

// API routes that require editor role for mutations
const EDITOR_ONLY_API = ['/api/launches', '/api/activities', '/api/requests']

// Users with viewer-only access (cannot mutate)
const VIEWER_NAMES = ['guest viewer']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // For new v2 API mutation routes, block viewers from mutating
  if (EDITOR_ONLY_API.some(p => pathname.startsWith(p))) {
    const method = request.method
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
      if (!sessionCookie) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      try {
        const session = JSON.parse(sessionCookie)
        if (VIEWER_NAMES.includes(session.name?.toLowerCase())) {
          return NextResponse.json({ error: 'View-only access' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/launches/:path*', '/api/activities/:path*', '/api/requests/:path*'],
}
