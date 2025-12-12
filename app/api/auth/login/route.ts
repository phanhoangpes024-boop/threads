// app/api/auth/login/route.ts - ✅ THAY TOÀN BỘ
import { NextResponse } from 'next/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // ✅ Đăng nhập với Supabase Auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // ✅ Lấy profile
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, username, avatar_text, avatar_bg, verified, bio')
      .eq('id', authData.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      session: authData.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đăng nhập thất bại' },
      { status: 500 }
    );
  }
}