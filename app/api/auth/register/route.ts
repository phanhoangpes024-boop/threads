// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, username, avatarText, avatarBg } = await request.json()

    // 1. Kiểm tra đầu vào
    if (!email || !password || !username || !avatarText) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // 2. Kiểm tra username tồn tại
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username đã được sử dụng' },
        { status: 409 }
      )
    }

    // 3. Tạo auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { error: signUpError?.message || 'Lỗi đăng ký' },
        { status: 400 }
      )
    }

    // 4. Tạo profile trong DB
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        avatar_text: avatarText.toUpperCase(),
        avatar_bg: avatarBg || '#0077B6',
        verified: false,
      })
      .select('id, email, username, avatar_text, avatar_bg, verified, bio')
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // 5. Đăng nhập để lấy session
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // ✅ FIX: Kiểm tra sessionData trước khi dùng
    if (signInError || !sessionData?.session) {
      return NextResponse.json(
        { error: 'Không thể tạo phiên đăng nhập' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true, user: newUser })

    // 6. Set Cookies an toàn
    const session = sessionData.session
    response.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response

  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Server Error' },
      { status: 500 }
    )
  }
}