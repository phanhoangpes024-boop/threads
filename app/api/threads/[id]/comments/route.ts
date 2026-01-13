// app/api/threads/[id]/comments/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

interface CommentRow {
  id: string
  content: string
  created_at: string
  users: {
    username: string
    avatar_text: string
    avatar_bg: string
  } | null
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await context.params
    const { searchParams } = new URL(request.url)
    
    const limit = 10
    const cursor = searchParams.get('cursor')
    const cursorId = searchParams.get('cursor_id')

    let query = supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        users:user_id (
          username,
          avatar_text,
          avatar_bg
        )
      `)
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (cursor && cursorId) {
      query = query
        .lt('created_at', cursor)
        .neq('id', cursorId)
    }

    const { data, error } = await query

    if (error) throw error

    const comments = (data || []) as unknown as CommentRow[]
    const hasMore = comments.length > limit
    const items = hasMore ? comments.slice(0, limit) : comments

    const formatted = items.map((c) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      username: c.users?.username || 'Unknown',
      avatar_text: c.users?.avatar_text || 'U',
      avatar_bg: c.users?.avatar_bg || '#0077B6'
    }))

    const nextCursor = hasMore && formatted.length > 0
      ? {
          cursor: formatted[formatted.length - 1].created_at,
          cursor_id: formatted[formatted.length - 1].id
        }
      : null

    return NextResponse.json({
      comments: formatted,
      nextCursor
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}