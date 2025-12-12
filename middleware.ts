// middleware.ts
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

  // ✅ FIX: Bỏ qua auth routes VÀ auth API
  if (path.startsWith('/auth') || path.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Không có token → redirect login
  if (!accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    // Thử verify access token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error && refreshToken) {
      // Access token hết hạn → dùng refresh token
      const { data, error: refreshError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (refreshError || !data.session) {
        // Refresh thất bại → logout
        const response = NextResponse.redirect(new URL('/auth/login', request.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }

      // Refresh thành công → set cookie mới
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', data.user!.id)
      
      const response = NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })

      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })

      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      })

      return response
    }

    if (error || !user) {
      throw new Error('Invalid token')
    }

    // Token hợp lệ → set header và tiếp tục
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })

  } catch {
    const response = NextResponse.redirect(new URL('/auth/login', request.url))
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    return response
  }
}

// ✅ FIX: Thêm api/auth và auth vào matcher
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}