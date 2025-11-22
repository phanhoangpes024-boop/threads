import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Bước 1: Lấy threads + join users
  const { data: threads, error } = await supabase
    .from('threads')
    .select(`
      *,
      users!inner (
        username,
        avatar_text,
        verified
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Bước 2: Đếm likes, comments, reposts cho từng thread
  const threadsWithStats = await Promise.all(
    threads.map(async (thread) => {
      // Đếm realtime từ các bảng
      const [likesResult, commentsResult, repostsResult] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id),
        supabase
          .from('reposts')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id),
      ])
      
      // Bước 3: Ghép data
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
}

export async function POST(request: Request) {
  try {
    const { user_id, content, image_url } = await request.json()
    
    // Validate input
    if (!user_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'user_id and content are required' }, 
        { status: 400 }
      )
    }
    
    // Insert thread vào database
    const { data, error } = await supabase
      .from('threads')
      .insert({ 
        user_id, 
        content: content.trim(), 
        image_url: image_url || null 
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating thread:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/threads:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}