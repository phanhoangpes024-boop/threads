// app/api/users/[id]/threads/route.ts - UPDATED
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await context.params
  const { searchParams } = new URL(request.url)
  const currentUserId = searchParams.get('current_user_id')

  try {
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        id,
        user_id,
        content,
        created_at,
        likes_count,
        comments_count,
        reposts_count,
        users (username, avatar_text, avatar_bg, verified)
      `)
      // ← CHỈ THÊM avatar_bg VÀO SELECT
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Check liked status
    let likedThreadIds = new Set<string>()
    if (currentUserId && threads?.length) {
      const threadIds = threads.map(t => t.id)
      const { data: likes } = await supabase
        .from('likes')
        .select('thread_id')
        .in('thread_id', threadIds)
        .eq('user_id', currentUserId)
      
      likedThreadIds = new Set(likes?.map(l => l.thread_id) || [])
    }

    // ✅ Fetch medias cho tất cả threads
    let mediasMap = new Map<string, any[]>()
    if (threads?.length) {
      const threadIds = threads.map(t => t.id)
      const { data: medias } = await supabase
        .from('thread_medias')
        .select('*')
        .in('thread_id', threadIds)
        .order('order_index', { ascending: true })
      
      medias?.forEach(m => {
        if (!mediasMap.has(m.thread_id)) {
          mediasMap.set(m.thread_id, [])
        }
        mediasMap.get(m.thread_id)!.push(m)
      })
    }

    const formatted = (threads || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      created_at: t.created_at,
      likes_count: t.likes_count || 0,
      comments_count: t.comments_count || 0,
      reposts_count: t.reposts_count || 0,
      username: t.users?.username ?? null,
      avatar_text: t.users?.avatar_text ?? null,
      avatar_bg: t.users?.avatar_bg ?? '#0077B6', // ← THÊM DÒNG NÀY
      verified: t.users?.verified ?? false,
      
      is_liked: likedThreadIds.has(t.id),
      
      medias: (mediasMap.get(t.id) || []).map(m => ({
        id: m.id,
        url: m.url,
        type: m.media_type || 'image',
        width: m.width,
        height: m.height,
        order: m.order_index
      }))
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching user threads:', error)
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }
}