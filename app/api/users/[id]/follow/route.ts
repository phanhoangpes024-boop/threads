// app/api/users/[id]/follow/route.ts - UPDATED WITH RPC
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const targetUserId = params.id
  
  try {
    const body = await request.json()
    const followerUserId = body.user_id
    
    if (!followerUserId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // ✅ Dùng RPC check_is_following
    const { data: isFollowing, error: checkError } = await supabase.rpc('check_is_following', {
      p_follower_id: followerUserId,
      p_following_id: targetUserId
    })

    if (checkError) {
      console.error('[FOLLOW API] Check error:', checkError)
      throw checkError
    }

    if (isFollowing) {
      // UNFOLLOW
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: followerUserId, following_id: targetUserId })

      if (deleteError) {
        console.error('[FOLLOW API] Delete error:', deleteError)
        throw deleteError
      }
      
      return NextResponse.json({ success: true, action: 'unfollowed' })
      
    } else {
      // FOLLOW
      const { error: insertError } = await supabase
        .from('follows')
        .insert({ 
          follower_id: followerUserId, 
          following_id: targetUserId 
        })

      if (insertError) {
        console.error('[FOLLOW API] Insert error:', insertError)
        throw insertError
      }
      
      return NextResponse.json({ success: true, action: 'followed' })
    }
    
  } catch (error: any) {
    console.error('[FOLLOW API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Failed to toggle follow',
      details: error.message 
    }, { status: 500 })
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
    // ✅ Dùng RPC check_is_following
    const { data: isFollowing, error } = await supabase.rpc('check_is_following', {
      p_follower_id: followerUserId,
      p_following_id: targetUserId
    })

    if (error) {
      console.error('[FOLLOW API] Check error:', error)
      return NextResponse.json({ isFollowing: false })
    }

    return NextResponse.json({ isFollowing: isFollowing || false })
  } catch (error) {
    console.error('[FOLLOW API] Check follow error:', error)
    return NextResponse.json({ isFollowing: false })
  }
}