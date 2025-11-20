import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      users!inner (
        username,
        avatar_text,
        verified
      )
    `)
    .eq('thread_id', params.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const formatted = comments.map(comment => ({
    id: comment.id,
    thread_id: comment.thread_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: comment.created_at,
    username: comment.users.username,
    avatar_text: comment.users.avatar_text,
    verified: comment.users.verified,
  }))
  
  return NextResponse.json(formatted)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { user_id, content } = await request.json()
  
  const { data, error } = await supabase
    .from('comments')
    .insert({ thread_id: params.id, user_id, content })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}