// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      )
    }

    // Đăng nhập với Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // ✅ FIX: Kiểm tra session trước khi dùng
    if (signInError || !authData?.session) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Lấy profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, avatar_text, avatar_bg, verified, bio')
      .eq('id', authData.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    const response = NextResponse.json({ success: true, user })

    // ✅ Destructure để tránh lỗi
    const { session } = authData
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/'
    }

    response.cookies.set('sb-access-token', session.access_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7
    })

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Đăng nhập thất bại' },
      { status: 500 }
    )
  }
}