// app/api/users/[id]/threads/route.ts
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
        image_url,
        created_at,
        likes_count,
        comments_count,
        reposts_count,
        users (username, avatar_text, verified)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Check liked status nếu có current user
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

    const formatted = (threads || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      content: t.content,
      image_url: t.image_url,
      created_at: t.created_at,
      likes_count: t.likes_count || 0,
      comments_count: t.comments_count || 0,
      reposts_count: t.reposts_count || 0,
      username: t.users?.username ?? null,
      avatar_text: t.users?.avatar_text ?? null,
      verified: t.users?.verified ?? false,
      isLiked: likedThreadIds.has(t.id),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching user threads:', error)
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }
}