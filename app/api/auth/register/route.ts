// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, username, avatarText } = await request.json();

    // Validation
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

    // Kiểm tra email đã tồn tại
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email đã được đăng ký' },
        { status: 409 }
      );
    }

    // Kiểm tra username đã tồn tại
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username đã được sử dụng' },
        { status: 409 }
      );
    }

    // Tạo user - lưu password trực tiếp (demo only)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        avatar_text: avatarText.toUpperCase(),
        password_hash: password, // Lưu thẳng password
        verified: false,
      })
      .select('id, email, username, avatar_text, verified, bio')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
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