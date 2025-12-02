// app/api/feed/route.ts - PRODUCTION FEED API
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Types
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
  
  // Parse params
  const userId = searchParams.get('user_id')
  const cursorTime = searchParams.get('cursor_time')
  const cursorId = searchParams.get('cursor_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  if (!userId) {
    return NextResponse.json(
      { error: 'user_id is required' }, 
      { status: 400 }
    )
  }

  try {
    // Call RPC function - ONE QUERY cho tất cả data
    const { data, error } = await supabase.rpc('get_feed_optimized', {
      p_user_id: userId,
      p_cursor_time: cursorTime || null,
      p_cursor_id: cursorId || null,
      p_limit: limit
    })

    if (error) {
      console.error('Feed RPC error:', error)
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      )
    }

    // Format response
    const threads: FeedThread[] = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      likes_count: t.likes_count,
      comments_count: t.comments_count,
      reposts_count: t.reposts_count,
      username: t.username,
      avatar_text: t.avatar_text,
      verified: t.verified,
      is_liked: t.is_liked,
      medias: t.medias || []
    }))

    // Tính nextCursor (composite cursor)
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
    console.error('Unexpected feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}