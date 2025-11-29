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

    // Gọi RPC function để verify password
    const { data: user, error } = await supabase
      .rpc('verify_user_password', {
        user_email: email,
        user_password: password
      });

    if (error || !user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Trả về user info (password_hash đã bị loại bỏ trong SQL function)
    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}