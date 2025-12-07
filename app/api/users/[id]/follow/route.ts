// app/api/users/[id]/follow/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const targetUserId = params.id
  const { user_id: followerUserId } = await request.json()

  if (!followerUserId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  try {
    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .match({ follower_id: followerUserId, following_id: targetUserId })
      .single()

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: followerUserId, following_id: targetUserId })

      if (error) throw error
      return NextResponse.json({ success: true, action: 'unfollowed' })
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerUserId, following_id: targetUserId })

      if (error) throw error
      return NextResponse.json({ success: true, action: 'followed' })
    }
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Failed to toggle follow' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const targetUserId = params.id
  const { searchParams } = new URL(request.url)
  const followerUserId = searchParams.get('user_id')

  if (!followerUserId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  try {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .match({ follower_id: followerUserId, following_id: targetUserId })
      .single()

    return NextResponse.json({ isFollowing: !!data })
  } catch (error) {
    console.error('Check follow error:', error)
    return NextResponse.json({ isFollowing: false })
  }
}