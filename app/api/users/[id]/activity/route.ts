// app/api/users/[id]/activity/route.ts - UPDATED WITH RPC
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await context.params

  try {
    const { data, error } = await supabase.rpc('get_user_activity', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map để giữ format cũ
    const threads = (data || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      likes_count: t.likes_count || 0,
      comments_count: t.comments_count || 0,
      reposts_count: t.reposts_count || 0,
      username: t.username,
      avatar_text: t.avatar_text,
      avatar_bg: t.avatar_bg || '#0077B6',
      verified: t.verified || false,
      medias: Array.isArray(t.medias)
        ? t.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.type || 'image',
            width: m.width || null,
            height: m.height || null,
            order: m.order || 0
          }))
        : []
    }))

    return NextResponse.json(threads)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}