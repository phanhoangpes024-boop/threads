// app/api/public-feed/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  try {
    const { data, error } = await supabase.rpc('get_feed_optimized', {
      p_user_id: null, // Guest mode
      p_cursor_time: null,
      p_cursor_id: null,
      p_limit: limit
    })

    if (error) {
      console.error('[PUBLIC FEED] RPC error:', error)
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
      avatar_bg: t.avatar_bg || '#0077B6',
      verified: t.verified ?? false,
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

    return NextResponse.json(
      { threads, total: threads.length },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      }
    )

  } catch (error) {
    console.error('[PUBLIC FEED] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}