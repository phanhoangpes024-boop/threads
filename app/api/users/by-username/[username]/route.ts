// app/api/users/by-username/[username]/route.ts - FIXED (DÙNG FIELD CÓ SẴN)
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params

  try {
    // ✅ CHỈ 1 QUERY - Dùng fields có sẵn trong table users
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_text, avatar_bg, verified, bio, created_at, followers_count, following_count, threads_count')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ✅ Trả luôn, không cần count thêm
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}