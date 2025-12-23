// app/api/threads/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  try {
    const { data, error } = await supabase.rpc('get_thread_detail', {
      p_thread_id: id,
      p_user_id: userId || null
    })

    if (error) {
      console.error('Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const thread = Array.isArray(data) ? data[0] : data

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const result = {
      id: thread.id,
      user_id: thread.user_id,
      content: thread.content,
      created_at: thread.created_at,
      likes_count: thread.likes_count || 0,
      comments_count: thread.comments_count || 0,
      reposts_count: thread.reposts_count || 0,
      username: thread.username,
      avatar_text: thread.avatar_text,
      avatar_bg: thread.avatar_bg || '#0077B6',
      verified: thread.verified || false,
      is_liked: thread.is_liked || false,
      medias: Array.isArray(thread.medias)
        ? thread.medias.map((m: any) => ({
            id: m.id,
            url: m.url,
            type: m.media_type || 'image',
            width: m.width || null,
            height: m.height || null,
            order: m.order_index || 0
          }))
        : []
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ XÓA THREAD
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  try {
    // Check quyền sở hữu
    const { data: thread } = await supabase
      .from('threads')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    if (thread.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Xóa thread
    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting thread:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ SỬA THREAD
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  
  try {
    const body = await request.json()
    const { user_id, content, image_urls } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    // Check quyền sở hữu
    const { data: thread } = await supabase
      .from('threads')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    if (thread.user_id !== user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update thread
    const { data: updated, error } = await supabase
      .from('threads')
      .update({ 
        content: content.trim(),
        image_urls: image_urls || []
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating thread:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update thread_medias nếu có
    if (image_urls) {
      // Xóa media cũ
      await supabase
        .from('thread_medias')
        .delete()
        .eq('thread_id', id)

      // Thêm media mới
      if (image_urls.length > 0) {
        const medias = image_urls.map((url: string, index: number) => ({
          thread_id: id,
          url,
          media_type: 'image',
          order_index: index
        }))

        await supabase
          .from('thread_medias')
          .insert(medias)
      }
    }

    return NextResponse.json({ success: true, thread: updated })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}