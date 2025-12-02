// app/api/threads/[id]/like/route.ts - FIXED NO SQL METHOD
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('thread_id', params.id)
    .eq('user_id', user_id)
    .maybeSingle()
  
  return NextResponse.json({ isLiked: !!data })
}

// ✅ FIX: Manual increment/decrement thay vì dùng supabase.sql
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const threadId = params.id
  const { user_id } = await request.json()
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  try {
    // 1. Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('thread_id', threadId)
      .eq('user_id', user_id)
      .maybeSingle()

    let action: 'liked' | 'unliked'
    
    if (existingLike) {
      // UNLIKE: Delete like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)
      
      if (deleteError) throw deleteError
      
      // ✅ Decrement count - MANUAL
      const { data: currentThread } = await supabase
        .from('threads')
        .select('likes_count')
        .eq('id', threadId)
        .single()
      
      const newCount = Math.max(0, (currentThread?.likes_count || 0) - 1)
      
      await supabase
        .from('threads')
        .update({ likes_count: newCount })
        .eq('id', threadId)
      
      action = 'unliked'
      
    } else {
      // LIKE: Insert like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          thread_id: threadId,
          user_id: user_id
        })
      
      if (insertError) throw insertError
      
      // ✅ Increment count - MANUAL
      const { data: currentThread } = await supabase
        .from('threads')
        .select('likes_count')
        .eq('id', threadId)
        .single()
      
      const newCount = (currentThread?.likes_count || 0) + 1
      
      await supabase
        .from('threads')
        .update({ likes_count: newCount })
        .eq('id', threadId)
      
      action = 'liked'
    }
    
    // 2. Get updated count
    const { data: thread } = await supabase
      .from('threads')
      .select('likes_count')
      .eq('id', threadId)
      .single()
    
    const likes_count = thread?.likes_count ?? 0
    
    console.log(`[LIKE API] ${action} - Thread ${threadId} - Count: ${likes_count}`)
    
    return NextResponse.json({
      success: true,
      action,
      likes_count
    })
    
  } catch (error: any) {
    console.error('[LIKE API ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' }, 
      { status: 500 }
    )
  }
}