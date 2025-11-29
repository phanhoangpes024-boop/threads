// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  // Không cần gọi Supabase Auth vì không dùng
  // Client sẽ tự xóa localStorage
  return NextResponse.json({ success: true });
} NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Đăng xuất thất bại' },
      { status: 500 }
    );
  }
}