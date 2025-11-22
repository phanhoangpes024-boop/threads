// app/api/users/[id]/activity/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const userId = params.id

  try {
    // Get threads where user is author
    const { data: authorThreads } = await supabase
      .from('threads')
      .select(`
        *,
        users!inner (
          username,
          avatar_text,
          verified
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get threads where user has liked
    const { data: likedThreadIds } = await supabase
      .from('likes')
      .select('thread_id')
      .eq('user_id', userId)

    const likedIds = likedThreadIds?.map(l => l.thread_id) || []

    let likedThreads: any[] = []
    if (likedIds.length > 0) {
      const { data } = await supabase
        .from('threads')
        .select(`
          *,
          users!inner (
            username,
            avatar_text,
            verified
          )
        `)
        .in('id', likedIds)
        .order('created_at', { ascending: false })
      
      likedThreads = data || []
    }

    // Get threads where user has commented
    const { data: commentedThreadIds } = await supabase
      .from('comments')
      .select('thread_id')
      .eq('user_id', userId)

    const commentedIds = commentedThreadIds?.map(c => c.thread_id) || []

    let commentedThreads: any[] = []
    if (commentedIds.length > 0) {
      const { data } = await supabase
        .from('threads')
        .select(`
          *,
          users!inner (
            username,
            avatar_text,
            verified
          )
        `)
        .in('id', commentedIds)
        .order('created_at', { ascending: false })
      
      commentedThreads = data || []
    }

    // Combine and deduplicate
    const allThreads = [...(authorThreads || []), ...likedThreads, ...commentedThreads]
    const uniqueThreadsMap = new Map()
    allThreads.forEach(thread => {
      if (!uniqueThreadsMap.has(thread.id)) {
        uniqueThreadsMap.set(thread.id, thread)
      }
    })

    const uniqueThreads = Array.from(uniqueThreadsMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Get stats for each thread
    const threadsWithStats = await Promise.all(
      uniqueThreads.map(async (thread) => {
        const [likesResult, commentsResult, repostsResult] = await Promise.all([
          supabase.from('likes').select('*', { count: 'exact', head: true }).eq('thread_id', thread.id),
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('thread_id', thread.id),
          supabase.from('reposts').select('*', { count: 'exact', head: true }).eq('thread_id', thread.id),
        ])

        return {
          id: thread.id,
          user_id: thread.user_id,
          content: thread.content,
          image_url: thread.image_url,
          created_at: thread.created_at,
          username: thread.users.username,
          avatar_text: thread.users.avatar_text,
          verified: thread.users.verified,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0,
          reposts_count: repostsResult.count || 0,
        }
      })
    )

    return NextResponse.json(threadsWithStats)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}