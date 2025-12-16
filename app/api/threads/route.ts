// app/api/threads/route.ts - UPDATED WITH RPC
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')
  const userId = searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }
  
  try {
    const { data, error } = await supabase.rpc('get_all_threads', {
      p_user_id: userId,
      p_cursor: cursor || null,
      p_limit: limit
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
      isLiked: t.is_liked || false,
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
    
    return NextResponse.json({
      threads,
      nextCursor: threads.length === limit 
        ? threads[threads.length - 1].created_at 
        : null
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, content, image_urls } = await request.json()
    
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

    if (image_urls && (!Array.isArray(image_urls) || image_urls.length > 10)) {
      return NextResponse.json(
        { error: 'image_urls must be array with max 10 items' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('threads')
      .insert({ 
        user_id, 
        content: content.trim(), 
        image_urls: image_urls || []
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