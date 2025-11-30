// app/api/search/route.ts - UPDATED
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const THREAD_SELECT = `
  id,
  user_id,
  content,
  image_urls,
  created_at,
  likes_count,
  comments_count,
  reposts_count,
  users (username, avatar_text, verified)
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all'
  
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 })
  }

  try {
    const results: any = {}

    // Search threads
    if (type === 'threads' || type === 'all') {
      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select(THREAD_SELECT)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (threadsError) throw threadsError

      results.threads = (threads || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        content: t.content,
        image_urls: t.image_urls || [],
        created_at: t.created_at,
        username: t.users?.username ?? null,
        avatar_text: t.users?.avatar_text ?? null,
        verified: t.users?.verified ?? false,
        likes_count: t.likes_count || 0,
        comments_count: t.comments_count || 0,
        reposts_count: t.reposts_count || 0,
      }))
    }

    // Search users
    if (type === 'users' || type === 'all') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, bio, avatar_text, verified')
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