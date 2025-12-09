// app/api/users/[id]/follow/route.ts - WITH DEBUG
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
    
    // ✅ LOG 1: Check input
    console.log('[FOLLOW API] Input:', {
      targetUserId,
      followerUserId,
      body
    })

    if (!followerUserId) {
      console.error('[FOLLOW API] Missing user_id')
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // ✅ LOG 2: Check existing follow
    const { data: existing, error: checkError } = await supabase
      .from('follows')
      .select('id')
      .match({ follower_id: followerUserId, following_id: targetUserId })
      .maybeSingle()

    console.log('[FOLLOW API] Check existing:', { existing, checkError })

    if (checkError) {
      console.error('[FOLLOW API] Check error:', checkError)
      throw checkError
    }

    if (existing) {
      // UNFOLLOW
      console.log('[FOLLOW API] Unfollowing...')
      
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: followerUserId, following_id: targetUserId })

      if (deleteError) {
        console.error('[FOLLOW API] Delete error:', deleteError)
        throw deleteError
      }
      
      console.log('[FOLLOW API] Unfollowed successfully')
      return NextResponse.json({ success: true, action: 'unfollowed' })
      
    } else {
      // FOLLOW
      console.log('[FOLLOW API] Following...')
      
      const { data: inserted, error: insertError } = await supabase
        .from('follows')
        .insert({ 
          follower_id: followerUserId, 
          following_id: targetUserId 
        })
        .select()

      console.log('[FOLLOW API] Insert result:', { inserted, insertError })

      if (insertError) {
        console.error('[FOLLOW API] Insert error:', insertError)
        throw insertError
      }
      
      console.log('[FOLLOW API] Followed successfully')
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
    const { data } = await supabase
      .from('follows')
      .select('id')
      .match({ follower_id: followerUserId, following_id: targetUserId })
      .maybeSingle()

    return NextResponse.json({ isFollowing: !!data })
  } catch (error) {
    console.error('[FOLLOW API] Check follow error:', error)
    return NextResponse.json({ isFollowing: false })
  }
}