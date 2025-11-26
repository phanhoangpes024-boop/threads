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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { user_id } = await request.json()
  
  // ✨ GỌI RPC FUNCTION - CHỈ 1 QUERY!
  const { data, error } = await supabase.rpc('toggle_like', {
    p_thread_id: params.id,
    p_user_id: user_id
  })

  if (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }

  // Response từ RPC: { success, action, likes_count }
  return NextResponse.json(data)
}