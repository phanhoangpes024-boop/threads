// app/api/auth/set-password/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email và mật khẩu mới là bắt buộc' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Kiểm tra user tồn tại
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      );
    }

    // Hash password bằng Supabase RPC (gọi function SQL)
    const { data: hashResult, error: hashError } = await supabase
      .rpc('hash_password', { password: newPassword });

    if (hashError) {
      throw hashError;
    }

    // Update password_hash
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashResult })
      .eq('email', email);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Đã tạo mật khẩu thành công',
    });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: 'Không thể tạo mật khẩu' },
      { status: 500 }
    );
  }
}