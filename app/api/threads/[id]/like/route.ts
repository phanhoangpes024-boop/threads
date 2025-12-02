// app/api/threads/[id]/like/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }
  
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('thread_id', params.id)
    .eq('user_id', user_id)
    .maybeSingle()
  
  return NextResponse.json({ isLiked: !!data })
}

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
    console.log('[LIKE API] Calling RPC:', { threadId, user_id })
    
    const { data, error } = await supabase.rpc('toggle_like', {
      p_thread_id: threadId,
      p_user_id: user_id
    })
    
    if (error) {
      console.error('[LIKE API] RPC error:', error)
      throw error
    }
    
    console.log('[LIKE API] RPC success:', data)
    
    // ✅ FIX: Thêm threadId vào response
    return NextResponse.json({
      success: data.success,
      action: data.action,
      likes_count: data.likes_count,
      threadId  // ← THIẾU CÁI NÀY LÀM BUG +2
    })
    
  } catch (error: any) {
    console.error('[LIKE API] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to toggle like' 
      }, 
      { status: 500 }
    )
  }
}