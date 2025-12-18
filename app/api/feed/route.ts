// app/api/feed/route.ts - FIXED WITH FEED TYPE SUPPORT
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface FeedMedia {
  id: string
  url: string
  type: 'image' | 'video'
  width: number | null
  height: number | null
  order: number
}

interface FeedThread {
  id: string
  user_id: string
  content: string
  created_at: string
  likes_count: number
  comments_count: number
  reposts_count: number
  username: string
  avatar_text: string
  avatar_bg: string
  verified: boolean
  is_liked: boolean
  medias: FeedMedia[]
}

interface FeedResponse {
  threads: FeedThread[]
  nextCursor: { time: string; id: string } | null
  hasMore: boolean
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const userId = searchParams.get('user_id')
  const cursorTime = searchParams.get('cursor_time')
  const cursorId = searchParams.get('cursor_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  
  // ✅ THÊM: Parse feed_type param
  const feedType = searchParams.get('feed_type') || 'for-you'

  if (!userId) {
    return NextResponse.json(
      { error: 'user_id is required' }, 
      { status: 400 }
    )
  }

  try {
    // ✅ THAY ĐỔI: Chọn RPC function dựa vào feed_type
    const rpcFunction = feedType === 'following' 
      ? 'get_following_feed' 
      : 'get_feed_optimized'

    const { data, error } = await supabase.rpc(rpcFunction, {
      p_user_id: userId,
      p_cursor_time: cursorTime || null,
      p_cursor_id: cursorId || null,
      p_limit: limit
    })

    if (error) {
      console.error(`[${feedType.toUpperCase()} FEED] RPC error:`, error)
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      )
    }

    // Map data với avatar_bg
    const threads: FeedThread[] = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      
      likes_count: t.likes_count ?? 0,
      comments_count: t.comments_count ?? 0,
      reposts_count: t.reposts_count ?? 0,
      
      username: t.username,
      avatar_text: t.avatar_text,
      avatar_bg: t.avatar_bg || '#0077B6',
      verified: t.verified ?? false,
      is_liked: t.is_liked ?? false,
      
      medias: Array.isArray(t.medias) 
        ? t.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.media_type || m.type || 'image',
            width: m.width ?? null,
            height: m.height ?? null,
            order: m.order_index ?? m.order ?? 0
          }))
        : []
    }))

    const nextCursor = threads.length === limit && threads.length > 0
      ? {
          time: threads[threads.length - 1].created_at,
          id: threads[threads.length - 1].id
        }
      : null

    const response: FeedResponse = {
      threads,
      nextCursor,
      hasMore: threads.length === limit
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error(`[${feedType.toUpperCase()} FEED] Unexpected error:`, error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}