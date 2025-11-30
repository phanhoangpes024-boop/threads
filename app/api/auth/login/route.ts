// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Tìm user theo email và password
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, avatar_text, verified, bio, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // So sánh password trực tiếp
    if (user.password_hash !== password) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const { password_hash, ...userInfo } = user;

    return NextResponse.json({
      success: true,
      user: userInfo,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}