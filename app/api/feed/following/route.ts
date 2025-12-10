// app/api/feed/following/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface FeedMedia {
  id: string
  url: string
  media_type: 'image' | 'video'
  width: number | null
  height: number | null
  order_index: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
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
    const { data, error } = await supabase.rpc('get_following_feed', {
      p_user_id: userId,
      p_cursor_time: cursorTime || null,
      p_cursor_id: cursorId || null,
      p_limit: limit
    })

    if (error) {
      console.error('Following feed RPC error:', error)
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      )
    }

    const threads = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      likes_count: t.likes_count ?? 0,
      comments_count: t.comments_count ?? 0,
      reposts_count: t.reposts_count ?? 0,
      username: t.username,
      avatar_text: t.avatar_text,
      avatar_bg: t.avatar_bg || '#0077B6', // ← THÊM DÒNG NÀY
      verified: t.verified ?? false,
      is_liked: t.is_liked ?? false,
      medias: Array.isArray(t.medias) 
        ? t.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.media_type || 'image',
            width: m.width ?? null,
            height: m.height ?? null,
            order: m.order_index ?? 0
          }))
        : []
    }))

    const nextCursor = threads.length === limit && threads.length > 0
      ? {
          time: threads[threads.length - 1].created_at,
          id: threads[threads.length - 1].id
        }
      : null

    return NextResponse.json({
      threads,
      nextCursor,
      hasMore: threads.length === limit
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    })

  } catch (error) {
    console.error('Unexpected following feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}