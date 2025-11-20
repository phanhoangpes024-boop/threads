import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  const { data: thread, error } = await supabase
    .from('threads')
    .select(`
      *,
      users!inner (
        username,
        avatar_text,
        verified
      )
    `)
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Đếm stats
  const [likesResult, commentsResult, repostsResult] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('thread_id', params.id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('thread_id', params.id),
    supabase.from('reposts').select('*', { count: 'exact', head: true }).eq('thread_id', params.id),
  ])
  
  return NextResponse.json({
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
  })
}