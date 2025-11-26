import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { MOCK_USER } from '@/lib/currentUser'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')
  
  let query = supabase
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
      users (
        username,
        avatar_text,
        verified
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (cursor) {
    query = query.lt('created_at', cursor)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Get liked status for current user
  const threadIds = data?.map(t => t.id) || []
  const { data: likes } = await supabase
    .from('likes')
    .select('thread_id')
    .in('thread_id', threadIds)
    .eq('user_id', MOCK_USER.id)
  
  const likedThreadIds = new Set(likes?.map(l => l.thread_id) || [])
  
  const threads = (data as any)?.map((t: any) => ({
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
  })) || []
  
  return NextResponse.json({
    threads,
    nextCursor: threads.length === limit ? threads[threads.length - 1].created_at : null
  })
}

export async function POST(request: Request) {
  try {
    const { user_id, content, image_url } = await request.json()
    
    if (!user_id || !content?.trim()) {
      return NextResponse.json(
        { error: 'user_id and content required' }, 
        { status: 400 }
      )
    }
    
    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Content max 500 chars' }, 
        { status: 400 }
      )
    }
    
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
      console.error('Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}