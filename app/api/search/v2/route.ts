// app/api/search/v2/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const userId = searchParams.get('user_id')
  
  if (!query || query.trim().length < 1) {
    return NextResponse.json({ threads: [], users: [] })
  }

  try {
    const { data, error } = await supabase.rpc('global_search', {
      p_keyword: query.trim(),
      p_current_user_id: userId || null,
      p_limit: 30
    })

    if (error) {
      console.error('Search RPC Error:', error)
      throw error
    }

    const threads = data
      ?.filter((r: any) => r.result_type === 'thread')
      .map((r: any) => ({
        id: r.thread_id,
        user_id: r.thread_user_id,
        content: r.thread_content,
        created_at: r.thread_created_at,
        likes_count: r.thread_likes_count,
        comments_count: r.thread_comments_count,
        reposts_count: r.thread_reposts_count,
        username: r.author_username,
        avatar_text: r.author_avatar_text,
        avatar_bg: r.author_avatar_bg || '#0077B6', // ✅ THÊM
        verified: r.author_verified,
        medias: r.medias || [],
        isLiked: r.is_liked
      })) || []

    const users = data
      ?.filter((r: any) => r.result_type === 'user')
      .map((r: any) => ({
        id: r.user_id,
        username: r.user_username,
        bio: r.user_bio,
        avatar_text: r.user_avatar_text,
        avatar_bg: r.user_avatar_bg || '#0077B6', // ✅ THÊM
        verified: r.user_verified,
        followers_count: r.user_followers_count
      })) || []

    return NextResponse.json({ threads, users })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}