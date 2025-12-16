// app/api/threads/[id]/route.ts - UPDATED WITH RPC
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

    if (!data) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Map để giữ format cũ
    const result = {
      id: data.id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      likes_count: data.likes_count || 0,
      comments_count: data.comments_count || 0,
      reposts_count: data.reposts_count || 0,
      username: data.username,
      avatar_text: data.avatar_text,
      avatar_bg: data.avatar_bg || '#0077B6',
      verified: data.verified || false,
      is_liked: data.is_liked || false,
      medias: Array.isArray(data.medias)
        ? data.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.type || 'image',
            width: m.width || null,
            height: m.height || null,
            order: m.order || 0
          }))
        : []
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}