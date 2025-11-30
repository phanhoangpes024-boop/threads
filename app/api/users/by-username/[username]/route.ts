// app/api/users/by-username/[username]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_text, verified, bio, created_at')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Đếm followers
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)

    // Đếm following
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    return NextResponse.json({
      ...user,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}