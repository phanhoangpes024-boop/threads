// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all' // 'threads', 'users', 'all'
  
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 })
  }

  try {
    const results: any = {}

    // Search threads
    if (type === 'threads' || type === 'all') {
      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select(`
          *,
          users!inner (
            username,
            avatar_text,
            verified
          )
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (threadsError) throw threadsError

      const threadsWithStats = await Promise.all(
        (threads || []).map(async (thread: any) => {
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

      results.threads = threadsWithStats
    }

    // Search users
    if (type === 'users' || type === 'all') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(20)

      if (usersError) throw usersError

      results.users = users || []
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}