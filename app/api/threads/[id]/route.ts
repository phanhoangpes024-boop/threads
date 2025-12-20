// app/api/threads/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  try {
    const { data, error } = await supabase.rpc('get_thread_detail', {
      p_thread_id: id,
      p_user_id: userId || null
    })

    if (error) {
      console.error('Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ✅ FIX: RPC return TABLE = array, lấy phần tử đầu
    const thread = Array.isArray(data) ? data[0] : data

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const result = {
      id: thread.id,
      user_id: thread.user_id,
      content: thread.content,
      created_at: thread.created_at,
      likes_count: thread.likes_count || 0,
      comments_count: thread.comments_count || 0,
      reposts_count: thread.reposts_count || 0,
      username: thread.username,
      avatar_text: thread.avatar_text,
      avatar_bg: thread.avatar_bg || '#0077B6',
      verified: thread.verified || false,
      is_liked: thread.is_liked || false,
      medias: Array.isArray(thread.medias)
        ? thread.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.media_type || 'image',
            width: m.width || null,
            height: m.height || null,
            order: m.order_index || 0
          }))
        : []
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}