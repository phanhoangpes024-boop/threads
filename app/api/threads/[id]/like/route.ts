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
    .match({ thread_id: params.id, user_id })
    .single()
  
  return NextResponse.json({ isLiked: !!data })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { user_id } = await request.json()
  
  // Check đã like chưa
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .match({ thread_id: params.id, user_id })
    .single()
  
  if (existing) {
    // Đã like → unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ thread_id: params.id, user_id })
    
    if (error) {
      console.error('Error unliking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, action: 'unliked' })
  }
  
  // Chưa like → like
  const { error } = await supabase
    .from('likes')
    .insert({ thread_id: params.id, user_id })
  
  if (error) {
    console.error('Error liking:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, action: 'liked' })
}