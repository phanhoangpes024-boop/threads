// app/api/auth/register/route.ts - ✅ THAY TOÀN BỘ
import { NextResponse } from 'next/server';
import { supabase, supabaseServer } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, username, avatarText, avatarBg } = await request.json();
    console.log('📝 Register body:', email, password, username, avatarText, avatarBg); // ← THÊM

    if (!email || !password || !username || !avatarText) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Kiểm tra username đã tồn tại
    const { data: existingUsername } = await supabaseServer
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username đã được sử dụng' },
        { status: 409 }
      );
    }

    // ✅ Tạo auth user
    const { data: authData, error: signUpError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    console.log('🔐 Auth result:', { authData, signUpError }); // ← THÊM

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // ✅ Tạo profile với CÙNG ID
    const { data: newUser, error: insertError } = await supabaseServer
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
      .single();

    if (insertError) {
      // Rollback
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Đăng ký thất bại' },
      { status: 500 }
    );
  }
}