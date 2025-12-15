// middleware.ts - FIXED VERSION
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  const path = request.nextUrl.pathname

  // Bỏ qua auth routes
  if (path.startsWith('/auth') || path.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Không có token
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    let currentUser = null
    let newSession = null

    // Thử dùng access token
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!error && user) {
        currentUser = user
      }
    }

    // Access token hết hạn → dùng refresh token
    if (!currentUser && refreshToken) {
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (refreshError || !data.session) {
        // Refresh thất bại → redirect login
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }

      // ✅ Refresh thành công
      currentUser = data.user
      newSession = data.session
    }

    if (!currentUser) {
      throw new Error('No valid session')
    }

    // Set header với user_id
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', currentUser.id)

    const response = NextResponse.next({
      request: { headers: requestHeaders }
    })

    // ✅ Nếu có session mới → cập nhật cookies
    if (newSession) {
      response.cookies.set('sb-access-token', newSession.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })

      response.cookies.set('sb-refresh-token', newSession.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      })
    }

    return response

  } catch {
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}